import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// 创建歌单
router.post('/create', (req, res) => {
  try {
    const { name, description, cover_path } = req.body;

    if (!name) {
      return res.status(400).json({ error: '歌单名称不能为空' });
    }

    const stmt = db.prepare(`
      INSERT INTO playlist (name, description, cover_path)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(name, description || '', cover_path || null);

    res.json({
      id: result.lastInsertRowid,
      name,
      description,
      cover_path
    });
  } catch (err) {
    console.error('Create playlist error:', err);
    res.status(500).json({ error: '创建歌单失败', message: err.message });
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
  } catch (err) {
    console.error('List playlists error:', err);
    res.status(500).json({ error: '获取歌单列表失败', message: err.message });
  }
});

// 获取歌单详情（包含歌曲列表）
router.get('/:id', (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlist WHERE id = ?').get(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ error: '歌单不存在' });
    }

    // 获取歌单中的音乐
    const music = db.prepare(`
      SELECT m.*, pm.sort_order
      FROM music m
      INNER JOIN playlist_music pm ON m.id = pm.music_id
      WHERE pm.playlist_id = ?
      ORDER BY pm.sort_order ASC, pm.created_at DESC
    `).all(req.params.id);

    res.json({
      ...playlist,
      music_list: music
    });
  } catch (err) {
    console.error('Get playlist error:', err);
    res.status(500).json({ error: '获取歌单失败', message: err.message });
  }
});

// 更新歌单信息
router.put('/:id', (req, res) => {
  try {
    const { name, description, cover_path } = req.body;

    const stmt = db.prepare(`
      UPDATE playlist 
      SET name = ?, description = ?, cover_path = ?
      WHERE id = ?
    `);

    const result = stmt.run(name, description, cover_path, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '歌单不存在' });
    }

    const playlist = db.prepare('SELECT * FROM playlist WHERE id = ?').get(req.params.id);
    res.json(playlist);
  } catch (err) {
    console.error('Update playlist error:', err);
    res.status(500).json({ error: '更新歌单失败', message: err.message });
  }
});

// 删除歌单
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM playlist WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '歌单不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('Delete playlist error:', err);
    res.status(500).json({ error: '删除歌单失败', message: err.message });
  }
});

// 添加音乐到歌单
router.post('/:id/music', (req, res) => {
  try {
    const { music_ids } = req.body;

    if (!Array.isArray(music_ids) || music_ids.length === 0) {
      return res.status(400).json({ error: '请选择要添加的音乐' });
    }

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO playlist_music (playlist_id, music_id, sort_order)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((playlistId, musicIds) => {
      musicIds.forEach((musicId, index) => {
        stmt.run(playlistId, musicId, index);
      });
    });

    insertMany(req.params.id, music_ids);

    res.json({ message: '添加成功' });
  } catch (err) {
    console.error('Add music to playlist error:', err);
    res.status(500).json({ error: '添加音乐失败', message: err.message });
  }
});

// 从歌单中移除音乐
router.delete('/:id/music/:musicId', (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM playlist_music 
      WHERE playlist_id = ? AND music_id = ?
    `).run(req.params.id, req.params.musicId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '音乐不在该歌单中' });
    }

    res.json({ message: '移除成功' });
  } catch (err) {
    console.error('Remove music from playlist error:', err);
    res.status(500).json({ error: '移除音乐失败', message: err.message });
  }
});

// 更新歌单中音乐的顺序
router.put('/:id/music/sort', (req, res) => {
  try {
    const { music_orders } = req.body; // [{ music_id: 1, sort_order: 0 }, ...]

    if (!Array.isArray(music_orders)) {
      return res.status(400).json({ error: '参数错误' });
    }

    const stmt = db.prepare(`
      UPDATE playlist_music 
      SET sort_order = ?
      WHERE playlist_id = ? AND music_id = ?
    `);

    const updateMany = db.transaction((playlistId, orders) => {
      orders.forEach(order => {
        stmt.run(order.sort_order, playlistId, order.music_id);
      });
    });

    updateMany(req.params.id, music_orders);

    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('Update music order error:', err);
    res.status(500).json({ error: '更新顺序失败', message: err.message });
  }
});

export default router;

