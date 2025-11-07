# 🎵 从这里开始！

## 欢迎使用喵音乐播放器！

您的完整在线音乐网站已经开发完成，包含以下三个部分：

1. **H5 应用端** - 用户播放音乐的界面
2. **后台管理** - 管理员上传音乐和创建歌单
3. **后端 API** - 提供数据服务

---

## 第一步：启动项目 🚀

### 方式一：一键启动（推荐）⚡

打开终端，在项目根目录执行：

```bash
bash start-dev.sh
```

这个脚本会自动：
- ✅ 检查并安装所有依赖
- ✅ 创建必要的目录
- ✅ 同时启动三个服务

等待服务启动完成后，你会看到：
```
所有服务已启动！
访问地址:
  后端 API:     http://localhost:3000
  前端应用端:   http://localhost:5173
  后台管理:     http://localhost:5174
```

### 方式二：手动启动 🔧

如果一键启动有问题，可以分别启动：

**终端 1 - 后端服务**
```bash
cd backend
npm install
npm run dev
```

**终端 2 - 前端应用**
```bash
cd frontend-app
npm install
npm run dev
```

**终端 3 - 后台管理**
```bash
cd frontend-admin
npm install
npm run dev
```

---

## 第二步：体验功能 🎯

### 1. 访问后台管理系统

打开浏览器访问：**http://localhost:5174**

#### 上传音乐
1. 点击左侧菜单 **"音乐管理"**
2. 点击 **"上传音乐"** 按钮
3. 选择你的音乐文件（支持 mp3, wav, flac, m4a, ogg）
4. 填写歌曲信息（可选，系统会自动提取）
5. 点击 **"确定上传"**
6. 上传成功后，可以点击 **"试听"** 测试播放

#### 创建歌单
1. 点击左侧菜单 **"歌单管理"**
2. 点击 **"创建歌单"** 按钮
3. 输入歌单名称和描述
4. 点击 **"确定"**

#### 添加歌曲到歌单
1. 在歌单列表中，找到刚创建的歌单
2. 点击 **"添加歌曲"** 按钮
3. 在弹出的对话框中搜索歌曲
4. 勾选要添加的歌曲
5. 点击 **"确定添加"**

### 2. 访问前端应用

打开浏览器访问：**http://localhost:5173**

#### 浏览歌单
1. 点击底部 **"歌单"** 标签
2. 看到刚才创建的歌单
3. 点击歌单进入详情页

#### 播放音乐
1. 在歌单详情页，点击任意歌曲
2. 自动跳转到播放器页面开始播放
3. 可以使用以下功能：
   - ▶️ 播放/暂停
   - ⏮️ 上一曲
   - ⏭️ 下一曲
   - 🎚️ 拖动进度条
   - 📝 查看歌词

---

## 第三步：部署到服务器 🌐

### 开发完成后，部署到生产环境

```bash
bash deploy.sh
```

详细的部署步骤请参考：**[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)**

包含：
- 服务器环境配置
- Nginx 配置
- SSL 证书申请
- PM2 进程管理
- 域名配置

---

## 📚 完整文档

| 文档 | 说明 |
|------|------|
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | 项目完整总结 |
| [README.md](./README.md) | 项目介绍 |
| [docs/QUICK_START.md](./docs/QUICK_START.md) | 10分钟快速上手 |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | 详细部署文档 |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | 开发指南 |
| [docs/API.md](./docs/API.md) | API 文档 |

---

## 🎨 项目特色

✅ **简单易用** - 一键启动，5分钟体验  
✅ **功能完整** - 上传、管理、播放一应俱全  
✅ **界面美观** - 现代化 UI，毛玻璃效果  
✅ **响应式设计** - 同时支持 H5 和 Web  
✅ **详细文档** - 从开发到部署，步步清晰  
✅ **易于部署** - SQLite 数据库，无需复杂配置  

---

## ❓ 常见问题

### Q: 端口被占用怎么办？
修改配置文件中的端口：
- 后端：编辑 `backend/.env`
- 前端应用：编辑 `frontend-app/vite.config.js`
- 后台管理：编辑 `frontend-admin/vite.config.js`

### Q: 上传的音乐在哪里？
存储在 `uploads/` 目录

### Q: 如何重置数据？
删除 `backend/data/database.db` 文件，重启后端即可

### Q: 支持哪些音频格式？
mp3, wav, flac, m4a, ogg

---

## 🎉 开始使用吧！

现在你可以：
1. 运行 `bash start-dev.sh` 启动项目
2. 访问 http://localhost:5174 上传音乐
3. 访问 http://localhost:5173 播放音乐

**祝你使用愉快！** 🎵

有问题？查看 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) 或 [docs/](./docs/) 目录下的详细文档。

