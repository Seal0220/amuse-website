import { getMemberById, updateMemberById, deleteMemberById } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 取得單一成員
export async function GET(_req, ctx) {
  const { id } = await ctx.params;
  const row = getMemberById(Number(id));
  if (!row) return new Response('Not found', { status: 404 });

  let name = {}, education = {}, specialty = {};
  try { name = JSON.parse(row.name || '{}'); } catch {}
  try { education = JSON.parse(row.education || '{}'); } catch {}
  try { specialty = JSON.parse(row.specialty || '{}'); } catch {}

  return Response.json({ ...row, name, education, specialty });
}

// 更新成員
export async function PUT(req, ctx) {
  const { id } = await ctx.params;
  const body = await req.json();

  const data = {
    name: JSON.stringify(body.name || { zh: '', en: '' }),
    education: JSON.stringify(body.education || { zh: '', en: '' }),
    specialty: JSON.stringify(body.specialty || { zh: '', en: '' }),
    image: String(body.image || ''),
    order_index: body.order_index || 0,
  };

  if (!JSON.parse(data.name).zh) return new Response('name.zh required', { status: 400 });

  const info = updateMemberById(Number(id), data);
  return Response.json({ ok: !!info.changes });
}

// 刪除成員
export async function DELETE(_req, ctx) {
  const { id } = await ctx.params;
  const info = deleteMemberById(Number(id));
  return Response.json({ ok: !!info.changes });
}
