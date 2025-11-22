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

// WORKS 表格
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

// 多作品父子關聯
db.exec(`
CREATE TABLE IF NOT EXISTS work_multiple_parents (
  parent_id   INTEGER PRIMARY KEY,
  is_multiple INTEGER NOT NULL DEFAULT 1
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS work_children (
  parent_id  INTEGER NOT NULL,
  child_id   INTEGER NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (parent_id, child_id)
);
`);

// MEMBERS 表格
db.exec(`
CREATE TABLE IF NOT EXISTS members (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,        -- JSON {zh, en}
  education   TEXT,                 -- JSON {zh, en}
  specialty   TEXT,                 -- JSON {zh, en}
  image       TEXT,
  order_index INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// CONTACT_INFO 表格
db.exec(`
CREATE TABLE IF NOT EXISTS contact_info (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  address     TEXT,       -- JSON {zh, en}
  phone       TEXT,
  email       TEXT,
  hours       TEXT,       -- JSON { open: 'HH:mm', close: 'HH:mm' }
  instagram   TEXT,
  facebook    TEXT
);
`);

// HERO_IMAGES 表格
db.exec(`
CREATE TABLE IF NOT EXISTS hero_images (
  images TEXT NOT NULL DEFAULT '[]'  -- JSON 陣列 ['/hero/2025-10-28-xxxxxx.png', ...]
);
`);

// ABOUT_INFO 表格
db.exec(`
CREATE TABLE IF NOT EXISTS about_info (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  headline TEXT DEFAULT '{"zh":"","en":""}',
  paragraphs TEXT DEFAULT '{"zh":[],"en":[]}'
);
`);

// MESSAGES 表格
db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  location TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT '未處理',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
`);


// ===== WORKS CRUD =====
function ensureColumn(name, ddl) {
  const rows = db.prepare(`PRAGMA table_info('works')`).all();
  const has = rows.some(r => r.name === name);
  if (!has) db.exec(`ALTER TABLE works ADD COLUMN ${ddl}`);
}
// 舊資料升級時：若缺 type，就補上並設為 public-art
ensureColumn('type', `type TEXT NOT NULL DEFAULT 'public-art'`);

// ===== 基本存取函式 =====

