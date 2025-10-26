import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 允許以環境變數覆蓋 DB 檔案位置；預設 <project>/data/site.db
const DEFAULT_DIR = path.join(process.cwd(), 'data');
const DB_PATH = process.env.DB_PATH || path.join(DEFAULT_DIR, 'site.db');

// 確保資料夾存在
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 開啟 SQLite（不存在會自動建立空檔）
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // 安全/效能折衷

// 最小 schema：加入 type 欄位（public-art | exhibition-space）
db.exec(`
CREATE TABLE IF NOT EXISTS works (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,         -- JSON {zh, en}
  medium      TEXT,                  -- JSON {zh, en}
  size        TEXT,                  -- JSON {width,height,length}
  year        TEXT,
  location    TEXT,                  -- JSON {zh, en}
  management  TEXT,                  -- JSON {zh, en}
  description TEXT,                  -- JSON {zh, en}
  images      TEXT DEFAULT '[]',
  type        TEXT NOT NULL DEFAULT 'public-art'  -- 'public-art', 'exhibition-space'
);
`);

// --- 輕量 migration：若舊庫沒有欄位，補上 ---
function ensureColumn(name, ddl) {
  const rows = db.prepare(`PRAGMA table_info('works')`).all();
  const has = rows.some(r => r.name === name);
  if (!has) db.exec(`ALTER TABLE works ADD COLUMN ${ddl}`);
}
// 舊資料升級時：若缺 type，就補上並設為 public-art
ensureColumn('type', `type TEXT NOT NULL DEFAULT 'public-art'`);

// ===== 基本存取函式 =====
export function getWorkBySlug(slug, lang = 'zh') {
  const row = db.prepare('SELECT * FROM works WHERE slug = ?').get(slug);
  if (!row) return null;

  // 解析 JSON 欄位
  const parseObj = (s) => {
    try { return JSON.parse(s || '{}'); } catch { return {}; }
  };
  const parseArr = (s) => {
    try { return JSON.parse(s || '[]'); } catch { return []; }
  };
  const title = parseObj(row.title);
  const medium = parseObj(row.medium);
  const location = parseObj(row.location);
  const management = parseObj(row.management);
  const description = parseObj(row.description);
  const size = (() => {
    try { return JSON.parse(row.size || '{}'); } catch { return {}; }
  })();
  const images = parseArr(row.images);

  // 依 lang 回傳對應語系值（fallback zh → en → 任一）
  const pick = (obj) => {
    if (!obj || typeof obj !== 'object') return obj ?? '';
    return obj[lang] ?? obj.zh ?? obj.en ?? Object.values(obj)[0] ?? '';
  };

  return {
    id: row.id,
    slug: row.slug,
    title: pick(title),
    medium: pick(medium),
    location: pick(location),
    management: pick(management),
    description: pick(description),
    year: row.year || '',
    size: {
      width: size?.width || '',
      height: size?.height || '',
      length: size?.length || '',
    },
    images,
    type: row.type || 'public-art',
  };
}

export function listWorks(type /* 可選：public-art | exhibition-space */) {
  if (type) {
    return db
      .prepare('SELECT * FROM works WHERE type = ? ORDER BY year DESC, id DESC')
      .all(type);
  }
  return db.prepare('SELECT * FROM works ORDER BY year DESC, id DESC').all();
}

export function getWorkById(id) {
  return db.prepare('SELECT * FROM works WHERE id = ?').get(id);
}

export function insertWork(data) {
  const stmt = db.prepare(`
    INSERT INTO works (slug, title, medium, size, year, location, management, description, images, type)
    VALUES (@slug, @title, @medium, @size, @year, @location, @management, @description, @images, @type)
  `);
  const info = stmt.run(data);
  return info.lastInsertRowid;
}

export function updateWorkById(id, data) {
  const stmt = db.prepare(`
    UPDATE works
    SET slug=@slug, title=@title, medium=@medium, size=@size, year=@year,
        location=@location, management=@management, description=@description,
        images=@images, type=@type
    WHERE id = @id
  `);
  return stmt.run({ id, ...data });
}

export function deleteWorkById(id) {
  return db.prepare('DELETE FROM works WHERE id = ?').run(id);
}

// 依同一類別，照年份/ID 找相鄰作品
export function getAdjacentWorks(slug) {
  const row = db.prepare('SELECT id, year, type FROM works WHERE slug = ?').get(slug);
  if (!row) return { prevWork: null, nextWork: null };

  // 同 type 的清單
  const rows = db
    .prepare('SELECT * FROM works WHERE type = ? ORDER BY year DESC, id DESC')
    .all(row.type);

  const idx = rows.findIndex(r => r.slug === slug);
  const prevWork = idx > 0 ? rows[idx - 1] : null;
  const nextWork = idx >= 0 && idx < rows.length - 1 ? rows[idx + 1] : null;
  return { prevWork, nextWork };
}

export default db;
