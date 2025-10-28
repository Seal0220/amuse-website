import fs from 'fs';
import path from 'path';
import { getHeroImages, updateHeroImages } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const row = getHeroImages();
  let images = [];
  try { images = JSON.parse(row?.images || '[]'); } catch {}
  return Response.json({ images });
}

export async function PUT(req) {
  const body = await req.json();
  const newImages = Array.isArray(body.images) ? body.images : [];

  try {
    const heroDir = path.join(process.cwd(), 'public', 'hero');
    if (!fs.existsSync(heroDir)) fs.mkdirSync(heroDir, { recursive: true });

    // === 刪除未保留的檔案 ===
    const keepList = newImages.map((url) => path.basename(url));
    const allFiles = fs.readdirSync(heroDir);
    for (const file of allFiles) {
      if (!keepList.includes(file)) {
        try { fs.unlinkSync(path.join(heroDir, file)); } catch {}
      }
    }

    // === 把保留的檔案正規化命名為 hero-01.png, hero-02.png ...
    const tempMap = new Map(); // 原 → 暫存名
    for (const base of keepList) {
      const src = path.join(heroDir, base);
      if (fs.existsSync(src)) {
        const tmp = `${base}.tmp-${Math.random().toString(36).slice(2, 8)}`;
        fs.renameSync(src, path.join(heroDir, tmp));
        tempMap.set(base, tmp);
      }
    }

    const finalUrls = [];
    keepList.forEach((base, idx) => {
      const tmp = tempMap.get(base);
      if (!tmp) return;
      const finalName = `hero-${String(idx + 1).padStart(2, '0')}.png`;
      const from = path.join(heroDir, tmp);
      const to = path.join(heroDir, finalName);
      fs.renameSync(from, to);
      finalUrls.push(`/hero/${finalName}`);
    });

    // === 更新資料庫 ===
    updateHeroImages(finalUrls);

    return Response.json({ ok: true, images: finalUrls });
  } catch (err) {
    console.error('Failed to update hero images:', err);
    return new Response('Failed to update hero images', { status: 500 });
  }
}