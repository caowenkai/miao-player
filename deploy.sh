#!/bin/bash

# 喵音乐播放器 - 一键部署脚本
# 使用方法: bash deploy.sh

set -e

echo "======================================"
echo "  喵音乐播放器 - 一键部署脚本"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}提示: 某些操作需要 sudo 权限${NC}"
fi

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "项目目录: $PROJECT_ROOT"
echo ""

# 检查 Node.js
echo "检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装 Node.js${NC}"
    echo "请先安装 Node.js 18+ : https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js 版本: $NODE_VERSION${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未安装 npm${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm 版本: $NPM_VERSION${NC}"
echo ""

# 安装后端依赖
echo "======================================"
echo "1. 安装后端依赖..."
echo "======================================"
cd "$PROJECT_ROOT/backend"
npm install
echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
echo ""

# 创建上传目录
echo "======================================"
echo "2. 创建必要目录..."
echo "======================================"
mkdir -p "$PROJECT_ROOT/uploads"
mkdir -p "$PROJECT_ROOT/backend/data"
echo -e "${GREEN}✓ 目录创建完成${NC}"
echo ""

# 检查环境变量文件
echo "======================================"
echo "3. 配置环境变量..."
echo "======================================"
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env" 2>/dev/null || echo "PORT=3000
DATABASE_PATH=./data/database.db
UPLOAD_PATH=../uploads" > "$PROJECT_ROOT/backend/.env"
    echo -e "${GREEN}✓ 环境变量文件已创建${NC}"
else
    echo -e "${YELLOW}环境变量文件已存在，跳过${NC}"
fi
echo ""

# 安装前端应用端依赖
echo "======================================"
echo "4. 安装前端应用端依赖..."
echo "======================================"
cd "$PROJECT_ROOT/frontend-app"
npm install
echo -e "${GREEN}✓ 前端应用端依赖安装完成${NC}"
echo ""

# 安装后台管理系统依赖
echo "======================================"
echo "5. 安装后台管理系统依赖..."
echo "======================================"
cd "$PROJECT_ROOT/frontend-admin"
npm install
echo -e "${GREEN}✓ 后台管理系统依赖安装完成${NC}"
echo ""

# 询问是否构建前端
read -p "是否构建前端应用用于生产环境？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "======================================"
    echo "6. 构建前端应用..."
    echo "======================================"
    
    # 构建前端应用端
    echo "构建前端应用端..."
    cd "$PROJECT_ROOT/frontend-app"
    npm run build
    echo -e "${GREEN}✓ 前端应用端构建完成${NC}"
    
    # 构建后台管理系统
    echo "构建后台管理系统..."
    cd "$PROJECT_ROOT/frontend-admin"
    npm run build
    echo -e "${GREEN}✓ 后台管理系统构建完成${NC}"
    echo ""
fi

# 检查 PM2
echo "======================================"
echo "7. 检查 PM2..."
echo "======================================"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 未安装，尝试安装...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 安装完成${NC}"
else
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✓ PM2 版本: $PM2_VERSION${NC}"
fi
echo ""

# 启动服务
echo "======================================"
echo "8. 启动服务..."
echo "======================================"
cd "$PROJECT_ROOT/backend"

# 停止旧的进程（如果存在）
pm2 delete miao-player-backend 2>/dev/null || true

# 启动后端服务
pm2 start src/index.js --name miao-player-backend
pm2 save

echo -e "${GREEN}✓ 后端服务已启动${NC}"
echo ""

# 显示启动信息
echo "======================================"
echo "部署完成！"
echo "======================================"
echo ""
echo "服务状态:"
pm2 status
echo ""
echo "访问地址:"
echo "  后端 API:     http://localhost:3000"
echo "  前端应用端:   http://localhost:5173  (开发模式: cd frontend-app && npm run dev)"
echo "  后台管理:     http://localhost:5174  (开发模式: cd frontend-admin && npm run dev)"
echo ""
echo "常用命令:"
echo "  查看日志:     pm2 logs miao-player-backend"
echo "  重启服务:     pm2 restart miao-player-backend"
echo "  停止服务:     pm2 stop miao-player-backend"
echo "  查看状态:     pm2 status"
echo ""
echo "下一步:"
echo "  1. 如果需要开发，分别在 frontend-app 和 frontend-admin 目录运行 npm run dev"
echo "  2. 如果需要生产部署，请参考 docs/DEPLOYMENT.md"
echo "  3. 访问后台管理系统上传音乐和创建歌单"
echo "  4. 在应用端查看和播放音乐"
echo ""
echo -e "${GREEN}🎵 祝使用愉快！${NC}"

