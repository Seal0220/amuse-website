import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 允許以環境變數覆蓋 DB 檔案位置；預設 <project>/data/site.db
const DEFAULT_DIR = path.join(process.cwd(), 'data');
const DB_PATH = process.env.DB_PATH || path.join(DEFAULT_DIR, 'site.db');

// 確保資料夾存在（不會建立任何資料，只是準備好位置）
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 開啟 SQLite（不存在會自動建立空檔）
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // 安全/效能折衷

// 最小 schema：只有 works 表；images 存 JSON 字串
db.exec(`
CREATE TABLE IF NOT EXISTS works (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  medium      TEXT,
  size        TEXT,
  year        TEXT,
  location    TEXT,
  management  TEXT,
  description TEXT,
  images      TEXT DEFAULT '[]'
);
`);

// ===== 基本存取函式（後台 API 會用到） =====
export function getWorkBySlug(slug) {
  return db.prepare('SELECT * FROM works WHERE slug = ?').get(slug);
}

export function listWorks() {
  return db.prepare('SELECT * FROM works ORDER BY year DESC, id DESC').all();
}

export function getWorkById(id) {
  return db.prepare('SELECT * FROM works WHERE id = ?').get(id);
}

export function insertWork(data) {
  const stmt = db.prepare(`
    INSERT INTO works (slug, title, medium, size, year, location, management, description, images)
    VALUES (@slug, @title, @medium, @size, @year, @location, @management, @description, @images)
  `);
  const info = stmt.run(data);
  return info.lastInsertRowid;
}

export function updateWorkById(id, data) {
  const stmt = db.prepare(`
    UPDATE works
    SET slug=@slug, title=@title, medium=@medium, size=@size, year=@year,
        location=@location, management=@management, description=@description, images=@images
    WHERE id = @id
  `);
  return stmt.run({ id, ...data });
}

export function deleteWorkById(id) {
  return db.prepare('DELETE FROM works WHERE id = ?').run(id);
}

export default db;
