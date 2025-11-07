import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import songsRoutes from './routes/songs.js';
import playlistsRoutes from './routes/playlists.js';
import { initDatabase } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 - 提供上传的音乐文件
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// 初始化数据库
initDatabase();

// 路由
app.use('/api/songs', songsRoutes);
app.use('/api/playlists', playlistsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Miao Player API is running' });
});

app.listen(PORT, () => {
  console.log(`🎵 Miao Player API running on http://localhost:${PORT}`);
});
