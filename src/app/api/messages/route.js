import { NextResponse } from 'next/server'
import { addContactMessage, getAllContactMessages, updateContactStatus } from '@/lib/db'

export async function POST(req) {
  const body = await req.json()
  addContactMessage(body)
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const rows = getAllContactMessages()
  return NextResponse.json({ messages: rows })
}

// 更新狀態
export async function PUT(req) {
  const body = await req.json()
  updateContactStatus(body.id, body.status)
  return NextResponse.json({ ok: true })
}