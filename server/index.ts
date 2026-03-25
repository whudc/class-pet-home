import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { authRoutes } from './routes/auth.js'
import { dataRoutes } from './routes/data.js'
import { initDatabase } from './database/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

// 初始化数据库
initDatabase()

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 服务前端静态文件
app.use(express.static(path.join(__dirname, '../dist')))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// SPA 回退路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'))
})

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`)
  console.log(`Frontend: http://${HOST}:${PORT}`)
})
