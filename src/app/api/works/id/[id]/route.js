import fs from 'fs';
import path from 'path';
import {
  deleteWorkById,
  getWorkById,
  insertWork,
  listChildrenByParent,
  removeRelationsForWork,
  replaceChildren,
  updateWorkById,
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function cleanupImages(slug, images) {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const workDir = path.join(publicDir, 'works', slug);
    if (fs.existsSync(workDir)) {
      const keepList = (images || []).map(img => path.basename(img));
      const allFiles = fs.readdirSync(workDir);
      for (const file of allFiles) {
        if (!keepList.includes(file)) {
          fs.unlinkSync(path.join(workDir, file));
        }
      }
    }
  } catch (err) {
    console.error('Failed to clean old images:', err);
  }
}

export async function GET(_req, ctx) {
  const { id } = await ctx.params;
  const row = getWorkById(Number(id));
  if (!row) return new Response('Not found', { status: 404 });
  let images = [];
  let children = [];
  try { images = JSON.parse(row.images || '[]'); } catch {}
  try {
    children = listChildrenByParent(Number(id)).map(child => ({
      ...child,
      images: Array.isArray(child.images) ? child.images : [],
    }));
  } catch {}
  return Response.json({ ...row, is_multiple: !!row.is_multiple, images, children });
}

export async function PUT(req, ctx) {
  const { id } = await ctx.params;
  const body = await req.json();

  const data = {
    slug: String(body.slug || '').trim(),
    title: JSON.stringify(body.title || { zh: '', en: '' }),
    medium: JSON.stringify(body.medium || { zh: '', en: '' }),
    size: JSON.stringify(body.size || { width: '', height: '', length: '' }),
    year: body.year || '',
    location: JSON.stringify(body.location || { zh: '', en: '' }),
    management: JSON.stringify(body.management || { zh: '', en: '' }),
    description: JSON.stringify(body.description || { zh: '', en: '' }),
    images: JSON.stringify(body.images || []),
    type: body.type === 'exhibition-space' ? 'exhibition-space' : 'public-art',
    is_multiple: body.isMultiple ? 1 : 0,
  };

  if (!data.slug) return new Response('slug required', { status: 400 });
  if (!JSON.parse(data.title).zh) return new Response('title.zh required', { status: 400 });

  // === 刪除舊圖片（保留目前 images 中的） ===
  cleanupImages(data.slug, body.images);

  const info = updateWorkById(Number(id), data);

  if (data.is_multiple) {
    const childIds = [];
    if (Array.isArray(body.children)) {
      for (const child of body.children) {
        const payload = {
          slug: String(child.slug || '').trim(),
          title: JSON.stringify(child.title || { zh: '', en: '' }),
          medium: JSON.stringify(child.medium || { zh: '', en: '' }),
          size: JSON.stringify(child.size || { width: '', height: '', length: '' }),
          year: child.year || '',
          location: JSON.stringify(child.location || { zh: '', en: '' }),
          management: JSON.stringify(child.management || { zh: '', en: '' }),
          description: JSON.stringify(child.description || { zh: '', en: '' }),
          images: JSON.stringify(child.images || []),
          type: child.type === 'exhibition-space' ? 'exhibition-space' : 'public-art',
          is_multiple: child.isMultiple ? 1 : 0,
        };

        if (!payload.slug) return new Response('child.slug required', { status: 400 });
        if (!JSON.parse(payload.title).zh) return new Response('child.title.zh required', { status: 400 });

        cleanupImages(payload.slug, child.images);
        if (child.id) {
          updateWorkById(Number(child.id), payload);
          childIds.push(Number(child.id));
        } else {
          const childId = insertWork(payload);
          childIds.push(childId);
        }
      }
    }
    replaceChildren(Number(id), childIds);
  } else {
    removeRelationsForWork(Number(id));
  }

  return Response.json({ ok: !!info.changes });
}

export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  removeRelationsForWork(Number(id));
  const info = deleteWorkById(Number(id));
  return Response.json({ ok: !!info.changes });
}
