import { getWorkBySlug } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req, context) {
  const { slug } = await context.params;

  const row = getWorkBySlug(slug);
  if (!row) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  let images = [];
  try { images = JSON.parse(row.images || '[]'); } catch (_) {}

  return Response.json({ ...row, images });
}
