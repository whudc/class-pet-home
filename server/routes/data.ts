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

    const userData: any = db.prepare(
      'SELECT data_json, version, updated_at FROM user_data WHERE user_id = ?'
    ).get(userId)

    if (!userData) {
      return res.json({ ok: true, data: null, version: 0 })
    }

    res.json({
      ok: true,
      data: JSON.parse(userData.data_json),
      version: userData.version,
      updatedAt: userData.updated_at
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
    const existing: any = db.prepare(
      'SELECT version FROM user_data WHERE user_id = ?'
    ).get(userId)

    if (existing) {
      // 更新现有数据
      db.prepare(`
        UPDATE user_data
        SET data_json = ?, version = ?, updated_at = ?
        WHERE user_id = ?
      `).run(JSON.stringify(data), newVersion, now, userId)
    } else {
      // 创建新数据
      db.prepare(`
        INSERT INTO user_data (user_id, data_json, version, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(userId, JSON.stringify(data), newVersion, now)
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
    const serverData: any = db.prepare(
      'SELECT data_json, version FROM user_data WHERE user_id = ?'
    ).get(userId)

    if (!serverData) {
      // 服务器没有数据，使用客户端数据
      if (data) {
        db.prepare(`
          INSERT INTO user_data (user_id, data_json, version, updated_at)
          VALUES (?, ?, ?, ?)
        `).run(userId, JSON.stringify(data), 1, now)
      }
      return res.json({
        ok: true,
        data: data || null,
        version: 1,
        synced: true
      })
    }

    const serverVersion = serverData.version
    const serverDataParsed = JSON.parse(serverData.data_json)

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
      db.prepare(`
        UPDATE user_data
        SET data_json = ?, version = ?, updated_at = ?
        WHERE user_id = ?
      `).run(JSON.stringify(data), clientVersion, now, userId)
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
