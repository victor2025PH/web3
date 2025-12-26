# 初始化 Git 仓库并推送到 GitHub

## 步骤 1: 初始化本地 Git 仓库

```powershell
cd D:\web3-migration

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 首次提交
git commit -m "Initial commit: Three websites only"
```

## 步骤 2: 清空 GitHub 仓库并推送

### 方法 1: 强制推送（推荐）

```powershell
# 添加远程仓库
git remote add origin https://github.com/victor2025PH/web3.git

# 或者如果已存在，先删除再添加
git remote remove origin
git remote add origin https://github.com/victor2025PH/web3.git

# 强制推送（这会覆盖 GitHub 上的所有内容）
git push -f origin main
```

### 方法 2: 在 GitHub 上创建新分支（更安全）

```powershell
# 创建新分支
git checkout -b three-sites-only

# 推送新分支
git push origin three-sites-only

# 然后在 GitHub 上：
# 1. 进入仓库设置 (Settings)
# 2. 进入 Branches
# 3. 将 "three-sites-only" 设置为默认分支
# 4. 删除 main 分支
# 5. 将 "three-sites-only" 重命名为 "main"
```

### 方法 3: 创建全新的 GitHub 仓库

如果希望完全清空并重新开始：

1. **在 GitHub 上删除仓库**（或创建新仓库）
2. **在本地重新初始化**

```powershell
cd D:\web3-migration

# 如果 .git 存在，删除它
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue

# 重新初始化
git init
git add .
git commit -m "Initial commit: Three websites"

# 添加远程仓库
git remote add origin https://github.com/victor2025PH/web3.git

# 推送
git branch -M main
git push -u origin main
```

## 步骤 3: 验证

```powershell
# 检查远程仓库
git remote -v

# 检查状态
git status

# 查看提交历史
git log --oneline
```

## 注意事项

⚠️ **重要提示**：

1. **强制推送会删除 GitHub 上的所有现有文件**
2. **确保已经备份了需要的文件**（如果有）
3. **如果服务器上还在使用旧代码，需要重新部署**

## 服务器重新部署

推送完成后，在服务器上执行：

```bash
cd /opt/web3-sites

# 备份现有代码（如果需要）
sudo cp -r . ../web3-sites-backup-$(date +%Y%m%d_%H%M%S)

# 删除旧代码
sudo rm -rf *

# 重新克隆
git clone https://github.com/victor2025PH/web3.git .

# 或者如果仓库已存在，强制拉取
git fetch origin
git reset --hard origin/main
```

