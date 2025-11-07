# 后台管理无法访问 - 排查指南

## 快速排查步骤

### 步骤 1：检查端口是否开放

```bash
# 检查防火墙是否开放了 8080 端口
sudo firewall-cmd --list-all | grep 8080

# 如果没有，添加端口
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# 检查端口是否在监听
sudo netstat -tlnp | grep 8080
# 或
sudo ss -tlnp | grep 8080
```

**如果使用云服务器**，还需要在云控制台的安全组中开放 8080 端口：
- 腾讯云：云服务器 → 安全组 → 添加入站规则（TCP:8080）
- 阿里云：ECS → 安全组 → 添加规则（端口 8080/8080）

### 步骤 2：检查 Nginx 配置

```bash
# 查看配置文件内容
sudo cat /etc/nginx/conf.d/miao-player.conf

# 测试配置是否正确
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -50 /var/log/nginx/error.log
```

### 步骤 3：检查后台管理文件是否存在

```bash
# 检查后台管理的 dist 目录是否存在
ls -la /var/www/miao-player/frontend-admin/dist

# 检查 index.html 是否存在
ls -la /var/www/miao-player/frontend-admin/dist/index.html

# 如果不存在，需要重新构建
cd /var/www/miao-player/frontend-admin
npm run build
```

### 步骤 4：检查 Nginx 是否监听 8080 端口

```bash
# 查看 Nginx 进程和监听的端口
sudo netstat -tlnp | grep nginx
# 或
sudo ss -tlnp | grep nginx

# 应该看到类似：
# tcp  0  0  0.0.0.0:80   0.0.0.0:*  LISTEN  nginx进程ID
# tcp  0  0  0.0.0.0:8080 0.0.0.0:*  LISTEN  nginx进程ID
```

### 步骤 5：重启 Nginx

```bash
# 重启 Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx

# 查看实时日志
sudo tail -f /var/log/nginx/error.log
```

## 常见问题解决方案

### 问题 1：端口 8080 没有开放

**症状**：浏览器无法连接，超时

**解决**：
```bash
# 开放端口
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# 验证
sudo firewall-cmd --list-ports
```

### 问题 2：后台管理文件未构建

**症状**：Nginx 日志显示 404 或找不到文件

**解决**：
```bash
cd /var/www/miao-player/frontend-admin
npm install
npm run build

# 检查构建结果
ls -la dist/
```

### 问题 3：Nginx 配置错误

**症状**：Nginx 测试失败或日志有错误

**解决**：
```bash
# 检查配置语法
sudo nginx -t

# 如果有错误，检查配置文件
sudo vi /etc/nginx/conf.d/miao-player.conf

# 确保后台管理的 server 块配置正确
```

### 问题 4：权限问题

**症状**：Nginx 无法读取文件

**解决**：
```bash
# 检查文件权限
ls -la /var/www/miao-player/frontend-admin/dist

# 确保 Nginx 可以读取
sudo chown -R nginx:nginx /var/www/miao-player/frontend-admin/dist
# 或
sudo chmod -R 755 /var/www/miao-player/frontend-admin/dist
```

## 完整检查清单

执行以下命令，逐一检查：

```bash
# 1. 检查端口开放
echo "=== 检查防火墙 ==="
sudo firewall-cmd --list-all | grep 8080

# 2. 检查端口监听
echo "=== 检查端口监听 ==="
sudo netstat -tlnp | grep 8080

# 3. 检查文件存在
echo "=== 检查文件 ==="
ls -la /var/www/miao-player/frontend-admin/dist/index.html

# 4. 检查 Nginx 配置
echo "=== 检查 Nginx 配置 ==="
sudo nginx -t

# 5. 检查 Nginx 状态
echo "=== 检查 Nginx 状态 ==="
sudo systemctl status nginx

# 6. 查看错误日志
echo "=== 查看错误日志 ==="
sudo tail -20 /var/log/nginx/error.log
```

## 如果还是无法访问

请提供以下信息：

1. **访问时的错误信息**：
   - 浏览器显示什么？（404、502、超时等）
   - 浏览器控制台（F12）有什么错误？

2. **服务器端信息**：
   ```bash
   # 执行这些命令，把输出发给我
   sudo nginx -t
   sudo systemctl status nginx
   sudo tail -50 /var/log/nginx/error.log
   sudo netstat -tlnp | grep 8080
   ls -la /var/www/miao-player/frontend-admin/dist/
   ```

3. **防火墙状态**：
   ```bash
   sudo firewall-cmd --list-all
   ```

## 临时测试方案

如果想快速测试，可以临时使用同一个端口，通过路径区分：

```nginx
server {
    listen 80;
    server_name _;
    
    # 应用端
    location / {
        root /var/www/miao-player/frontend-app/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # 后台管理
    location /admin {
        alias /var/www/miao-player/frontend-admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }
    
    # API 和 uploads 配置...
}
```

但这种方式需要修改前端路由配置，不推荐。建议先排查 8080 端口的问题。

