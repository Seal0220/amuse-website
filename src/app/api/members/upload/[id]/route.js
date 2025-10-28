import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 產生隨機8位 UID
function randomUID() {
  return Math.random().toString(36).slice(2, 10);
}

// 產生 yyyy-mm-dd-hhmm 格式時間
function formattedDate() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileExt = path.extname(file.name);

  // === 可讀檔名：YYYY-MM-DD-HHmm-隨機8碼.ext ===
  const fileName = `${formattedDate()}-${randomUID()}${fileExt}`;

  // === 每次上傳使用獨立隨機8碼資料夾 ===
  const folderUID = randomUID();
  const memberDir = path.join(process.cwd(), 'public', 'members', folderUID);
  fs.mkdirSync(memberDir, { recursive: true });

  const filePath = path.join(memberDir, fileName);
  fs.writeFileSync(filePath, buffer);

  const url = `/members/${folderUID}/${fileName}`;
  return NextResponse.json({ url, uid: folderUID });
}
