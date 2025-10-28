import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST(req) {
  const formData = await req.formData();
  const files = formData.getAll('files');

  const folder = path.join(process.cwd(), 'public', 'hero');
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const saved = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 暫時命名：hero-temp-xxxxxx.png
    const tmpId = randomBytes(3).toString('hex');
    const fileName = `hero-temp-${tmpId}.png`;
    const filePath = path.join(folder, fileName);

    fs.writeFileSync(filePath, buffer);
    saved.push({ name: fileName, url: `/hero/${fileName}` });
  }

  return NextResponse.json({ files: saved });
}
