import { getContactInfo, updateContactInfo } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 取得聯絡資訊
export async function GET() {
  const row = getContactInfo();
  
  if (!row) return Response.json({});
  let data = { ...row };
  try { data.address = JSON.parse(row.address || '{}'); } catch {}
  try { data.hours = JSON.parse(row.hours || '{}'); } catch {}
  return Response.json(data);
}

// 更新聯絡資訊
export async function PUT(req) {
  const body = await req.json();
  const data = {
    address: JSON.stringify(body.address ?? { zh: '', en: '' }),
    phone: body.phone ?? '',
    email: body.email ?? '',
    hours: JSON.stringify(body.hours ?? { open: '', close: '' }),
    instagram: body.instagram ?? '',
    facebook: body.facebook ?? '',
  };
  const info = updateContactInfo(data);
  return Response.json({ ok: !!info.changes });
}
