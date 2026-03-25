import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDatabase } from '../database/index.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'class-pet-home-secret-key-change-in-production'

// 生成 Token
function generateToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '30d' })
}

// 验证 Token 中间件
export function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权，请先登录' })
  }

  const token = authHeader.substring(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; username: string }
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch {
    return res.status(401).json({ error: 'Token 无效，请重新登录' })
  }
}

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: '用户名至少 3 个字符' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 个字符' })
    }

    const db = getDatabase()

    // 检查用户名是否已存在
    const existing = db.exec('SELECT id FROM users WHERE username = $username', { $username: username })
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(409).json({ error: '用户名已存在' })
    }

    // 密码哈希
    const passwordHash = await bcrypt.hash(password, 10)
    const userId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const now = Date.now()

    // 创建用户
    db.exec(`INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES ($id, $username, $password, $createdAt, $updatedAt)`, {
      $id: userId,
      $username: username,
      $password: passwordHash,
      $createdAt: now,
      $updatedAt: now
    })

    // 创建用户初始数据
    db.exec(`INSERT INTO user_data (user_id, data_json, version, updated_at) VALUES ($userId, $data, $version, $updatedAt)`, {
      $userId: userId,
      $data: JSON.stringify({}),
      $version: 1,
      $updatedAt: now
    })

    // 生成 Token
    const token = generateToken(userId, username)

    res.json({
      ok: true,
      token,
      user: { id: userId, username, createdAt: now }
    })
  } catch (error: any) {
    console.error('Register error:', error)
    res.status(500).json({ error: '注册失败，请稍后重试' })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const db = getDatabase()

    // 查找用户
    const result = db.exec('SELECT * FROM users WHERE username = $username', { $username: username })
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: '用户名不存在' })
    }

    // 获取用户数据 (列顺序：id, username, password_hash, created_at, updated_at)
    const userRow = result[0].values[0]
    const user: any = {
      id: userRow[0],
      username: userRow[1],
      password_hash: userRow[2],
      created_at: userRow[3]
    }

    // 验证密码
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: '密码错误' })
    }

    // 生成 Token
    const token = generateToken(user.id, user.username)

    res.json({
      ok: true,
      token,
      user: { id: user.id, username: user.username, createdAt: user.created_at }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ error: '登录失败，请稍后重试' })
  }
})

// 获取当前用户信息
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    ok: true,
    user: { id: req.userId, username: req.username }
  })
})

export { router as authRoutes }
