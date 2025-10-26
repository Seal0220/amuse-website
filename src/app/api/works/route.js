import { listWorks, insertWork } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const rows = listWorks().map(r => ({ ...r, images: JSON.parse(r.images || '[]') }));
  return Response.json(rows);
}

export async function POST(req) {
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
  const id = insertWork(data);
  return Response.json({ id }, { status: 201 });
}
