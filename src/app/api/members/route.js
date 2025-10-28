import { getAllMembers, addMember } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 取得所有成員
export async function GET() {
  const rows = getAllMembers();
  return Response.json(rows);
}

// 新增成員
export async function POST(req) {
  const body = await req.json();
  const data = {
    name: JSON.stringify(body.name || { zh: '', en: '' }),
    education: JSON.stringify(body.education || { zh: '', en: '' }),
    specialty: JSON.stringify(body.specialty || { zh: '', en: '' }),
    image: String(body.image || ''),
    order_index: body.order_index || 0,
  };

  if (!JSON.parse(data.name).zh) return new Response('name.zh required', { status: 400 });

  const info = addMember(data);
  return Response.json({ ok: !!info.changes });
}
