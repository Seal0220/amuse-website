import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

const folder = path.join(process.cwd(), 'public', 'types')

export async function GET() {
  const result = {}
  for (const key of ['public-art', 'exhibition-space']) {
    const filePath = path.join(folder, `${key}_hero.jpg`)
    result[key] = fs.existsSync(filePath) ? `/types/${key}_hero.jpg` : null
  }
  return NextResponse.json(result)
}

export async function POST(req) {
  const formData = await req.formData()
  const type = formData.get('type')
  const file = formData.get('file')

  if (!type || !file) {
    return new Response('缺少必要參數', { status: 400 })
  }

  if (!['public-art', 'exhibition-space'].includes(type)) {
    return new Response('類型錯誤', { status: 400 })
  }

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const filePath = path.join(folder, `${type}_hero.jpg`)
  fs.writeFileSync(filePath, buffer)

  return NextResponse.json({ ok: true, url: `/types/${type}_hero.jpg` })
}
