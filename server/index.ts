import express from 'express'
import cors from 'cors'
import { authRoutes } from './routes/auth.js'
import { dataRoutes } from './routes/data.js'
import { initDatabase } from './database/index.js'

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'  // 允许外部访问

// 初始化数据库
initDatabase()

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`)
  console.log(`局域网访问地址：http://<你的IP 地址>:${PORT}`)
})
