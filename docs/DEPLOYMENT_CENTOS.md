# CentOS/TencentOS 部署指南

专门针对 CentOS 7+、TencentOS 服务器的快速部署指南。

## 快速开始

### 前提条件

- CentOS 7+ 或 TencentOS 服务器
- Root 或 sudo 权限
- 公网 IP
- 域名（可选，用于 SSL）

---

## 第一步：准备服务器环境

### 1. 更新系统

```bash
sudo yum update -y
```

### 2. 安装 Node.js 18

```bash
# 添加 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# 安装 Node.js
sudo yum install -y nodejs

# 验证安装
node -v  # 应显示 v18.x.x
npm -v   # 应显示 9.x.x
```

### 3. 安装 Nginx

```bash
# 安装 Nginx
sudo yum install -y nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### 4. 安装 Git 和 PM2

```bash
# 安装 Git
sudo yum install -y git

# 全局安装 PM2
sudo npm install -g pm2

# 验证
git --version
pm2 --version
```

### 5. 配置防火墙

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

# 如果需要直接访问后端 API（调试用）
sudo firewall-cmd --permanent --add-port=3000/tcp

# 重载防火墙
sudo firewall-cmd --reload

# 查看已开放的服务和端口
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

# 保存规则
sudo service iptables save

# 查看规则
sudo iptables -L -n
```

#### 方法三：云服务器安全组（必须配置）

> **重要**: 如果使用腾讯云/阿里云等云服务，**必须**在云控制台的安全组中开放 80 和 443 端口！

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

### 6. 配置 SELinux（基础配置）

```bash
# 查看 SELinux 状态
getenforce

# 允许 Nginx 连接网络（必须先执行这个）
sudo setsebool -P httpd_can_network_connect 1
```

> **注意**: 完整的 SELinux 配置需要在创建目录后执行，见下面的步骤。

---

## 第二步：部署应用

### 1. 创建部署目录

```bash
# 创建应用目录
sudo mkdir -p /var/www/miao-player
sudo chown -R $USER:$USER /var/www/miao-player
cd /var/www/miao-player

# 创建必要的子目录
sudo mkdir -p uploads backend/data
```

### 2. 配置 SELinux 权限（创建目录后执行）

> **重要**: 必须先创建目录，然后再配置 SELinux！

```bash
# 查看 SELinux 状态
getenforce
```

**根据 SELinux 状态选择对应的操作：**

#### 情况 1：SELinux 已禁用（Disabled）✅

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
> - 如果 SELinux 已启用，建议保持开启状态并正确配置权限

**如果遇到错误** `chcon: can't apply partial context`，执行以下命令修复：

```bash
# 方法 1：使用完整的上下文类型
sudo chcon -R -u system_u -r object_r -t httpd_sys_content_t /var/www/miao-player

# 方法 2：使用 restorecon 恢复默认上下文，然后重新设置
sudo restorecon -R /var/www/miao-player
sudo chcon -R -t httpd_sys_content_t /var/www/miao-player

# 方法 3：确保所有目录都存在
sudo mkdir -p /var/www/miao-player/{uploads,backend/data}
sudo chcon -R -t httpd_sys_content_t /var/www/miao-player
sudo chcon -R -t httpd_sys_rw_content_t /var/www/miao-player/uploads
```

### 3. 上传代码

**方法一：使用 Git（推荐）**

```bash
cd /var/www/miao-player
git clone <your-repository-url> .
```

**方法二：使用 SCP 上传**

在本地执行：

```bash
# 压缩项目（在本地项目目录）
tar -czf miao-player.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='uploads/*' \
  backend frontend-app frontend-admin \
  uploads/.gitkeep docs *.sh *.md

# 上传到服务器
scp miao-player.tar.gz root@your_server_ip:/var/www/miao-player/

# 在服务器上解压
cd /var/www/miao-player
tar -xzf miao-player.tar.gz
```

### 4. 安装依赖

```bash
cd /var/www/miao-player

# 安装后端依赖
cd backend
npm install --production

# 安装前端应用依赖
cd ../frontend-app
npm install

# 安装后台管理依赖
cd ../frontend-admin
npm install

cd ..
```

### 5. 配置环境变量

```bash
cd /var/www/miao-player/backend

# 创建 .env 文件
cat > .env << EOF
PORT=3000
DATABASE_PATH=/var/www/miao-player/backend/data/database.db
UPLOAD_PATH=/var/www/miao-player/uploads
NODE_ENV=production
EOF
```

### 6. 构建前端

```bash
# 构建前端应用
cd /var/www/miao-player/frontend-app
npm run build

# 构建后台管理
cd /var/www/miao-player/frontend-admin
npm run build
```

> **注意**: SELinux 权限已在第 2 步配置，如果构建后需要重新配置，可以执行：
> ```bash
> sudo chcon -R -t httpd_sys_content_t /var/www/miao-player/frontend-app/dist
> sudo chcon -R -t httpd_sys_content_t /var/www/miao-player/frontend-admin/dist
> ```

### 7. 启动后端服务

```bash
cd /var/www/miao-player/backend

# 使用 PM2 启动
pm2 start src/index.js --name miao-player-backend

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 执行上面命令输出的命令

# 查看状态
pm2 status
pm2 logs miao-player-backend
```

---

## 第三步：配置 Nginx

### 1. 创建 Nginx 配置

```bash
sudo vi /etc/nginx/conf.d/miao-player.conf
```

粘贴以下配置（**替换 yourdomain.com 为你的域名**）：

