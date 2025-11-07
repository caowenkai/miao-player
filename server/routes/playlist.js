const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

// 配置封面上传
const coverDir = path.join(__dirname, '../uploads/covers');
if (!fs.existsSync(coverDir)) {
  fs.mkdirSync(coverDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: coverDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'playlist-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 创建歌单
router.post('/create', upload.single('cover'), (req, res) => {
  try {
    const { name, description } = req.body;
    const coverPath = req.file ? `/uploads/covers/${req.file.filename}` : null;

    if (!name) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO playlist (name, description, cover_path)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(name, description || '', coverPath);

    res.json({
      id: result.lastInsertRowid,
      name,
      description: description || '',
      cover_path: coverPath
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取所有歌单
router.get('/list', (req, res) => {
  try {
    const playlists = db.prepare(`
      SELECT 
        p.*,
        COUNT(pm.music_id) as music_count
      FROM playlist p
      LEFT JOIN playlist_music pm ON p.id = pm.playlist_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();

    res.json(playlists);
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取歌单详情（包含歌曲列表）
router.get('/:id', (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlist WHERE id = ?').get(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // 获取歌单中的歌曲
    const songs = db.prepare(`
      SELECT m.*, pm.sort_order
      FROM music m
      INNER JOIN playlist_music pm ON m.id = pm.music_id
      WHERE pm.playlist_id = ?
      ORDER BY pm.sort_order ASC, pm.created_at ASC
    `).all(req.params.id);

    res.json({
      ...playlist,
      songs
    });
  } catch (error) {
    console.error('Get playlist detail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新歌单信息
router.put('/:id', upload.single('cover'), (req, res) => {
  try {
    const { name, description } = req.body;
    let coverPath = req.body.cover_path;

    if (req.file) {
      coverPath = `/uploads/covers/${req.file.filename}`;
    }

    const stmt = db.prepare(`
      UPDATE playlist 
      SET name = ?, description = ?, cover_path = ?
      WHERE id = ?
    `);

    stmt.run(name, description || '', coverPath, req.params.id);

    const updated = db.prepare('SELECT * FROM playlist WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除歌单
router.delete('/:id', (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlist WHERE id = ?').get(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // 删除封面文件
    if (playlist.cover_path) {
      const coverPath = path.join(__dirname, '..', playlist.cover_path);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    // 删除歌单和关联关系（会自动级联删除）
    db.prepare('DELETE FROM playlist WHERE id = ?').run(req.params.id);

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 添加歌曲到歌单
router.post('/:id/songs', (req, res) => {
  try {
    const playlistId = req.params.id;
    const { musicIds } = req.body; // 数组形式的音乐ID

    if (!Array.isArray(musicIds) || musicIds.length === 0) {
      return res.status(400).json({ error: 'Music IDs array is required' });
    }

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO playlist_music (playlist_id, music_id, sort_order)
      VALUES (?, ?, ?)
    `);

    // 获取当前最大排序号
    const maxSort = db.prepare(`
      SELECT COALESCE(MAX(sort_order), -1) as max_sort 
      FROM playlist_music 
      WHERE playlist_id = ?
    `).get(playlistId).max_sort;

    const insertMany = db.transaction(() => {
      musicIds.forEach((musicId, index) => {
        stmt.run(playlistId, musicId, maxSort + index + 1);
      });
    });

    insertMany();

    res.json({ message: 'Songs added to playlist successfully' });
  } catch (error) {
    console.error('Add songs to playlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 从歌单中移除歌曲
router.delete('/:id/songs/:musicId', (req, res) => {
  try {
    const { id, musicId } = req.params;

    db.prepare(`
      DELETE FROM playlist_music 
      WHERE playlist_id = ? AND music_id = ?
    `).run(id, musicId);

    res.json({ message: 'Song removed from playlist successfully' });
  } catch (error) {
    console.error('Remove song from playlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新歌单中歌曲的排序
router.put('/:id/songs/reorder', (req, res) => {
  try {
    const playlistId = req.params.id;
    const { musicIds } = req.body; // 新的排序后的音乐ID数组

    if (!Array.isArray(musicIds)) {
      return res.status(400).json({ error: 'Music IDs array is required' });
    }

    const stmt = db.prepare(`
      UPDATE playlist_music 
      SET sort_order = ?
      WHERE playlist_id = ? AND music_id = ?
    `);

    const updateMany = db.transaction(() => {
      musicIds.forEach((musicId, index) => {
        stmt.run(index, playlistId, musicId);
      });
    });

    updateMany();

    res.json({ message: 'Playlist reordered successfully' });
  } catch (error) {
    console.error('Reorder playlist error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

