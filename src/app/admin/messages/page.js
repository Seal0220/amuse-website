'use client'
import React, { useEffect, useState } from 'react'

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/messages', { cache: 'no-store' })
    const data = await res.json()
    setMessages(data.messages || [])
    setLoading(false)
  }

  async function toggleStatus(id, current) {
    const newStatus = current === '已處理' ? '未處理' : '已處理'
    await fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    setMsg('已更新狀態')
    load()
  }

  useEffect(() => { load() }, [])

  return (
    <div className='bg-neutral-950 text-white min-h-lvh p-8'>
      <div className='flex flex-row items-center gap-8'>
        <h1 className='text-2xl font-bold mb-6'>聯絡表單紀錄</h1>
        {msg && <div className='mb-4 text-sm text-green-400'>{msg}</div>}
      </div>

      {loading ? (
        <div>載入中...</div>
      ) : messages.length === 0 ? (
        <div>目前沒有資料</div>
      ) : (
        <table className='w-full text-sm rounded-2xl overflow-hidden border border-white/50'>
          <thead className='bg-white/20'>
            <tr>
              <th className='px-3 py-2 border-r border-white/8'>公司名稱</th>
              <th className='px-3 py-2 border-r border-white/8'>聯絡人</th>
              <th className='px-3 py-2 border-r border-white/8'>電話</th>
              <th className='px-3 py-2 border-r border-white/8'>電子郵件</th>
              <th className='px-3 py-2 border-r border-white/8'>所在地</th>
              <th className='px-3 py-2 border-r border-white/8'>需求說明</th>
              <th className='px-3 py-2 border-r border-white/8'>狀態</th>
              <th className='px-3 py-2'>時間</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(m => (
              <tr key={m.id} className='bg-white/8 border-t border-white/10 hover:bg-white/12 transition-all duration-300 ease-in-out'>
                <td className='px-3 py-2 border-r border-white/8'>{m.company || '—'}</td>
                <td className='px-3 py-2 border-r border-white/8 w-32'>{m.name}</td>
                <td className='px-3 py-2 border-r border-white/8 w-32'>{m.phone || '—'}</td>
                <td className='px-3 py-2 border-r border-white/8'>{m.email}</td>
                <td className='px-3 py-2 border-r border-white/8'>{m.location || '—'}</td>
                <td className='px-3 py-2 border-r border-white/8'>{m.message}</td>
                <td className='px-3 py-2 border-r border-white/8 w-14'>
                  <button
                    onClick={() => toggleStatus(m.id, m.status)}
                    className={`px-2 py-1 w-14 rounded text-xs font-bold cursor-pointer transition-all duration-300 ease-in-out
                     ${m.status === '已處理'
                        ? 'bg-green-700 hover:bg-green-800'
                        : 'bg-yellow-700 hover:bg-yellow-800'
                      }`}
                  >
                    {m.status}
                  </button>
                </td>
                <td className='px-3 py-2 opacity-70 w-40'>{m.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