```nginx
# 应用端配置
server {
    listen 80;
    server_name app.yourdomain.com;
    
    root /var/www/miao-player/frontend-app/dist;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;
    
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
        proxy_buffering off;
    }
}

# 后台管理系统配置
server {
    listen 80;
    server_name admin.yourdomain.com;
    
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
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 音频文件代理
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 2. 测试并重启 Nginx

```bash
# 测试配置
sudo nginx -t

# 如果测试通过，重启 Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx
```

---

## 第四步：配置域名和 SSL

### 1. 配置域名解析

在你的域名服务商处添加 A 记录：

```
app.yourdomain.com    →  你的服务器IP
admin.yourdomain.com  →  你的服务器IP
```

### 2. 安装 SSL 证书

```bash
# 安装 EPEL 仓库
sudo yum install -y epel-release

# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 为应用端申请证书
sudo certbot --nginx -d app.yourdomain.com

# 为后台管理申请证书
sudo certbot --nginx -d admin.yourdomain.com
```

按照提示输入邮箱，同意条款，Certbot 会自动配置 SSL。

### 3. 测试自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# Certbot 会自动创建 cron 任务
# 查看定时任务
sudo crontab -l
```

---

## 第五步：验证部署

### 1. 检查服务状态

```bash
# 检查 PM2 状态
pm2 status

# 检查后端日志
pm2 logs miao-player-backend --lines 50

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 2. 测试访问

- 应用端：https://app.yourdomain.com
- 后台管理：https://admin.yourdomain.com
- API 健康检查：http://your_server_ip:3000/api/health

---

## 常见问题 (CentOS 特定)

### 问题 1：firewall-cmd 命令未找到

**错误信息**: `sudo: firewall-cmd: command not found`

**解决方案**：

```bash
# 安装 firewalld
sudo yum install -y firewalld

# 启动并启用 firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 验证安装
which firewall-cmd
firewall-cmd --version

# 然后继续配置防火墙规则
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**如果无法安装 firewalld**，可以使用 iptables：

```bash
# 安装 iptables-services
sudo yum install -y iptables-services

# 启动并启用
sudo systemctl start iptables
sudo systemctl enable iptables

# 开放端口
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo service iptables save
```

### 问题 2：防火墙阻止访问

```bash
# 检查防火墙状态
sudo firewall-cmd --state

# 查看已开放的端口
sudo firewall-cmd --list-all

# 重新开放端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 问题 3：SELinux 阻止 Nginx 访问

```bash
# 查看 SELinux 拒绝日志
sudo ausearch -m avc -ts recent

# 允许 Nginx 连接网络
sudo setsebool -P httpd_can_network_connect 1

# 重新配置目录权限
sudo chcon -R -t httpd_sys_content_t /var/www/miao-player
sudo chcon -R -t httpd_sys_rw_content_t /var/www/miao-player/uploads
```

### 问题 4：权限问题

```bash
# 确保目录所有权正确
sudo chown -R $USER:$USER /var/www/miao-player

# 确保 uploads 目录可写
chmod 755 /var/www/miao-player/uploads

# 确保 Nginx 可以读取文件
chmod 644 /var/www/miao-player/frontend-app/dist/index.html
```

### 问题 5：Certbot 安装失败

如果 yum 安装 certbot 失败，使用 Snap：

```bash
# 安装 Snap
sudo yum install -y snapd
sudo systemctl enable --now snapd.socket
sudo ln -s /var/lib/snapd/snap /snap

# 使用 Snap 安装 Certbot
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# 申请证书
sudo certbot --nginx -d app.yourdomain.com
```

### 问题 6：Node.js 版本过低

```bash
# 卸载旧版本
sudo yum remove -y nodejs npm

# 清理缓存
sudo yum clean all

# 重新安装
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证版本
node -v  # 应该是 v18.x.x
```

---

## 更新部署

### 更新代码

```bash
cd /var/www/miao-player

# Git 方式
git pull

# 或重新上传代码
```

### 更新后端

```bash
cd /var/www/miao-player/backend
npm install --production
pm2 restart miao-player-backend
```

### 更新前端

```bash
# 更新应用端
cd /var/www/miao-player/frontend-app
npm install
npm run build
sudo systemctl reload nginx

# 更新后台管理
cd /var/www/miao-player/frontend-admin
npm install
npm run build
sudo systemctl reload nginx
```

---

## 监控和维护

### 查看日志

```bash
# PM2 日志
pm2 logs miao-player-backend

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 系统日志
sudo journalctl -u nginx -f
```

### 性能监控

```bash
# PM2 监控
pm2 monit

# 查看详细信息
pm2 show miao-player-backend

# 服务器资源
top
htop  # 需要先安装: sudo yum install -y htop
```

### 备份

```bash
# 备份脚本
cat > ~/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
cp /var/www/miao-player/backend/data/database.db \
   $BACKUP_DIR/database_$DATE.db

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz \
   /var/www/miao-player/uploads/

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x ~/backup.sh

# 添加到 crontab（每天凌晨 2 点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup.sh") | crontab -
```

---

## 安全建议

1. **定期更新系统**
   ```bash
   sudo yum update -y
   ```

2. **配置 fail2ban 防暴力破解**
   ```bash
   sudo yum install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

3. **使用非 root 用户**
   ```bash
   # 创建应用用户
   sudo useradd -m -s /bin/bash miao
   sudo usermod -aG wheel miao
   
   # 切换到该用户进行部署
   su - miao
   ```

4. **限制上传文件大小**
   在 Nginx 配置中添加：
   ```nginx
   client_max_body_size 100M;
   ```

---

## 完成！🎉

现在你的音乐网站应该已经成功部署在 CentOS/TencentOS 服务器上了！

- 应用端：https://app.yourdomain.com
- 后台管理：https://admin.yourdomain.com

如有问题，请参考主部署文档：[DEPLOYMENT.md](./DEPLOYMENT.md)

