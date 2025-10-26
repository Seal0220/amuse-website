import { NextResponse } from 'next/server';
import db from '@/lib/db';

const insertSubmission = db.prepare(`
  INSERT INTO contact_submissions (
    company,
    person,
    phone,
    email,
    address,
    message,
    created_at
  ) VALUES (@company, @person, @phone, @email, @address, @message, @createdAt)
`);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload.' },
      { status: 400 }
    );
  }

  const trimmed = Object.fromEntries(
    Object.entries({
      company: payload.company ?? '',
      person: payload.person ?? '',
      phone: payload.phone ?? '',
      email: payload.email ?? '',
      address: payload.address ?? '',
      message: payload.message ?? '',
    }).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : ''])
  );

  const errors = [];
  if (!trimmed.person) errors.push('person');
  if (!trimmed.email) errors.push('email');
  if (!trimmed.message) errors.push('message');
  if (trimmed.email && !emailRegex.test(trimmed.email)) {
    errors.push('email_format');
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed.', fields: errors },
      { status: 400 }
    );
  }

  try {
    const result = insertSubmission.run({
      company: trimmed.company || null,
      person: trimmed.person,
      phone: trimmed.phone || null,
      email: trimmed.email,
      address: trimmed.address || null,
      message: trimmed.message,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error('Failed to save contact submission', error);
    return NextResponse.json(
      { error: 'Failed to save submission.' },
      { status: 500 }
    );
  }
}
