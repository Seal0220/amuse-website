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

    const worksSeed = [
      {
        slug: 'light-path',
        title: '光徑',
        medium: '金屬、影像PC板、LED燈、控制系統',
        size: '720 × 720 × 48（cm）',
        year: '2024',
        location: '成功大學',
        management: '財團法人國家實驗研究院台灣半導體研究中心',
        description: `從石器到鐵器，在文明的長河裡，每一個時代都以工具為名——而今，「矽」成為科技的核心，鋪展了我們的「矽時代」。
「矽」開啟人類探索二元之外的旅程，在導體與絕緣體之間，因雜質的注入而生成新的可能。「矽」成為了人類開啟未來之門的要角。
光作為指引者、穿越微觀疆域，經由照射與聚焦，雕琢出指甲大小、數億電晶體連結而成的積體電路。作品「光徑」簇立在台灣半導體研究中心；
在光與科技交融、於夜幕降臨時，幻化為光性雕塑，啟迪著每一個路過的人。這些如神經元般交織的微連接，築成了通向未來的光徑。
它超越有機與無機，模糊象界、擴張感知的疆界，創造無限可能。`,
        hero_image: '/banner-test.png',
      },
      {
        slug: 'resonant-horizon',
        title: '共鳴地平線',
        medium: '鋼、光纖、聲學系統',
        size: '540 × 540 × 320（cm）',
        year: '2023',
        location: '桃園國際機場第二航廈',
        management: '桃園國際機場公司',
        description: '以共振的聲波與光帶象徵旅人流動的軌跡，描繪人與城市之間不斷回響的連結。',
        hero_image: '/banner-test.png',
      },
      {
        slug: 'celestial-garden',
        title: '星庭',
        medium: '鋁合金、玻璃、雷射投影',
        size: '420 × 420 × 280（cm）',
        year: '2022',
        location: '臺中國家歌劇院廣場',
        management: '臺中國家歌劇院',
        description: '半透明的星座花園在夜幕點亮，觀者穿梭其間，彷彿置身宇宙花圃之中。',
        hero_image: '/banner-test.png',
      },
      {
        slug: 'tidal-memory',
        title: '潮記',
        medium: '不鏽鋼、聲音採樣、互動感測',
        size: '360 × 360 × 300（cm）',
        year: '2021',
        location: '高雄港旅運中心',
        management: '高雄市政府文化局',
        description: '以潮汐循環為靈感，透過互動聲響喚起港都居民的記憶與故事。',
        hero_image: '/banner-test.png',
      },
      {
        slug: 'luminous-script',
        title: '光文譜',
        medium: 'LED矩陣、壓克力、演算法控制',
        size: '300 × 300 × 260（cm）',
        year: '2020',
        location: '臺北市立圖書館總館',
        management: '臺北市立圖書館',
        description: '以程式書寫流動文字，象徵知識在城市間流動與擴散。',
        hero_image: '/banner-test.png',
      },
      {
        slug: 'windweave',
        title: '風編',
        medium: '碳纖維、風能轉換器、燈光',
        size: '280 × 280 × 240（cm）',
        year: '2019',
        location: '臺南市立美術館二館',
        management: '臺南市政府文化局',
        description: '捕捉風向與風速資料，讓光影在結構間編織出城市的呼吸節奏。',
        hero_image: '/banner-test.png',
      },
      {
        slug: 'echoing-currents',
        title: '回聲流',
        medium: '鋁板、水霧、感測系統',
        size: '260 × 260 × 220（cm）',
        year: '2018',
        location: '新竹市立動物園',
        management: '新竹市文化局',
        description: '水霧與聲波交織，描繪動物與環境共存的節奏。',
        hero_image: '/banner-test.png',
      },
      {
        slug: 'spectrum-verse',
        title: '光譜詩',
        medium: '玻璃、光纖、互動影像',
        size: '240 × 240 × 210（cm）',
        year: '2017',
        location: '臺北小巨蛋外廣場',
        management: '臺北市政府體育局',
        description: '以光譜變化作為詩句節奏，映照城市的脈動。',
        hero_image: '/banner-test.png',
      },
      {
        slug: 'urban-orbit',
        title: '城市軌道',
        medium: '不鏽鋼、光纖、旋轉機構',
        size: '220 × 220 × 200（cm）',
        year: '2016',
        location: '板橋車站中庭',
        management: '新北市政府捷運工程局',
        description: '透過旋轉光環象徵都市軌道運行，呈現人流與交通的節奏。',
        hero_image: '/banner-test.png',
      },
      {
        slug: 'floating-ink',
        title: '浮墨',
        medium: '墨水噴泉、玻璃、水循環系統',
        size: '200 × 200 × 180（cm）',
        year: '2015',
        location: '臺北當代藝術館廣場',
        management: '臺北當代藝術館',
        description: '循環水墨在透明玻璃間流動，描繪書寫與時間交融的軌跡。',
        hero_image: '/banner-test.png',
      },
      {
        slug: 'aurora-fragments',
        title: '極光碎片',
        medium: '壓克力、光纖布料、聲音感測',
        size: '180 × 180 × 160（cm）',
        year: '2014',
        location: '花蓮文化創意產業園區',
        management: '花蓮縣文化局',
        description: '以光與聲音模擬極光破碎的瞬間，邀請觀者尋找內心的亮光。',
        hero_image: '/banner-test.png',
      },
    ];

    const insertMany = database.transaction((rows) => {
      rows.forEach((row) => {
        insert.run(
          row.slug,
          row.title,
          row.medium,
          row.size,
          row.year,
          row.location,
          row.management,
          row.description,
          row.hero_image,
        );
      });
    });

    insertMany(worksSeed);
  }

  return database;
}

const db = globalForDb.sqliteDb ?? initializeDatabase();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqliteDb = db;
}

export default db;
