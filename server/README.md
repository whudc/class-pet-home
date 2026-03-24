# Class Pet Home - 后端 API 服务

## 技术栈

- **后端**: Node.js + Express
- **数据库**: sql.js (SQLite 纯 JavaScript 实现)
- **认证**: JWT Token
- **加密**: bcryptjs

## 快速开始

### 安装依赖

```bash
# 安装前端依赖 (根目录)
npm install

# 安装后端依赖 (server 目录)
cd server && npm install
```

### 开发模式

**同时启动前后端服务** (推荐):
```bash
npm run dev:all
```

**单独启动后端服务**:
```bash
cd server
npm run dev
```
后端服务运行在 `http://localhost:3000`

**单独启动前端服务**:
```bash
npm run dev
```
前端服务运行在 `http://localhost:5173`

## API 文档

### 认证接口

#### 用户注册
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

响应:
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u_1234567890_abc123",
    "username": "testuser",
    "createdAt": 1234567890000
  }
}
```

#### 用户登录
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

#### 获取当前用户
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

### 数据接口

#### 获取用户数据
```bash
GET /api/data/
Authorization: Bearer <token>
```

#### 保存用户数据
```bash
POST /api/data/save
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": { ... },
  "version": 1
}
```

#### 同步数据
```bash
POST /api/data/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": { ... },
  "clientVersion": 1,
  "deviceId": "device-123"
}
```

## 数据同步机制

1. **版本控制**: 每次数据变更版本号 +1
2. **冲突解决**: 以较新版本的數據為準
3. **自动同步**: 前端每 5 秒自动同步一次
4. **离线支持**: 数据同时保存在本地 IndexedDB

## 环境变量

创建 `.env` 文件配置 API 地址:

```env
VITE_API_URL=http://localhost:3000/api
```

## 部署

### 生产环境部署

1. 设置 JWT_SECRET 环境变量:
```bash
export JWT_SECRET="your-secret-key-change-in-production"
```

2. 构建前端:
```bash
npm run build
```

3. 启动后端服务:
```bash
cd server
NODE_ENV=production node --loader tsx index.ts
```

## 数据备份

数据库文件存储在 `.data/class-pet-home.db`

建议定期备份此文件。

## 注意事项

- 开发环境请使用 `npm run dev:all` 同时启动前后端
- 生产环境请修改 `JWT_SECRET` 为安全密钥
- 数据库文件请定期备份
- 建议部署时使用 HTTPS 保护数据传输安全
