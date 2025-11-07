import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// 获取所有歌单
router.get('/', (req, res) => {
  try {
    const playlists = db.prepare(`
      SELECT p.*, 
        COUNT(ps.song_id) as song_count
      FROM playlists p
      LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();

    res.json({ success: true, data: playlists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单个歌单详情
router.get('/:id', (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ success: false, message: '歌单不存在' });
    }

    const songs = db.prepare(`
      SELECT s.*, ps.sort_order
      FROM songs s
      INNER JOIN playlist_songs ps ON s.id = ps.song_id
      WHERE ps.playlist_id = ?
      ORDER BY ps.sort_order ASC, ps.created_at ASC
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        ...playlist,
        songs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建歌单
router.post('/', (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '歌单名称不能为空' });
    }

    const stmt = db.prepare(`
      INSERT INTO playlists (name, description)
      VALUES (?, ?)
    `);

    const result = stmt.run(name, description || '');
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '创建成功',
      data: playlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新歌单信息
router.put('/:id', (req, res) => {
  try {
    const { name, description } = req.body;

    const stmt = db.prepare(`
      UPDATE playlists 
      SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(name, description, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '歌单不存在' });
    }

    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id);

    res.json({
      success: true,
      message: '更新成功',
      data: playlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除歌单
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM playlists WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '歌单不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 添加歌曲到歌单
router.post('/:id/songs', (req, res) => {
  try {
    const { songIds } = req.body; // 数组形式的歌曲ID

    if (!Array.isArray(songIds) || songIds.length === 0) {
      return res.status(400).json({ success: false, message: '请提供歌曲ID' });
    }

    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: '歌单不存在' });
    }

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, sort_order)
      VALUES (?, ?, ?)
    `);

    let addedCount = 0;
    const currentMaxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM playlist_songs WHERE playlist_id = ?')
      .get(req.params.id).max_order;

    songIds.forEach((songId, index) => {
      const result = stmt.run(req.params.id, songId, currentMaxOrder + index + 1);
      if (result.changes > 0) {
        addedCount++;
      }
    });

    res.json({
      success: true,
      message: `成功添加 ${addedCount} 首歌曲到歌单`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 从歌单中移除歌曲
router.delete('/:id/songs/:songId', (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM playlist_songs 
      WHERE playlist_id = ? AND song_id = ?
    `).run(req.params.id, req.params.songId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '歌曲不在该歌单中' });
    }

    res.json({ success: true, message: '移除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新歌单中歌曲的排序
router.put('/:id/songs/reorder', (req, res) => {
  try {
    const { songOrders } = req.body; // [{ songId, sortOrder }, ...]

    if (!Array.isArray(songOrders)) {
      return res.status(400).json({ success: false, message: '参数格式错误' });
    }

    const stmt = db.prepare(`
      UPDATE playlist_songs 
      SET sort_order = ?
      WHERE playlist_id = ? AND song_id = ?
    `);

    songOrders.forEach(({ songId, sortOrder }) => {
      stmt.run(sortOrder, req.params.id, songId);
    });

    res.json({ success: true, message: '排序更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

