import initSqlJs, { Database } from 'sql.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 确保数据目录存在
const dataDir = join(__dirname, '../../.data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = join(dataDir, 'class-pet-home.db')

let db: Database | null = null

export async function getDatabase(): Promise<Database> {
  if (!db) {
    const SQL = await initSqlJs()

    // 尝试加载现有数据库
    try {
      if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath)
        db = new SQL.Database(fileBuffer)
      } else {
        db = new SQL.Database()
      }
    } catch {
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
