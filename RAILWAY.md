# Railway 部署配置说明

## 问题描述

默认情况下，Railway 容器在重新部署时会清空所有文件，包括 SQLite 数据库文件。这导致每次部署新版本时，所有账号和数据都会丢失。

## 解决方案：配置 Railway 持久化卷

Railway 现已使用 **Config-as-code** 方式配置存储卷。

### 方式 1：使用 Config-as-code（推荐）

1. 确保项目根目录有 `railway.toml` 文件（已创建）
2. 推送代码到 GitHub
3. Railway 会自动读取配置并挂载存储卷

### 方式 2：通过 Dashboard 手动配置

如果 Config-as-code 未生效，可以手动配置：

1. 进入 Railway Dashboard
2. 点击 **Config-as-code** 标签页
3. 点击 **Add Volume** 或编辑配置
4. 或者在 **Deploy** 标签页找到存储配置

### 方式 3：使用 Railway CLI

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录并链接项目
railway login
railway link

# 添加存储卷
railway volume add -m /app/server/data
```

### 验证配置

### 验证配置

部署后，查看日志确认：
```
Using Railway Persistent Volume: /app/server/data
```

## 环境变量说明

| 变量名 | 说明 | 优先级 |
|--------|------|--------|
| `RAILWAY_VOLUME_MOUNT_PATH` | Railway 持久化卷挂载路径 | 最高 |
| `DATABASE_PATH` | 自定义数据库路径 | 中 |
| (无) | 使用 `/tmp`（数据会丢失） | 最低 |

## 本地备份（可选）

在本地开发时，可以手动备份数据库：

```bash
cd server
pnpm backup-db
```

备份文件存储在 `.backups/` 目录，保留最近 10 个备份。

## 数据迁移

系统已内置数据库版本检查机制。每次启动时：

1. 检查当前数据库模式版本
2. 如需要，自动执行迁移脚本
3. 确保新旧数据兼容

## 常见问题

### Q: 配置持久化卷后数据还是丢失了？

A: 请确认：
1. 持久化卷已正确创建并挂载到 `/data`
2. 环境变量 `RAILWAY_VOLUME_MOUNT_PATH=/data` 已设置
3. 重新部署后查看日志，确认显示 "Using Railway Persistent Volume: /data"

### Q: 如何迁移现有数据到持久化卷？

A: 如果当前版本还在运行：
1. 先配置持久化卷和环境变量
2. 下一次部署时会自动使用新路径
3. 但如果要保留现有数据，需要在当前部署中备份数据库文件

### Q: 可以更改持久化卷的大小吗？

A: 可以，在 Railway Dashboard 的 Volumes 页面调整大小。

## 完成检查清单

- [ ] 推送 `railway.toml` 配置到 GitHub
- [ ] Railway 自动读取配置并创建存储卷
- [ ] 验证日志显示使用持久化卷
- [ ] 验证创建账号后重新部署数据仍然存在
