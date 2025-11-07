# 喵音乐播放器 - 部署文档

本文档将指导你如何将喵音乐播放器部署到生产环境。

## 目录

1. [服务器要求](#服务器要求)
2. [服务器准备](#服务器准备)
3. [部署后端服务](#部署后端服务)
4. [部署前端应用](#部署前端应用)
5. [配置 Nginx](#配置-nginx)
6. [启动服务](#启动服务)
7. [域名和 SSL 配置](#域名和-ssl-配置)
8. [常见问题](#常见问题)

## 服务器要求

- **操作系统**: TencentOS / CentOS 7+ / Ubuntu 20.04+ / Debian 10+
- **内存**: 最低 1GB (推荐 2GB+)
- **存储**: 最低 10GB (根据音乐文件数量调整)
- **CPU**: 1核心以上
- **网络**: 需要公网 IP

> **注意**: 本文档以 CentOS/TencentOS 为主，Ubuntu/Debian 用户请参考注释中的对应命令。

## 服务器准备

### 1. 连接到服务器

```bash
ssh root@your_server_ip
```

### 2. 安装必要软件

#### 更新系统包

```bash
# CentOS/TencentOS
sudo yum update -y

# Ubuntu/Debian 用户使用：sudo apt update && sudo apt upgrade -y
```

#### 安装 Node.js (版本 18+)

```bash
# CentOS/TencentOS - 使用 NodeSource 仓库安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Ubuntu/Debian 用户使用：
# curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# sudo apt install -y nodejs

# 验证安装
node -v
npm -v
```

#### 安装 Nginx

```bash
# CentOS/TencentOS
sudo yum install -y nginx

# Ubuntu/Debian 用户使用：sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查 Nginx 状态
sudo systemctl status nginx
```

#### 安装 PM2 (Node.js 进程管理器)

```bash
sudo npm install -g pm2
```

#### 安装 Git

```bash
# CentOS/TencentOS
sudo yum install -y git

# Ubuntu/Debian 用户使用：sudo apt install -y git

# 验证安装
git --version
```

### 3. 配置防火墙 (CentOS/TencentOS)

#### 方法一：使用 firewalld（推荐）

首先检查并安装 firewalld：

```bash
# 检查 firewalld 是否已安装
which firewall-cmd

# 如果没有安装，执行以下命令安装
sudo yum install -y firewalld

# 启动并启用 firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 检查状态
sudo systemctl status firewalld
```

安装完成后，配置防火墙规则：

```bash
# 开放 HTTP 和 HTTPS 端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 如果需要开放其他端口（如后端 API 端口 3000）
sudo firewall-cmd --permanent --add-port=3000/tcp

# 重载防火墙规则
sudo firewall-cmd --reload

# 查看已开放的端口
sudo firewall-cmd --list-all
```

#### 方法二：使用 iptables（如果 firewalld 不可用）

如果无法安装 firewalld，可以使用 iptables：

```bash
# 检查 iptables 是否已安装
which iptables

# 如果没有安装，执行
sudo yum install -y iptables-services

# 启动并启用 iptables
sudo systemctl start iptables
sudo systemctl enable iptables

# 开放 HTTP (80) 和 HTTPS (443) 端口
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT

# 如果需要开放后端 API 端口 3000
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT

# 保存规则（CentOS 7+）
sudo service iptables save

# 或者使用 iptables-save（CentOS 6）
# sudo iptables-save > /etc/sysconfig/iptables

# 查看规则
sudo iptables -L -n
```

#### 方法三：云服务器安全组（必须配置）

> **重要提示**: 如果你的服务器使用腾讯云、阿里云等云服务商，**必须**在云服务商的控制台配置安全组规则，开放 80 和 443 端口。仅配置系统防火墙是不够的！

**腾讯云安全组配置**：
1. 登录腾讯云控制台
2. 进入"云服务器" → "安全组"
3. 添加入站规则：
   - 协议端口：TCP:80
   - 协议端口：TCP:443
   - 来源：0.0.0.0/0
   - 策略：允许

**阿里云安全组配置**：
1. 登录阿里云控制台
2. 进入"ECS" → "网络与安全" → "安全组"
3. 添加规则：
   - 端口范围：80/80 和 443/443
   - 授权对象：0.0.0.0/0
   - 协议类型：TCP

### 4. 创建部署目录

```bash
# 创建应用目录
sudo mkdir -p /var/www/miao-player
sudo chown -R $USER:$USER /var/www/miao-player
cd /var/www/miao-player
```

### 5. 配置 SELinux (CentOS/TencentOS)

> **重要**: 必须先创建目录（第 4 步），然后再配置 SELinux！

```bash
# 查看 SELinux 状态
getenforce
```

**根据 SELinux 状态选择对应的操作：**

#### 情况 1：SELinux 已禁用（Disabled）

如果 `getenforce` 返回 `Disabled`，说明 SELinux 已经关闭，**可以跳过此步骤**，直接继续下一步部署。

```bash
# 验证 SELinux 状态
getenforce
# 输出: Disabled

# 如果显示 Disabled，无需配置 SELinux，直接继续部署即可
```

#### 情况 2：SELinux 已启用（Enforcing 或 Permissive）

如果 `getenforce` 返回 `Enforcing` 或 `Permissive`，需要配置 SELinux 权限：

```bash
# 允许 Nginx 连接网络（必须先执行这个）
sudo setsebool -P httpd_can_network_connect 1

# 创建必要的子目录（如果还没有）
sudo mkdir -p /var/www/miao-player/uploads
sudo mkdir -p /var/www/miao-player/backend/data

# 允许 Nginx 读取应用目录
sudo chcon -R -t httpd_sys_content_t /var/www/miao-player

# 允许 Nginx 访问上传目录（可读写）
sudo chcon -R -t httpd_sys_rw_content_t /var/www/miao-player/uploads

# 允许 Nginx 访问数据库目录（可读写）
sudo chcon -R -t httpd_sys_rw_content_t /var/www/miao-player/backend/data

# 验证配置
ls -lZ /var/www/miao-player
```

> **说明**: 
> - 如果 SELinux 已禁用，可以跳过配置，直接继续部署
> - 如果 SELinux 已启用，建议保持开启状态并正确配置权限，而不是直接关闭
> - SELinux 是 CentOS 的安全增强功能，生产环境建议启用并正确配置

**如果遇到错误** `chcon: can't apply partial context to unlabeled file`，按以下步骤处理：

#### 步骤 1：确认 SELinux 状态

```bash
# 检查 SELinux 状态
getenforce

# 检查 SELinux 配置文件
cat /etc/selinux/config | grep SELINUX
```

**如果显示 `Disabled`**：
- SELinux 已禁用，**无需执行 chcon 命令**
- 直接跳过 SELinux 配置，继续部署即可
- 这个错误是因为 SELinux 禁用时文件系统没有标签

**如果显示 `Enforcing` 或 `Permissive`**：
- SELinux 已启用，继续执行下面的修复方法

#### 步骤 2：修复方法（仅当 SELinux 已启用时）

```bash
# 方法 1：使用完整的上下文类型（推荐）
sudo chcon -R -u system_u -r object_r -t httpd_sys_content_t /var/www/miao-player
sudo chcon -R -u system_u -r object_r -t httpd_sys_rw_content_t /var/www/miao-player/uploads
sudo chcon -R -u system_u -r object_r -t httpd_sys_rw_content_t /var/www/miao-player/backend/data

# 方法 2：使用 restorecon 恢复默认上下文，然后重新设置
sudo restorecon -R /var/www/miao-player
sudo chcon -R -t httpd_sys_content_t /var/www/miao-player
sudo chcon -R -t httpd_sys_rw_content_t /var/www/miao-player/uploads

# 方法 3：如果方法 1 和 2 都不行，尝试重新挂载文件系统（需要 root）
# 注意：这个方法比较危险，不推荐使用
```

#### 步骤 3：验证配置

```bash
# 查看 SELinux 上下文
ls -lZ /var/www/miao-player

# 应该看到类似这样的输出（如果 SELinux 启用）：
# drwxr-xr-x. user user system_u:object_r:httpd_sys_content_t:s0 miao-player
```

## 部署后端服务

### 1. 上传代码

**方法一：使用 Git (推荐)**

```bash
cd /var/www/miao-player
git clone <your-repository-url> .
```

**方法二：使用 SCP 上传**

在本地执行：

```bash
# 在项目根目录
scp -r backend frontend-app frontend-admin package.json root@your_server_ip:/var/www/miao-player/
```

### 2. 安装后端依赖

```bash
cd /var/www/miao-player/backend
npm install --production
```

### 3. 配置环境变量

```bash
cd /var/www/miao-player/backend
cp .env.example .env
nano .env
```

修改 `.env` 文件：

```env
PORT=3000
DATABASE_PATH=/var/www/miao-player/backend/data/database.db
UPLOAD_PATH=/var/www/miao-player/uploads
```

### 4. 初始化数据库

```bash
cd /var/www/miao-player/backend
node src/scripts/init-db.js
```

如果没有 init-db.js，数据库会在第一次启动时自动初始化。

### 5. 创建上传目录

```bash
mkdir -p /var/www/miao-player/uploads
chmod 755 /var/www/miao-player/uploads
```

### 6. 使用 PM2 启动后端服务

```bash
cd /var/www/miao-player/backend
pm2 start src/index.js --name miao-player-backend
pm2 save
pm2 startup
```

执行 `pm2 startup` 后显示的命令，让服务开机自启。

## 部署前端应用

### 1. 构建前端应用端

```bash
cd /var/www/miao-player/frontend-app
npm install
npm run build
```

构建完成后，静态文件在 `dist` 目录。

### 2. 构建后台管理系统

```bash
cd /var/www/miao-player/frontend-admin
npm install
npm run build
```

构建完成后，静态文件在 `dist` 目录。

## 配置 Nginx

### 1. 创建 Nginx 配置文件

```bash
sudo nano /etc/nginx/sites-available/miao-player
```

### 2. 添加以下配置

```nginx
# 应用端配置
server {
    listen 80;
    server_name app.yourdomain.com;  # 替换为你的域名
    
    root /var/www/miao-player/frontend-app/dist;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 音频文件代理
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 音频文件缓存
        proxy_cache_valid 200 1d;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    }
}

# 后台管理系统配置
server {
    listen 80;
    server_name admin.yourdomain.com;  # 替换为你的域名
    
    root /var/www/miao-player/frontend-admin/dist;
    index index.html;
    
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 音频文件代理
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. 启用配置并重启 Nginx

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/miao-player /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 启动服务

### 查看服务状态

```bash
# 查看后端服务
pm2 status
pm2 logs miao-player-backend

# 查看 Nginx 状态
sudo systemctl status nginx
```

### 重启服务

```bash
# 重启后端
pm2 restart miao-player-backend

# 重启 Nginx
sudo systemctl restart nginx
```

## 域名和 SSL 配置

### 1. 配置域名解析

在你的域名服务商处添加 A 记录：

```
app.yourdomain.com    ->  your_server_ip
admin.yourdomain.com  ->  your_server_ip
```

### 2. 安装 SSL 证书 (使用 Let's Encrypt)

#### CentOS/TencentOS 安装 Certbot

```bash
# CentOS/TencentOS - 安装 EPEL 仓库
sudo yum install -y epel-release

# 安装 Certbot 和 Nginx 插件
sudo yum install -y certbot python3-certbot-nginx

# Ubuntu/Debian 用户使用：
# sudo apt install certbot python3-certbot-nginx -y

# 为应用端申请证书
sudo certbot --nginx -d app.yourdomain.com

# 为后台管理系统申请证书
sudo certbot --nginx -d admin.yourdomain.com
```

> **注意**: CentOS 7 用户如果遇到问题，可以使用 Certbot 的 Snap 包：
> ```bash
> sudo yum install -y snapd
> sudo systemctl enable --now snapd.socket
> sudo ln -s /var/lib/snapd/snap /snap
> sudo snap install --classic certbot
> sudo ln -s /snap/bin/certbot /usr/bin/certbot
> ```

Certbot 会自动修改 Nginx 配置，添加 SSL 支持。

### 3. 自动续期

```bash
# 测试自动续期
sudo certbot renew --dry-run

# Certbot 会自动创建定时任务（cron）
# 查看 cron 任务
sudo crontab -l
```

## 更新部署

### 更新后端

```bash
cd /var/www/miao-player/backend
git pull  # 如果使用 Git
npm install --production
pm2 restart miao-player-backend
```

### 更新前端

```bash
# 更新应用端
cd /var/www/miao-player/frontend-app
git pull
npm install
npm run build
sudo systemctl reload nginx

# 更新后台管理
cd /var/www/miao-player/frontend-admin
git pull
npm install
npm run build
sudo systemctl reload nginx
```

## 快速部署脚本

为了简化部署，我们提供了一键部署脚本。参见项目根目录的 `deploy.sh`。

## 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :80

# 杀掉进程
sudo kill -9 <PID>
```

### 2. 权限问题

```bash
# 确保目录权限正确
sudo chown -R $USER:$USER /var/www/miao-player
chmod -R 755 /var/www/miao-player
```

### 3. 音频文件无法访问

```bash
# 检查上传目录权限
ls -la /var/www/miao-player/uploads
chmod 755 /var/www/miao-player/uploads
```

### 4. 数据库文件权限

```bash
# 确保数据库目录可写
mkdir -p /var/www/miao-player/backend/data
chmod 755 /var/www/miao-player/backend/data
```

### 5. 查看日志

```bash
# 后端日志
pm2 logs miao-player-backend

# Nginx 日志
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 性能优化建议

### 1. 启用 HTTP/2

在 Nginx SSL 配置中：

```nginx
listen 443 ssl http2;
```

### 2. 配置缓存

```nginx
# 在 http 块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### 3. 优化 PM2

```bash
# 使用集群模式 (根据 CPU 核心数)
pm2 start src/index.js --name miao-player-backend -i 2
```

## 监控和维护

### 使用 PM2 监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show miao-player-backend
```

### 定期备份

```bash
# 备份数据库
cp /var/www/miao-player/backend/data/database.db ~/backup/database-$(date +%Y%m%d).db

# 备份上传文件
tar -czf ~/backup/uploads-$(date +%Y%m%d).tar.gz /var/www/miao-player/uploads
```

## 支持

如有问题，请查看项目文档或提交 Issue。

