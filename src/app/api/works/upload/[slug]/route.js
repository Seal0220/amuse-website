import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg',
  '.mp4', '.mov', '.webm'
]);

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function safeName(original) {
  const ext = path.extname(original || '').toLowerCase().slice(0, 8) || '';
  const stamp = new Date().toISOString().replace(/[:.]/g, '').replace('T','-').slice(0,15);
  const rand = crypto.randomBytes(4).toString('hex');
  return `${stamp}-${rand}${ext}`;
}

function sanitizeSlug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')   // 僅保留 a-z 0-9 - _
    .replace(/-+/g, '-')            // 連續 - 壓成一個
    .replace(/^[-_]+|[-_]+$/g, ''); // 去頭尾 - _
}

export async function POST(req, ctx) {
  // Next 15+：params 可能是 Promise
  const { slug } = await ctx.params;
  const clean = sanitizeSlug(slug);
  if (!clean) return new Response('Invalid slug', { status: 400 });

  const form = await req.formData();
  const files = form.getAll('files');
  if (!files || files.length === 0) {
    return new Response('No files', { status: 400 });
  }

  const baseDir = path.join(process.cwd(), 'public', 'works', clean);
  ensureDir(baseDir);

  const results = [];
  for (const f of files) {
    if (typeof f === 'string') continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const ext = path.extname(f.name || '').toLowerCase();
    if (ALLOWED.size && !ALLOWED.has(ext)) {
      return new Response(`Unsupported file type: ${ext}`, { status: 415 });
    }
    const filename = safeName(f.name);
    const absPath = path.join(baseDir, filename);
    fs.writeFileSync(absPath, buf);

    const url = `/works/${clean}/${filename}`; // 可直接用於 <img src>
    results.push({ name: f.name, filename, url, size: buf.length });
  }

  return Response.json({ files: results });
}
