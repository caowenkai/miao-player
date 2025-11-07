import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseFile } from 'music-metadata';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置文件上传
const uploadDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp3', '.wav', '.flac', '.m4a', '.ogg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  }
});

// 获取所有歌曲
router.get('/', (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM songs';
    let countQuery = 'SELECT COUNT(*) as total FROM songs';
    const params = [];

    if (search) {
      query += ' WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?';
      countQuery += ' WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const songs = db.prepare(query).all(...params, limit, offset);
    const { total } = db.prepare(countQuery).get(...params);

    res.json({
      success: true,
      data: {
        songs,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单个歌曲
router.get('/:id', (req, res) => {
  try {
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: '歌曲不存在' });
    }
    res.json({ success: true, data: song });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 上传歌曲
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    // 解析音频元数据
    let metadata;
    try {
      metadata = await parseFile(filePath);
    } catch (error) {
      console.error('解析音频元数据失败:', error);
      metadata = { format: {}, common: {} };
    }

    const title = req.body.title || metadata.common.title || path.parse(req.file.originalname).name;
    const artist = req.body.artist || metadata.common.artist || '未知艺术家';
    const album = req.body.album || metadata.common.album || '';
    const duration = metadata.format.duration ? Math.floor(metadata.format.duration) : 0;
    const lyrics = req.body.lyrics || '';

    const stmt = db.prepare(`
      INSERT INTO songs (title, artist, album, duration, file_path, file_name, lyrics)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(title, artist, album, duration, fileName, req.file.originalname, lyrics);

    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '上传成功',
      data: song
    });
  } catch (error) {
    // 如果出错，删除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新歌曲信息
router.put('/:id', (req, res) => {
  try {
    const { title, artist, album, lyrics } = req.body;
    
    const stmt = db.prepare(`
      UPDATE songs 
      SET title = ?, artist = ?, album = ?, lyrics = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(title, artist, album, lyrics, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '歌曲不存在' });
    }

    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);

    res.json({
      success: true,
      message: '更新成功',
      data: song
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除歌曲
router.delete('/:id', (req, res) => {
  try {
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
    
    if (!song) {
      return res.status(404).json({ success: false, message: '歌曲不存在' });
    }

    // 删除文件
    const filePath = path.join(uploadDir, song.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    db.prepare('DELETE FROM songs WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

