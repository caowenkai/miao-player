# CentOS/TencentOS 快速部署参考

## 🚀 一键安装脚本

将以下脚本保存为 `centos-install.sh` 并执行：

```bash
#!/bin/bash
set -e

echo "======================================"
echo "  喵音乐播放器 - CentOS 一键部署"
echo "======================================"

# 更新系统
echo ">>> 更新系统..."
sudo yum update -y

# 安装 Node.js
echo ">>> 安装 Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装 Nginx
echo ">>> 安装 Nginx..."
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 安装 Git 和 PM2
echo ">>> 安装 Git 和 PM2..."
sudo yum install -y git
sudo npm install -g pm2

# 配置防火墙
echo ">>> 配置防火墙..."
# 安装并启动 firewalld
sudo yum install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld
# 配置规则
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# 配置 SELinux
echo ">>> 配置 SELinux..."
sudo setsebool -P httpd_can_network_connect 1

# 创建部署目录
echo ">>> 创建部署目录..."
sudo mkdir -p /var/www/miao-player
sudo chown -R $USER:$USER /var/www/miao-player

echo "======================================"
echo "  环境准备完成！"
echo "======================================"
echo ""
echo "下一步："
echo "1. 上传代码到 /var/www/miao-player"
echo "2. 按照文档继续部署"
echo ""
echo "详细文档: docs/DEPLOYMENT_CENTOS.md"
```

## 📝 核心命令速查

### 安装环境

```bash
# Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Nginx
sudo yum install -y nginx

# Git & PM2
sudo yum install -y git
sudo npm install -g pm2
```

### 配置防火墙

#### 使用 firewalld（推荐）

```bash
# 先安装 firewalld（如果没有安装）
sudo yum install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 配置规则
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

#### 使用 iptables（备选方案）

```bash
# 安装 iptables-services
sudo yum install -y iptables-services
sudo systemctl start iptables
sudo systemctl enable iptables

# 开放端口
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo service iptables save
sudo iptables -L -n
```

### 配置 SELinux

```bash
# 允许 Nginx 连接网络
sudo setsebool -P httpd_can_network_connect 1

# 配置目录权限
sudo chcon -R -t httpd_sys_content_t /var/www/miao-player
sudo chcon -R -t httpd_sys_rw_content_t /var/www/miao-player/uploads
```

### 启动服务

```bash
# PM2 启动后端
cd /var/www/miao-player/backend
pm2 start src/index.js --name miao-player-backend
pm2 save
pm2 startup

# Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### SSL 证书

```bash
# 安装 Certbot
sudo yum install -y epel-release
sudo yum install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d app.yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com
```

### 日志查看

```bash
# PM2 日志
pm2 logs miao-player-backend

# Nginx 日志
sudo tail -f /var/log/nginx/error.log

# SELinux 拒绝日志
sudo ausearch -m avc -ts recent
```

## 🔧 常见问题速查

### Nginx 502 Bad Gateway

```bash
# 1. 检查后端是否运行
pm2 status

# 2. 检查 SELinux
sudo setsebool -P httpd_can_network_connect 1

# 3. 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 防火墙问题

```bash
# 检查状态
sudo firewall-cmd --list-all

# 开放端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 上传文件失败

```bash
# 检查目录权限
ls -lZ /var/www/miao-player/uploads

# 配置 SELinux 权限
sudo chcon -R -t httpd_sys_rw_content_t /var/www/miao-player/uploads

# 检查目录所有权
sudo chown -R $USER:$USER /var/www/miao-player
```

## 📚 完整文档

- [CentOS 详细部署指南](./docs/DEPLOYMENT_CENTOS.md)
- [通用部署文档](./docs/DEPLOYMENT.md)
- [开发指南](./docs/DEVELOPMENT.md)

## 🆘 需要帮助？

如果遇到问题，请提供以下信息：

```bash
# 系统信息
cat /etc/redhat-release
uname -a

# 服务状态
pm2 status
sudo systemctl status nginx
getenforce

# 防火墙规则
sudo firewall-cmd --list-all

# 最近的错误日志
pm2 logs miao-player-backend --lines 50 --err
sudo tail -100 /var/log/nginx/error.log
```

