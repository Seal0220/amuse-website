import {
  insertWork,
  listChildRelations,
  listMultipleParents,
  listWorks,
  replaceChildren,
  setMultipleParent,
  updateWorkById,
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/works?type=public-art|exhibition-space
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;
  const includeChildren = searchParams.get('includeChildren') === '1';
  const showChildren = searchParams.get('showChildren') === '1';

  const childRelations = listChildRelations();
  const childIdSet = new Set(childRelations.map(r => r.childId));
  const parentToChildren = new Map();
  childRelations.forEach(rel => {
    if (!parentToChildren.has(rel.parentId)) parentToChildren.set(rel.parentId, []);
    parentToChildren.get(rel.parentId).push(rel.childId);
  });
  const multipleParents = listMultipleParents();

  const rawRows = listWorks(type);
  const rowMap = new Map(rawRows.map(r => [r.id, r]));
  const parseRow = (r) => {
    if (!r) return null;
    return {
      ...r,
      images: (() => {
        try { return JSON.parse(r.images || '[]'); } catch { return []; }
      })(),
    };
  };

  const filtered = rawRows.filter(r => showChildren || !childIdSet.has(r.id));
  const rows = filtered.map(r => {
    const base = parseRow(r);
    const children = includeChildren
      ? (parentToChildren.get(r.id) || [])
        .map(id => parseRow(rowMap.get(id)))
        .filter(Boolean)
      : undefined;
    return {
      ...base,
      isMultiple: multipleParents.has(r.id),
      ...(includeChildren ? { children } : {}),
    };
  });

  return Response.json(rows);
}

export async function POST(req) {
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
        const insertedId = insertWork(childData);
        childIds.push(Number(insertedId));
      }
    }
  } catch (err) {
    return new Response(err.message || 'child validation failed', { status: 400 });
  }

  const id = insertWork(data);
  setMultipleParent(Number(id), isMultiple || childIds.length > 0);
  replaceChildren(Number(id), childIds);

  return Response.json({ id }, { status: 201 });
}
