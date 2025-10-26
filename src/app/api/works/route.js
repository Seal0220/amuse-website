import { listWorks, insertWork } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/works?type=public-art|exhibition-space
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;

  const rows = listWorks(type).map(r => {
    return {
      ...r,
      images: (() => {
        try { return JSON.parse(r.images || '[]'); } catch { return []; }
      })(),
    };
  });

  return Response.json(rows);
}

export async function POST(req) {
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

  const id = insertWork(data);
  return Response.json({ id }, { status: 201 });
}
