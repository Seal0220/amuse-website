import fs from 'fs';
import path from 'path';
import {
  deleteWorkById,
  getWorkById,
  listChildrenOfParent,
  listMultipleParents,
  removeRelationsForWork,
  replaceChildren,
  setMultipleParent,
  insertWork,
  updateWorkById,
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req, ctx) {
  const { id } = await ctx.params;
  const includeChildren = new URL(req.url).searchParams.get('includeChildren') === '1';
  const row = getWorkById(Number(id));
  if (!row) return new Response('Not found', { status: 404 });
  let images = [];
  try { images = JSON.parse(row.images || '[]'); } catch {}
  const children = includeChildren
    ? listChildrenOfParent(Number(id)).map(cid => {
      const child = getWorkById(Number(cid));
      if (!child) return null;
      try { child.images = JSON.parse(child.images || '[]'); } catch { child.images = []; }
      return child;
    }).filter(Boolean)
    : undefined;
  const isMultiple = listMultipleParents().has(Number(id));
  return Response.json({ ...row, images, isMultiple, ...(includeChildren ? { children } : {}) });
}

export async function PUT(req, ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { children = [], isMultiple = false } = body;

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
    type: body.type === 'exhibition-space'
      ? 'exhibition-space'
      : body.type === 'multiple'
        ? 'multiple'
        : 'public-art',
  };

  if (!data.slug) return new Response('slug required', { status: 400 });
  if (!JSON.parse(data.title).zh) return new Response('title.zh required', { status: 400 });

  // === 刪除舊圖片（保留目前 images 中的） ===
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const workDir = path.join(publicDir, 'works', data.slug);
    if (fs.existsSync(workDir)) {
      const keepList = (body.images || []).map(img => path.basename(img));
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

  const childIds = [];
  try {
    for (const child of Array.isArray(children) ? children : []) {
      const childData = {
        slug: String(child.slug || '').trim(),
        title: JSON.stringify(child.title || { zh: '', en: '' }),
        medium: JSON.stringify(child.medium || { zh: '', en: '' }),
        size: JSON.stringify(child.size || { width: '', height: '', length: '' }),
        year: child.year || '',
        location: JSON.stringify(child.location || { zh: '', en: '' }),
        management: JSON.stringify(child.management || { zh: '', en: '' }),
        description: JSON.stringify(child.description || { zh: '', en: '' }),
        images: JSON.stringify(child.images || []),
        type: child.type === 'exhibition-space'
          ? 'exhibition-space'
          : child.type === 'multiple'
            ? 'multiple'
            : 'public-art',
      };
      if (!childData.slug) throw new Error('child.slug required');
      if (!JSON.parse(childData.title).zh) throw new Error('child.title.zh required');

      if (child.id && !child.isNew) {
        updateWorkById(child.id, childData);
        childIds.push(child.id);
      } else {
        const newId = insertWork(childData);
        childIds.push(Number(newId));
      }
    }
  } catch (err) {
    return new Response(err.message || 'child validation failed', { status: 400 });
  }

  const info = updateWorkById(Number(id), data);
  setMultipleParent(Number(id), isMultiple || childIds.length > 0);
  replaceChildren(Number(id), childIds);

  return Response.json({ ok: !!info.changes });
}

export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  removeRelationsForWork(Number(id));
  const info = deleteWorkById(Number(id));
  return Response.json({ ok: !!info.changes });
}
