const Database = require('better-sqlite3');
const path = require('path');

// 创建数据库连接
const db = new Database(path.join(__dirname, 'miao-player.db'));

// 创建表结构
db.exec(`
  -- 音乐表
  CREATE TABLE IF NOT EXISTS music (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    duration INTEGER,
    file_path TEXT NOT NULL,
    cover_path TEXT,
    lyrics TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 歌单表
  CREATE TABLE IF NOT EXISTS playlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 歌单-音乐关联表
  CREATE TABLE IF NOT EXISTS playlist_music (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    music_id INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE CASCADE,
    FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE,
    UNIQUE(playlist_id, music_id)
  );
`);

console.log('✅ Database initialized');

module.exports = db;

