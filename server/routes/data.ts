import { Router, Request } from 'express'
import { getDatabase, initDatabase } from '../database/index.js'
import { authMiddleware } from './auth.js'

const router = Router()

// 声明扩展的 Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: string
      username?: string
    }
  }
}

// 所有数据路由都需要认证
router.use(authMiddleware)

// 获取用户数据
router.get('/', (req, res) => {
  try {
    const db = getDatabase()
    const userId = req.userId!

    const result = db.exec('SELECT data_json, version, updated_at FROM user_data WHERE user_id = $userId', { $userId: userId })

    if (result.length === 0 || result[0].values.length === 0) {
      return res.json({ ok: true, data: null, version: 0 })
    }

    const row = result[0].values[0]
    res.json({
      ok: true,
      data: JSON.parse(row[0] as string),
      version: row[1] as number,
      updatedAt: row[2] as number
    })
  } catch (error: any) {
    console.error('Get data error:', error)
    res.status(500).json({ error: '获取数据失败' })
  }
})

// 保存用户数据
router.post('/save', (req, res) => {
  try {
    const { data, version } = req.body
    const userId = req.userId!

    if (!data) {
      return res.status(400).json({ error: '数据不能为空' })
    }

    const db = getDatabase()
    const now = Date.now()
    const newVersion = (version || 0) + 1

    // 检查是否存在用户数据
    const result = db.exec('SELECT version FROM user_data WHERE user_id = $userId', { $userId: userId })
    const existing = result.length > 0 && result[0].values.length > 0

    if (existing) {
      // 更新现有数据
      db.exec(`UPDATE user_data SET data_json = $data, version = $version, updated_at = $updatedAt WHERE user_id = $userId`, {
        $data: JSON.stringify(data),
        $version: newVersion,
        $updatedAt: now,
        $userId: userId
      })
    } else {
      // 创建新数据
      db.exec(`INSERT INTO user_data (user_id, data_json, version, updated_at) VALUES ($userId, $data, $version, $updatedAt)`, {
        $userId: userId,
        $data: JSON.stringify(data),
        $version: newVersion,
        $updatedAt: now
      })
    }

    res.json({
      ok: true,
      version: newVersion,
      updatedAt: now
    })
  } catch (error: any) {
    console.error('Save data error:', error)
    res.status(500).json({ error: '保存数据失败' })
  }
})

// 同步数据（带版本控制）
router.post('/sync', (req, res) => {
  try {
    const { data, clientVersion, deviceId } = req.body
    const userId = req.userId!

    const db = getDatabase()
    const now = Date.now()

    // 获取服务器数据
    const result = db.exec('SELECT data_json, version FROM user_data WHERE user_id = $userId', { $userId: userId })

    if (result.length === 0 || result[0].values.length === 0) {
      // 服务器没有数据，使用客户端数据
      if (data) {
        db.exec(`INSERT INTO user_data (user_id, data_json, version, updated_at) VALUES ($userId, $data, $version, $updatedAt)`, {
          $userId: userId,
          $data: JSON.stringify(data),
          $version: 1,
          $updatedAt: now
        })
      }
      return res.json({
        ok: true,
        data: data || null,
        version: 1,
        synced: true
      })
    }

    const serverData = result[0].values[0]
    const serverVersion = serverData[1] as number
    const serverDataParsed = JSON.parse(serverData[0] as string)

    // 如果客户端版本落后，返回服务器数据
    if ((clientVersion || 0) < serverVersion) {
      return res.json({
        ok: true,
        data: serverDataParsed,
        version: serverVersion,
        synced: false,
        hasNewer: true
      })
    }

    // 版本相同，无需同步
    if ((clientVersion || 0) === serverVersion) {
      return res.json({
        ok: true,
        data: serverDataParsed,
        version: serverVersion,
        synced: true
      })
    }

    // 客户端版本更新，更新服务器数据
    if (data) {
      db.exec(`UPDATE user_data SET data_json = $data, version = $version, updated_at = $updatedAt WHERE user_id = $userId`, {
        $data: JSON.stringify(data),
        $version: clientVersion,
        $updatedAt: now,
        $userId: userId
      })
    }

    res.json({
      ok: true,
      data: serverDataParsed,
      version: clientVersion,
      synced: true
    })
  } catch (error: any) {
    console.error('Sync data error:', error)
    res.status(500).json({ error: '同步数据失败' })
  }
})

// 健康检查
router.get('/health', (req, res) => {
  res.json({ ok: true, userId: req.userId })
})

export { router as dataRoutes }
