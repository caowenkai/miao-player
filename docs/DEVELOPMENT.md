# 开发指南

本文档介绍如何在本地开发环境中运行和开发喵音乐播放器。

## 环境要求

- Node.js 18+
- npm 或 yarn
- 现代浏览器（Chrome, Firefox, Safari, Edge）

## 安装依赖

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 安装前端应用端依赖

```bash
cd frontend-app
npm install
```

### 3. 安装后台管理系统依赖

```bash
cd frontend-admin
npm install
```

## 启动开发服务

### 启动后端服务

```bash
cd backend
npm run dev
```

后端服务将在 `http://localhost:3000` 启动。

### 启动前端应用端

在新的终端窗口：

```bash
cd frontend-app
npm run dev
```

前端应用端将在 `http://localhost:5173` 启动。

### 启动后台管理系统

在新的终端窗口：

```bash
cd frontend-admin
npm run dev
```

后台管理系统将在 `http://localhost:5174` 启动。

## 项目结构

```
miao-player/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   │   └── database.js    # 数据库配置
│   │   ├── routes/            # API 路由
│   │   │   ├── songs.js       # 歌曲相关 API
│   │   │   └── playlists.js   # 歌单相关 API
│   │   └── index.js           # 入口文件
│   ├── data/                  # 数据库文件目录
│   ├── .env                   # 环境变量
│   └── package.json
│
├── frontend-app/              # 前端应用端
│   ├── src/
│   │   ├── api/              # API 接口
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── router/           # 路由配置
│   │   ├── views/            # 页面组件
│   │   │   ├── Layout.vue    # 布局组件
│   │   │   ├── Player.vue    # 播放器页面
│   │   │   ├── Playlists.vue # 歌单列表页面
│   │   │   └── PlaylistDetail.vue # 歌单详情页面
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── frontend-admin/            # 后台管理系统
│   ├── src/
│   │   ├── api/              # API 接口
│   │   ├── router/           # 路由配置
│   │   ├── views/            # 页面组件
│   │   │   ├── Layout.vue    # 布局组件
│   │   │   ├── Songs.vue     # 音乐管理页面
│   │   │   └── Playlists.vue # 歌单管理页面
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── uploads/                   # 音乐文件存储目录
├── docs/                      # 文档
├── deploy.sh                  # 部署脚本
└── README.md
```

## 技术栈详解

### 后端

- **Express**: Web 框架
- **better-sqlite3**: SQLite 数据库驱动
- **multer**: 文件上传中间件
- **music-metadata**: 音频元数据解析
- **cors**: 跨域资源共享
- **dotenv**: 环境变量管理

### 前端应用端

- **Vue 3**: 渐进式 JavaScript 框架
- **Vite**: 快速的前端构建工具
- **Pinia**: Vue 状态管理库
- **Vue Router**: 路由管理
- **Axios**: HTTP 客户端

### 后台管理系统

- **Vue 3**: 渐进式 JavaScript 框架
- **Vite**: 快速的前端构建工具
- **Element Plus**: Vue 3 组件库
- **Pinia**: Vue 状态管理库
- **Vue Router**: 路由管理
- **Axios**: HTTP 客户端

## 开发流程

### 1. 添加新的 API 接口

在 `backend/src/routes/` 下创建或修改路由文件：

```javascript
// backend/src/routes/example.js
import express from 'express';
import db from '../config/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  // 你的逻辑
  res.json({ success: true, data: [] });
});

export default router;
```

在 `backend/src/index.js` 中注册路由：

```javascript
import exampleRouter from './routes/example.js';
app.use('/api/example', exampleRouter);
```

### 2. 添加新的前端页面

在 `frontend-app/src/views/` 或 `frontend-admin/src/views/` 下创建 Vue 组件：

```vue
<template>
  <div class="page">
    <!-- 你的内容 -->
  </div>
</template>

<script setup>
// 你的逻辑
</script>

<style scoped>
/* 你的样式 */
</style>
```

在路由文件中注册：

```javascript
// frontend-app/src/router/index.js
{
  path: '/your-page',
  name: 'YourPage',
  component: () => import('@/views/YourPage.vue')
}
```

### 3. 调用 API

使用封装的 API 方法：

```javascript
import { songsApi } from '@/api';

// 在组件中
const songs = ref([]);
const loadSongs = async () => {
  const res = await songsApi.getList();
  if (res.success) {
    songs.value = res.data.songs;
  }
};
```

## 调试技巧

### 后端调试

1. 使用 `console.log()` 输出日志
2. 查看终端输出
3. 使用 Postman 或类似工具测试 API

### 前端调试

1. 使用浏览器开发者工具
2. Vue DevTools 扩展
3. Network 面板查看 API 请求
4. Console 面板查看日志

## 常见问题

### Q: 端口已被占用

修改对应的配置文件：

- 后端：`backend/.env` 中的 `PORT`
- 前端应用端：`frontend-app/vite.config.js` 中的 `server.port`
- 后台管理：`frontend-admin/vite.config.js` 中的 `server.port`

### Q: 跨域问题

开发环境已配置代理，生产环境需要配置 Nginx。

### Q: 数据库文件位置

默认位置：`backend/data/database.db`

可在 `backend/.env` 中修改 `DATABASE_PATH`。

### Q: 音频文件无法播放

1. 检查文件是否正确上传到 `uploads/` 目录
2. 检查文件权限
3. 查看浏览器控制台错误信息

## 代码规范

### JavaScript/Vue

- 使用 ES6+ 语法
- 组件使用 `<script setup>` 语法
- 使用组合式 API (Composition API)
- 变量命名使用驼峰命名法
- 组件命名使用大驼峰命名法

### 样式

- 使用 `scoped` 样式避免污染
- 使用语义化的类名
- 响应式设计优先考虑移动端

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 测试

### 手动测试流程

1. 启动所有服务
2. 访问后台管理系统上传音乐
3. 创建歌单并添加歌曲
4. 在应用端查看歌单
5. 播放音乐测试

## 许可证

MIT License

