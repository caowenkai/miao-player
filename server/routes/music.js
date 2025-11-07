const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseFile } = require('music-metadata');
const db = require('../db');

const router = express.Router();

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../uploads');
const musicDir = path.join(uploadsDir, 'music');
const coverDir = path.join(uploadsDir, 'covers');

[uploadsDir, musicDir, coverDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      cb(null, coverDir);
    } else {
      cb(null, musicDir);
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
      const allowedExts = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    } else if (file.fieldname === 'cover') {
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
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
    const musicFile = req.files['music'] ? req.files['music'][0] : null;
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

    if (!musicFile) {
      return res.status(400).json({ error: 'Music file is required' });
    }

    const filePath = `/uploads/music/${musicFile.filename}`;
    const coverPath = coverFile ? `/uploads/covers/${coverFile.filename}` : null;

    // 解析音乐元数据
    let metadata = {};
    try {
      metadata = await parseFile(musicFile.path);
    } catch (err) {
      console.log('Could not parse metadata:', err.message);
    }

    const title = req.body.title || metadata.common?.title || path.parse(musicFile.originalname).name;
    const artist = req.body.artist || metadata.common?.artist || 'Unknown Artist';
    const album = req.body.album || metadata.common?.album || '';
    const duration = metadata.format?.duration ? Math.floor(metadata.format.duration) : 0;
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
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
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
  } catch (error) {
    console.error('Get music list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取单个音乐详情
router.get('/:id', (req, res) => {
  try {
    const music = db.prepare('SELECT * FROM music WHERE id = ?').get(req.params.id);
    if (!music) {
      return res.status(404).json({ error: 'Music not found' });
    }
    res.json(music);
  } catch (error) {
    console.error('Get music error:', error);
    res.status(500).json({ error: error.message });
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
    
    stmt.run(title, artist, album, lyrics, req.params.id);
    
    const updated = db.prepare('SELECT * FROM music WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Update music error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除音乐
router.delete('/:id', (req, res) => {
  try {
    const music = db.prepare('SELECT * FROM music WHERE id = ?').get(req.params.id);
    if (!music) {
      return res.status(404).json({ error: 'Music not found' });
    }

    // 删除文件
    const musicPath = path.join(__dirname, '..', music.file_path);
    if (fs.existsSync(musicPath)) {
      fs.unlinkSync(musicPath);
    }

    if (music.cover_path) {
      const coverPath = path.join(__dirname, '..', music.cover_path);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    // 删除数据库记录
    db.prepare('DELETE FROM music WHERE id = ?').run(req.params.id);

    res.json({ message: 'Music deleted successfully' });
  } catch (error) {
    console.error('Delete music error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

