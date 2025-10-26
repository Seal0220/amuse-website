import { getWorkById, updateWorkById, deleteWorkById } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req, ctx) {
  const { id } = await ctx.params;
  const row = getWorkById(Number(id));
  if (!row) return new Response('Not found', { status: 404 });
  let images = [];
  try { images = JSON.parse(row.images || '[]'); } catch {}
  return Response.json({ ...row, images });
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
  };

  if (!data.slug) return new Response('slug required', { status: 400 });
  if (!JSON.parse(data.title).zh) return new Response('title.zh required', { status: 400 });

  const info = updateWorkById(Number(id), data);
  return Response.json({ ok: !!info.changes });
}

export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  const info = deleteWorkById(Number(id));
  return Response.json({ ok: !!info.changes });
}
