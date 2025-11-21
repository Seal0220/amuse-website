import {
  insertWork,
  listParentWorks,
  listWorks,
  listChildrenByParent,
  replaceChildren,
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/works?type=public-art|exhibition-space
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;
  const includeChildRows = searchParams.get('includeChildRows') === 'true';
  const expandChildren = searchParams.get('expandChildren') === 'true';

  const parseRow = (r) => {
    const safeObj = (val, fallback) => {
      try {
        const parsed = JSON.parse(val || '');
        return parsed && typeof parsed === 'object' ? parsed : fallback;
      } catch {
        return fallback;
      }
    };
    const size = (() => {
      try { return JSON.parse(r.size || '{}'); } catch { return {}; }
    })();
    const images = (() => {
      try { return JSON.parse(r.images || '[]'); } catch { return []; }
    })();
    return {
      ...r,
      size,
      images,
      is_multiple: !!r.is_multiple,
      title: safeObj(r.title, {}),
      medium: safeObj(r.medium, {}),
      location: safeObj(r.location, {}),
      management: safeObj(r.management, {}),
      description: safeObj(r.description, {}),
    };
  };

  const baseList = includeChildRows ? listWorks(type) : listParentWorks(type);
  const rows = baseList.map(parseRow);

  if (expandChildren) {
    rows.forEach(row => {
      row.children = listChildrenByParent(row.id).map(parseRow);
    });
  }

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
    is_multiple: body.isMultiple ? 1 : 0,
  };

  if (!data.slug) return new Response('slug required', { status: 400 });
  if (!JSON.parse(data.title).zh) return new Response('title.zh required', { status: 400 });

  const id = insertWork(data);

  // 處理子作品
  if (data.is_multiple && Array.isArray(body.children)) {
    const childIds = [];
    for (const child of body.children) {
      const childPayload = {
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

      if (!childPayload.slug) return new Response('child.slug required', { status: 400 });
      if (!JSON.parse(childPayload.title).zh) return new Response('child.title.zh required', { status: 400 });

      const childId = insertWork(childPayload);
      childIds.push(childId);
    }
    if (childIds.length > 0) {
      replaceChildren(id, childIds);
    }
  }
  return Response.json({ id }, { status: 201 });
}
