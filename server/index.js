const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const musicRouter = require('./routes/music');
const playlistRouter = require('./routes/playlist');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 提供音乐文件访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API 路由
app.use('/api/music', musicRouter);
app.use('/api/playlist', playlistRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Miao Player API is running' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎵 Miao Player Server is running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
});

