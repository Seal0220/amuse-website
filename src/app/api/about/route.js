import { NextResponse } from 'next/server';
import { getAboutInfo, updateAboutInfo } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = getAboutInfo();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to load about info:', err);
    return NextResponse.json({ error: 'Failed to load about info' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const result = updateAboutInfo({
      headline: body?.headline,
      paragraphs: body?.paragraphs,
    });
    const data = getAboutInfo();
    return NextResponse.json({ success: true, result, data });
  } catch (err) {
    console.error('Failed to update about info:', err);
    return NextResponse.json({ error: err.message || 'Failed to update about info' }, { status: 500 });
  }
}