// 共用：把 works 資料列依 lang 轉成物件
function formatWorkRow(row, lang = 'zh') {
  if (!row) return null;

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

export function getWorkBySlug(slug, lang = 'zh') {
  const row = db.prepare('SELECT * FROM works WHERE slug = ?').get(slug);
  if (!row) return null;

  // 基本資料
  const work = formatWorkRow(row, lang);

  // 是否為「多作品父」：有在 work_multiple_parents 且 is_multiple = 1
  const mp = db
    .prepare('SELECT is_multiple FROM work_multiple_parents WHERE parent_id = ? LIMIT 1')
    .get(row.id);
  const isMultiple = !!(mp && mp.is_multiple);

  // 這個作品底下的子作品（已依 position 排序）
  const childRows = db.prepare(`
    SELECT w.*
    FROM work_children c
    JOIN works w ON w.id = c.child_id
    WHERE c.parent_id = ?
    ORDER BY c.position ASC, c.child_id ASC
  `).all(row.id);
  const children = childRows.map(r => formatWorkRow(r, lang));

  // 這個作品是否作為別人的子作品（取一個 parent 即可）
  const parentRow = db.prepare(`
    SELECT w.*
    FROM work_children c
    JOIN works w ON w.id = c.parent_id
    WHERE c.child_id = ?
    LIMIT 1
  `).get(row.id);
  const parent = parentRow ? formatWorkRow(parentRow, lang) : null;

  return {
    ...work,
    isMultiple,   // 是否為多作品父
    parent,       // 若本身是子作品，這裡是其父作品物件；否則為 null
    children,     // 若是多作品父，這裡是完整子作品清單；否則為 []
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

// ===== Multiple 父子關聯 =====
export function listMultipleParents() {
  return new Set(
    db.prepare('SELECT parent_id FROM work_multiple_parents WHERE is_multiple = 1').all()
      .map(r => r.parent_id)
  );
}

export function setMultipleParent(parentId, isMultiple) {
  if (isMultiple) {
    db.prepare('INSERT OR REPLACE INTO work_multiple_parents (parent_id, is_multiple) VALUES (?, 1)')
      .run(parentId);
  } else {
    db.prepare('DELETE FROM work_multiple_parents WHERE parent_id = ?').run(parentId);
  }
}

export function listChildRelations() {
  return db
    .prepare('SELECT parent_id as parentId, child_id as childId, position FROM work_children ORDER BY position ASC, child_id ASC')
    .all();
}

export function listChildrenOfParent(parentId) {
  return db
    .prepare('SELECT child_id as childId FROM work_children WHERE parent_id = ? ORDER BY position ASC, child_id ASC')
    .all(parentId)
    .map(r => r.childId);
}

export function replaceChildren(parentId, childIds) {
  const tx = db.transaction((pid, ids) => {
    db.prepare('DELETE FROM work_children WHERE parent_id = ?').run(pid);
    const stmt = db.prepare('INSERT OR REPLACE INTO work_children (parent_id, child_id, position) VALUES (?, ?, ?)');
    ids.forEach((cid, idx) => stmt.run(pid, cid, idx));
  });
  tx(parentId, childIds);
}

export function removeRelationsForWork(workId) {
  const tx = db.transaction(id => {
    db.prepare('DELETE FROM work_children WHERE parent_id = ? OR child_id = ?').run(id, id);
    db.prepare('DELETE FROM work_multiple_parents WHERE parent_id = ?').run(id);
  });
  tx(workId);
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

// ==== MEMBERS CRUD =====
export function getAllMembers() {
  return db.prepare(`SELECT * FROM members ORDER BY order_index ASC, id DESC`).all();
}

export function getMemberById(id) {
  return db.prepare(`SELECT * FROM members WHERE id = ?`).get(id);
}

export function addMember(data) {
  return db.prepare(`
    INSERT INTO members (name, education, specialty, image, order_index)
    VALUES (@name, @education, @specialty, @image, @order_index)
  `).run(data);
}

export function updateMemberById(id, data) {
  return db.prepare(`
    UPDATE members
    SET name=@name, education=@education, specialty=@specialty, image=@image, order_index=@order_index
    WHERE id=@id
  `).run({ ...data, id });
}

export function deleteMemberById(id) {
  return db.prepare(`DELETE FROM members WHERE id = ?`).run(id);
}

// ==== CONTACT_INFO CRUD =====
export function getContactInfo() {
  return db.prepare('SELECT * FROM contact_info LIMIT 1').get() || null;
}

export function updateContactInfo(data) {
  const existing = db.prepare('SELECT id FROM contact_info LIMIT 1').get();

  if (existing) {
    return db
      .prepare(`
        UPDATE contact_info SET 
          address = @address,
          phone = @phone,
          email = @email,
          hours = @hours,
          instagram = @instagram,
          facebook = @facebook
        WHERE id = @id
      `)
      .run({ ...data, id: existing.id });
  } else {
    return db
      .prepare(`
        INSERT INTO contact_info 
          (address, phone, email, hours, instagram, facebook)
        VALUES (@address, @phone, @email, @hours, @instagram, @facebook)
      `)
      .run(data);
  }
}

// ==== HERO_IMAGES CRUD =====
const hasHero = db.prepare('SELECT COUNT(*) as n FROM hero_images').get().n;
if (hasHero === 0) {
  db.prepare('INSERT INTO hero_images (images) VALUES (?)').run('[]');
}

export function getHeroImages() {
  return db.prepare('SELECT images FROM hero_images LIMIT 1').get();
}

export function updateHeroImages(images) {
  return db.prepare('UPDATE hero_images SET images = ?').run(JSON.stringify(images || []));
}

// ==== ABOUT_INFO CRUD =====
const hasAboutInfo = db.prepare('SELECT COUNT(*) as n FROM about_info').get().n;
if (hasAboutInfo === 0) {
  db
    .prepare('INSERT INTO about_info (id, headline, paragraphs) VALUES (1, ?, ?)')
    .run(
      JSON.stringify({ zh: '', en: '' }),
      JSON.stringify({ zh: [], en: [] }),
    );
}

export function getAboutInfo() {
  const row = db.prepare('SELECT headline, paragraphs FROM about_info WHERE id = 1').get();
  if (!row) {
    return {
      headline: { zh: '', en: '' },
      paragraphs: { zh: [], en: [] },
    };
  }

  const safeParse = (value, fallback) => {
    try {
      const parsed = JSON.parse(value ?? '');
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    headline: safeParse(row.headline, { zh: '', en: '' }),
    paragraphs: safeParse(row.paragraphs, { zh: [], en: [] }),
  };
}

export function updateAboutInfo(data) {
  const normalizeHeadline = (val = {}) => ({
    zh: typeof val.zh === 'string' ? val.zh : '',
    en: typeof val.en === 'string' ? val.en : '',
  });

  const normalizeParagraphs = (val = {}) => ({
    zh: Array.isArray(val.zh)
      ? val.zh.filter(p => typeof p === 'string' && p.trim() !== '')
      : [],
    en: Array.isArray(val.en)
      ? val.en.filter(p => typeof p === 'string' && p.trim() !== '')
      : [],
  });

  const headline = normalizeHeadline(data?.headline);
  const paragraphs = normalizeParagraphs(data?.paragraphs);

  const payload = {
    headline: JSON.stringify(headline),
    paragraphs: JSON.stringify(paragraphs),
  };

  const existing = db.prepare('SELECT id FROM about_info WHERE id = 1').get();
  if (existing) {
    return db
      .prepare('UPDATE about_info SET headline = @headline, paragraphs = @paragraphs WHERE id = 1')
      .run(payload);
  }

  return db
    .prepare('INSERT INTO about_info (id, headline, paragraphs) VALUES (1, @headline, @paragraphs)')
    .run(payload);
}

// ==== MESSAGES CRUD =====
export function addContactMessage(data) {
  const stmt = db.prepare(`
    INSERT INTO messages (company, name, phone, email, location, message)
    VALUES (@company, @name, @phone, @email, @location, @message)
  `)
  stmt.run(data)
}

export function getAllContactMessages() {
  return db.prepare(`SELECT * FROM messages ORDER BY created_at DESC`).all()
}

export function updateContactStatus(id, status) {
  return db.prepare(`UPDATE messages SET status = ? WHERE id = ?`).run(status, id)
}


export default db;
