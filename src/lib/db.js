import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const globalForDb = globalThis;

function initializeDatabase() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'amuse.db');
  const database = new Database(dbPath);

  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT,
      person TEXT NOT NULL,
      phone TEXT,
      email TEXT NOT NULL,
      address TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public_art_works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      medium TEXT,
      size TEXT,
      year TEXT,
      location TEXT,
      management TEXT,
      description TEXT NOT NULL,
      hero_image TEXT
    );
  `);

  const worksCount = database
    .prepare('SELECT COUNT(*) as count FROM public_art_works')
    .get().count;

  if (worksCount === 0) {
    const insert = database.prepare(`
      INSERT INTO public_art_works (
        slug,
        title,
        medium,
        size,
        year,
        location,
        management,
        description,
        hero_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      'light-path',
      '光徑',
      '金屬、影像PC板、LED燈、控制系統',
      '720 × 720 × 48（cm）',
      '2024',
      '成功大學',
      '財團法人國家實驗研究院台灣半導體研究中心',
      `從石器到鐵器，在文明的長河裡，每一個時代都以工具為名——而今，「矽」成為科技的核心，鋪展了我們的「矽時代」。
「矽」開啟人類探索二元之外的旅程，在導體與絕緣體之間，因雜質的注入而生成新的可能。「矽」成為了人類開啟未來之門的要角。
光作為指引者、穿越微觀疆域，經由照射與聚焦，雕琢出指甲大小、數億電晶體連結而成的積體電路。作品「光徑」簇立在台灣半導體研究中心；
在光與科技交融、於夜幕降臨時，幻化為光性雕塑，啟迪著每一個路過的人。這些如神經元般交織的微連接，築成了通向未來的光徑。
它超越有機與無機，模糊象界、擴張感知的疆界，創造無限可能。`,
      '/banner-test.png'
    );
  }

  return database;
}

const db = globalForDb.sqliteDb ?? initializeDatabase();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqliteDb = db;
}

export default db;
