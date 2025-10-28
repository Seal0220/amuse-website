'use client';
import React, { useEffect, useState } from 'react';

export default function AdminContactPage() {
  const [contact, setContact] = useState({
    address: { zh: '', en: '' },
    phone: '',
    email: '',
    hours: { open: '', close: '' },
    instagram: '',
    facebook: ''
  });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState('zh');
  const [loading, setLoading] = useState(true);

  // === 載入資料 ===
  async function load() {
    setLoading(true);
    const res = await fetch('/api/contact', { cache: 'no-store' });
    const data = await res.json();

    setContact({
      address: data.address || { zh: '', en: '' },
      phone: data.phone || '',
      email: data.email || '',
      hours: data.hours || { open: '', close: '' },
      instagram: data.instagram || '',
      facebook: data.facebook || ''
    });
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // === 儲存 ===
  async function handleSave(e) {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(contact),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg('已儲存');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg('失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <div className='text-white p-8 opacity-70'>載入中...</div>;

  return (
    <div className='bg-neutral-950 text-white min-h-lvh'>
      <div className='flex min-h-lvh border-t border-white/15'>
        <main className='flex-1 p-8 overflow-y-auto max-w-3xl'>
          <header className='flex items-center justify-between mb-8'>
            <h1 className='text-2xl font-bold'>聯絡我們資訊</h1>
            <div className='text-sm opacity-80'>{msg}</div>
          </header>

          <div className='flex gap-2 mb-6'>
            {['zh', 'en'].map(l => (
              <div
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1 rounded-full text-sm border cursor-pointer ${lang === l
                  ? 'bg-white text-black border-white'
                  : 'border-white/20 text-white/60 hover:text-white'
                  }`}
              >
                {l === 'zh' ? '中文' : '英文'}
              </div>
            ))}
          </div>

          <form onSubmit={handleSave} className='space-y-6'>
            {/* 地址 */}
            <label className='block'>
              <div className='mb-1 text-sm opacity-80'>
                地址（{lang === 'zh' ? '中文' : '英文'}）
              </div>
              <input
                type='text'
                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                value={contact.address[lang] || ''}
                onChange={e =>
                  setContact(v => ({
                    ...v,
                    address: { ...v.address, [lang]: e.target.value },
                  }))
                }
              />
            </label>

            {/* 電話 */}
            <label className='block'>
              <div className='mb-1 text-sm opacity-80'>電話</div>
              <input
                type='text'
                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                value={contact.phone || ''}
                onChange={e => setContact(v => ({ ...v, phone: e.target.value }))}
              />
            </label>

            {/* Email */}
            <label className='block'>
              <div className='mb-1 text-sm opacity-80'>Email</div>
              <input
                type='email'
                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                value={contact.email || ''}
                onChange={e => setContact(v => ({ ...v, email: e.target.value }))}
              />
            </label>

            {/* 營業時間 */}
            {/* <div>
              <div className='mb-1 text-sm opacity-80'>營業時間</div>
              <div className='flex items-center gap-3'>
                <input
                  type='time'
                  className='px-3 py-2 rounded bg-white/5 border border-white/15'
                  value={contact.hours?.open || ''}
                  onChange={e =>
                    setContact(v => ({
                      ...v,
                      hours: { ...v.hours, open: e.target.value },
                    }))
                  }
                />
                <span>~</span>
                <input
                  type='time'
                  className='px-3 py-2 rounded bg-white/5 border border-white/15'
                  value={contact.hours?.close || ''}
                  onChange={e =>
                    setContact(v => ({
                      ...v,
                      hours: { ...v.hours, close: e.target.value },
                    }))
                  }
                />
              </div>
            </div> */}

            {/* 社群 */}
            <label className='block'>
              <div className='mb-1 text-sm opacity-80'>Instagram 連結</div>
              <input
                type='url'
                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                value={contact.instagram || ''}
                onChange={e =>
                  setContact(v => ({ ...v, instagram: e.target.value }))
                }
              />
            </label>

            <label className='block'>
              <div className='mb-1 text-sm opacity-80'>Facebook 連結</div>
              <input
                type='url'
                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                value={contact.facebook || ''}
                onChange={e =>
                  setContact(v => ({ ...v, facebook: e.target.value }))
                }
              />
            </label>

            {/* 操作按鈕 */}
            <div className='flex gap-3 pt-4'>
              <button
                type='submit'
                disabled={saving}
                className={`px-4 py-2 rounded transition-all duration-100 ease-in-out ${saving
                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/20 cursor-pointer'
                  }`}
              >
                {saving ? '處理中...' : '儲存'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
