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
    slug: body.slug.trim(),
    title: body.title.trim(),
    medium: body.medium || '',
    size: body.size || '',
    year: body.year || '',
    location: body.location || '',
    management: body.management || '',
    description: body.description || '',
    images: JSON.stringify(body.images || []),
  };
  const info = updateWorkById(Number(id), data);
  return Response.json({ ok: !!info.changes });
}

export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  const info = deleteWorkById(Number(id));
  return Response.json({ ok: !!info.changes });
}
