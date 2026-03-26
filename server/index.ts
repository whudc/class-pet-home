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

// 中间件 - 禁用所有缓存
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Surrogate-Control', 'no-store')
  res.setHeader('X-Accel-Expires', '0')
  next()
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 服务前端静态文件（带缓存控制）
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
}))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// SPA 回退路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'))
})

// 异步启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase()
    console.log('Database initialized successfully')

    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`)
      console.log(`Frontend: http://${HOST}:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
