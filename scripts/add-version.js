import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const distPath = join(__dirname, '..', 'dist', 'index.html')

try {
  let html = readFileSync(distPath, 'utf-8')

  // 添加版本时间戳注释到 html 标签
  const version = Date.now().toString()
  html = html.replace('<html lang="zh-CN">', `<html lang="zh-CN" data-version="${version}">`)

  writeFileSync(distPath, html, 'utf-8')
  console.log(`✓ Added version ${version} to index.html`)
} catch (err) {
  console.error('Failed to add version:', err.message)
}
