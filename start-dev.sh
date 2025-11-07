#!/bin/bash

# 喵音乐播放器 - 开发环境快速启动脚本

echo "======================================"
echo "  喵音乐播放器 - 开发环境启动"
echo "======================================"
echo ""

# 检查依赖是否已安装
check_dependencies() {
    if [ ! -d "backend/node_modules" ]; then
        echo "正在安装后端依赖..."
        cd backend && npm install && cd ..
    fi
    
    if [ ! -d "frontend-app/node_modules" ]; then
        echo "正在安装前端应用端依赖..."
        cd frontend-app && npm install && cd ..
    fi
    
    if [ ! -d "frontend-admin/node_modules" ]; then
        echo "正在安装后台管理依赖..."
        cd frontend-admin && npm install && cd ..
    fi
}

check_dependencies

# 创建必要目录
mkdir -p uploads backend/data

echo ""
echo "启动服务..."
echo ""

# 使用 trap 捕获退出信号，确保所有子进程都被终止
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# 启动后端服务
echo "启动后端服务 (http://localhost:3000)..."
cd backend && npm run dev &
BACKEND_PID=$!

# 等待一秒让后端启动
sleep 2

# 启动前端应用端
echo "启动前端应用端 (http://localhost:5173)..."
cd frontend-app && npm run dev &
APP_PID=$!

# 启动后台管理系统
echo "启动后台管理系统 (http://localhost:5174)..."
cd frontend-admin && npm run dev &
ADMIN_PID=$!

echo ""
echo "======================================"
echo "所有服务已启动！"
echo "======================================"
echo ""
echo "访问地址:"
echo "  后端 API:     http://localhost:3000"
echo "  前端应用端:   http://localhost:5173"
echo "  后台管理:     http://localhost:5174"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待所有后台进程
wait

