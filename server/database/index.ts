import initSqlJs, { Database } from 'sql.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Railway 上使用 /tmp 目录（唯一可写位置），本地开发使用 .data 目录
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT !== undefined
const dataDir = isProduction ? '/tmp' : join(__dirname, '../../.data')

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = join(dataDir, 'class-pet-home.db')

let db: Database | null = null

export async function getDatabase(): Promise<Database> {
  if (!db) {
    const SQL = await initSqlJs()

    console.log('Checking database at:', dbPath)
    const dbExists = fs.existsSync(dbPath)
    console.log('Database exists:', dbExists)

    // 尝试加载现有数据库
    try {
      if (dbExists) {
        const fileBuffer = fs.readFileSync(dbPath)
        db = new SQL.Database(fileBuffer)
        console.log('Database loaded from file, size:', fileBuffer.length, 'bytes')
      } else {
        db = new SQL.Database()
        console.log('Creating new in-memory database')
      }
    } catch (err) {
      console.error('Failed to load database, creating new:', err)
      db = new SQL.Database()
    }
  }
  return db
}

// 保存数据库到文件
export function saveDatabase() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
  console.log('Database saved to:', dbPath, 'size:', buffer.length, 'bytes')
}

export async function initDatabase() {
  const database = await getDatabase()

  // 用户表
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // 用户数据表（存储每个用户的应用数据）
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_data (
      user_id TEXT PRIMARY KEY NOT NULL,
      data_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  saveDatabase()

  console.log('Database initialized successfully')
  return database
}

export function closeDatabase() {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}
