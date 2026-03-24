# 部署到 Railway 云平台

## 步骤

### 1. 将代码推送到 GitHub

```bash
# 在根目录执行
git push origin master
```

### 2. 访问 Railway

1. 打开 https://railway.app
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权 Railway 访问你的 GitHub
5. 选择 `class-pet-home-local` 仓库

### 3. 配置部署

1. Railway 会自动识别 `server` 目录（有 nixpacks.toml）
2. 在 Railway 面板中设置：
   - **Root Directory**: `server`
   - **Start Command**: `node --loader tsx index.ts`

### 4. 添加环境变量

在 Railway 面板的 "Variables" 中添加：
```
PORT=3000
JWT_SECRET=你的随机密钥（至少 32 字符）
```

生成随机密钥：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. 部署

点击 "Deploy"，等待部署完成。

部署成功后，Railway 会给你一个公网域名，例如：
```
https://class-pet-home-production.up.railway.app
```

### 6. 更新前端配置

修改项目根目录的 `.env` 文件：

```env
VITE_API_URL=https://你的-railway-域名/api
```

然后重新构建前端：
```bash
npm run build
```

## 免费额度说明

Railway 每月提供 $5 免费额度：
- 足够个人项目使用
- 数据库使用量：约 2-3 GB 免费
- 如果超出会自动邮件通知

## 其他部署平台

### Render (备选)
1. 访问 https://render.com
2. 创建 "Web Service"
3. 连接 GitHub 仓库
4. 设置 Root Directory: `server`
5. 设置 Start Command: `node --loader tsx index.ts`

### Vercel + 云数据库
如果需要更稳定的方案，可以：
- 前端部署到 Vercel
- 后端使用 Supabase 或 LeanCloud
