# 服务器重新部署指南

## ✅ 已完成

1. ✅ 本地 Git 仓库已初始化
2. ✅ 代码已推送到 GitHub（强制覆盖）
3. ✅ GitHub 仓库现在只包含三个网站

## 🚀 服务器重新部署步骤

### 步骤 1: SSH 连接到服务器

```bash
ssh ubuntu@your-server-ip
```

### 步骤 2: 进入项目目录

```bash
cd /opt/web3-sites
```

### 步骤 3: 备份现有代码（可选，但推荐）

```bash
# 创建备份
sudo cp -r . ../web3-sites-backup-$(date +%Y%m%d_%H%M%S)

# 或只备份重要数据
sudo mkdir -p ../backup-$(date +%Y%m%d_%H%M%S)
sudo cp -r admin-backend-minimal/admin.db ../backup-$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
sudo cp -r admin-backend-minimal/.env ../backup-$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
```

### 步骤 4: 清理并重新拉取代码

**方法 1: 如果目录是 Git 仓库**

```bash
# 强制拉取最新代码
git fetch origin
git reset --hard origin/main
git clean -fd
```

**方法 2: 删除并重新克隆（推荐）**

```bash
# 回到上级目录
cd /opt

# 备份当前目录（如果需要）
sudo mv web3-sites web3-sites-old-$(date +%Y%m%d_%H%M%S)

# 重新克隆
sudo git clone https://github.com/victor2025PH/web3.git web3-sites
sudo chown -R ubuntu:ubuntu web3-sites
cd web3-sites
```

### 步骤 5: 构建三个网站

```bash
# 网站1: aizkw
cd aizkw20251219
npm install
npm run build
cd ..

# 网站2: tgmini
cd tgmini20251220
npm install
npm run build
cd ..

# 网站3: hongbao
cd hbwy20251220
npm install
npm run build
cd ..
```

### 步骤 6: 停止旧服务（如果有）

```bash
# 停止所有 PM2 进程
pm2 stop all
pm2 delete all

# 或者只停止旧的后端和管理后台
pm2 delete admin-backend
pm2 delete sites-admin-frontend
```

### 步骤 7: 启动三个前端服务

```bash
# 启动 aizkw (端口 3001)
cd aizkw20251219
pm2 start "npx serve -s dist -l 3001" --name aizkw-frontend
cd ..

# 启动 tgmini (端口 3002)
cd tgmini20251220
pm2 start "npx serve -s dist -l 3002" --name tgmini-frontend
cd ..

# 启动 hongbao (端口 3003)
cd hbwy20251220
pm2 start "npx serve -s dist -l 3003" --name hongbao-frontend
cd ..
```

### 步骤 8: 保存 PM2 配置

```bash
pm2 save
pm2 startup
```

### 步骤 9: 验证服务状态

```bash
# 查看 PM2 状态
pm2 list

# 查看日志
pm2 logs

# 检查端口
ss -tulpn | grep -E "3001|3002|3003"
```

### 步骤 10: 测试网站访问

```bash
# 测试本地访问
curl http://127.0.0.1:3001
curl http://127.0.0.1:3002
curl http://127.0.0.1:3003
```

## ⚠️ 重要注意事项

### 1. Nginx 配置

确保 Nginx 配置正确指向三个端口：

- `aizkw.usdt2026.cc` → `http://127.0.0.1:3001`
- `tgmini.usdt2026.cc` → `http://127.0.0.1:3002`
- `hongbao.usdt2026.cc` → `http://127.0.0.1:3003`

如果 Nginx 配置需要更新：

```bash
# 检查 Nginx 配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 2. 后端和管理后台

⚠️ **重要**: 现在 GitHub 仓库中**没有后端和管理后台代码**。

如果服务器上还需要这些服务：

1. **保留服务器上的现有代码**（不要删除 `admin-backend-minimal/` 和 `sites-admin-frontend/`）
2. **或者**从其他位置恢复这些目录

### 3. 数据备份

如果之前有重要的数据库或配置文件：

```bash
# 备份数据库
cp admin-backend-minimal/admin.db ../backup/

# 备份环境变量
cp admin-backend-minimal/.env ../backup/
```

## 🔧 快速部署脚本（可选）

如果需要，可以创建一个快速部署脚本：

```bash
#!/bin/bash
# Quick deploy script

cd /opt/web3-sites

# Pull latest code
git fetch origin
git reset --hard origin/main
git clean -fd

# Build all sites
for site in aizkw20251219 tgmini20251220 hbwy20251220; do
    echo "Building $site..."
    cd $site
    npm install
    npm run build
    cd ..
done

# Restart PM2 services
pm2 restart all
pm2 save

echo "Deployment complete!"
```

保存为 `quick_deploy.sh`，然后：

```bash
chmod +x quick_deploy.sh
./quick_deploy.sh
```

## 📋 验证清单

- [ ] 代码已从 GitHub 拉取
- [ ] 三个网站已构建（`dist/` 目录存在）
- [ ] PM2 服务正在运行
- [ ] 端口 3001, 3002, 3003 正在监听
- [ ] Nginx 配置正确
- [ ] 网站可以通过域名访问
- [ ] HTTPS 正常工作（如果有配置）

## 🆘 故障排除

### 问题 1: npm install 失败

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题 2: 端口被占用

```bash
# 查找占用端口的进程
sudo lsof -i :3001
sudo lsof -i :3002
sudo lsof -i :3003

# 杀死进程
sudo kill -9 <PID>
```

### 问题 3: PM2 服务无法启动

```bash
# 查看详细日志
pm2 logs <service-name>

# 检查服务配置
pm2 describe <service-name>
```

### 问题 4: 网站无法访问

```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 检查 PM2 日志
pm2 logs
```

## ✅ 完成

部署完成后，三个网站应该可以正常访问：
- https://aizkw.usdt2026.cc
- https://tgmini.usdt2026.cc
- https://hongbao.usdt2026.cc

