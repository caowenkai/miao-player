import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parseFile } from 'music-metadata';
import db from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/music');
const coverDir = path.join(__dirname, '../../uploads/covers');

[uploadDir, coverDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'music') {
      cb(null, uploadDir);
    } else if (file.fieldname === 'cover') {
      cb(null, coverDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'music') {
      const audioTypes = /mp3|wav|flac|m4a|ogg/;
      const extname = audioTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = audioTypes.test(file.mimetype);
      
      if (mimetype || extname) {
        return cb(null, true);
      }
      cb(new Error('只支持音频文件格式'));
    } else if (file.fieldname === 'cover') {
      const imageTypes = /jpeg|jpg|png|gif|webp/;
      const extname = imageTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = imageTypes.test(file.mimetype);
      
      if (mimetype || extname) {
        return cb(null, true);
      }
      cb(new Error('只支持图片文件格式'));
    } else {
      cb(null, true);
    }
  }
});

// 上传音乐
router.post('/upload', upload.fields([
  { name: 'music', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.music) {
      return res.status(400).json({ error: '请上传音乐文件' });
    }

    const musicFile = req.files.music[0];
    const coverFile = req.files.cover ? req.files.cover[0] : null;

    // 解析音频元数据
    let metadata = null;
    let duration = 0;
    let title = req.body.title || path.parse(musicFile.originalname).name;
    let artist = req.body.artist || '未知艺术家';
    let album = req.body.album || '';

    try {
      metadata = await parseFile(musicFile.path);
      duration = Math.floor(metadata.format.duration || 0);
      
      if (metadata.common) {
        title = metadata.common.title || title;
        artist = metadata.common.artist || artist;
        album = metadata.common.album || album;
      }
    } catch (err) {
      console.warn('Failed to parse metadata:', err.message);
    }

    const filePath = `/uploads/music/${musicFile.filename}`;
    const coverPath = coverFile ? `/uploads/covers/${coverFile.filename}` : null;
    const lyrics = req.body.lyrics || '';

    // 保存到数据库
    const stmt = db.prepare(`
      INSERT INTO music (title, artist, album, duration, file_path, cover_path, lyrics)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title, artist, album, duration, filePath, coverPath, lyrics);

    res.json({
      id: result.lastInsertRowid,
      title,
      artist,
      album,
      duration,
      file_path: filePath,
      cover_path: coverPath,
      lyrics
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: '上传失败', message: err.message });
  }
});

// 获取所有音乐列表
router.get('/list', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const search = req.query.search || '';
    
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM music';
    let countQuery = 'SELECT COUNT(*) as total FROM music';
    const params = [];

    if (search) {
      query += ' WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?';
      countQuery += ' WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const total = db.prepare(countQuery).get(...params).total;
    const list = db.prepare(query).all(...params, pageSize, offset);

    res.json({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: '获取列表失败', message: err.message });
  }
});

// 获取音乐详情
router.get('/:id', (req, res) => {
  try {
    const music = db.prepare('SELECT * FROM music WHERE id = ?').get(req.params.id);
    
    if (!music) {
      return res.status(404).json({ error: '音乐不存在' });
    }

    res.json(music);
  } catch (err) {
    console.error('Get music error:', err);
    res.status(500).json({ error: '获取音乐失败', message: err.message });
  }
});

// 更新音乐信息
router.put('/:id', (req, res) => {
  try {
    const { title, artist, album, lyrics } = req.body;
    
    const stmt = db.prepare(`
      UPDATE music 
      SET title = ?, artist = ?, album = ?, lyrics = ?
      WHERE id = ?
    `);

    const result = stmt.run(title, artist, album, lyrics, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '音乐不存在' });
    }

    const music = db.prepare('SELECT * FROM music WHERE id = ?').get(req.params.id);
    res.json(music);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: '更新失败', message: err.message });
  }
});

// 删除音乐
router.delete('/:id', (req, res) => {
  try {
    const music = db.prepare('SELECT * FROM music WHERE id = ?').get(req.params.id);
    
    if (!music) {
      return res.status(404).json({ error: '音乐不存在' });
    }

    // 删除文件
    const musicPath = path.join(__dirname, '../..', music.file_path);
    if (fs.existsSync(musicPath)) {
      fs.unlinkSync(musicPath);
    }

    if (music.cover_path) {
      const coverPath = path.join(__dirname, '../..', music.cover_path);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    // 删除数据库记录
    db.prepare('DELETE FROM music WHERE id = ?').run(req.params.id);

    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: '删除失败', message: err.message });
  }
});

export default router;

