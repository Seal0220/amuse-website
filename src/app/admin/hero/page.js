'use client';
import React, { useEffect, useState } from 'react';

async function uploadHeroFiles(fileList) {
  const fd = new FormData();
  [...fileList].forEach(f => fd.append('files', f));
  const res = await fetch('/api/hero/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.files.map(f => f.url);
}

export default function AdminHeroPage() {
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/hero', { cache: 'no-store' });
      const data = await res.json();
      setImages(data.images || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e) {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      let uploaded = [];
      if (files.length > 0) {
        setMsg('上傳中...');
        uploaded = await uploadHeroFiles(files);
      }
  
      const payload = {
        images: [
          ...images.filter(img => !img.startsWith('blob:')),
          ...uploaded,
        ],
      };
  
      const res = await fetch('/api/hero', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      setImages(result.images || []);
      setMsg('封面已更新');
      setFiles([]);

      window.location.reload();
    } catch (err) {
      setMsg('失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }
  

  return (
    <div className='bg-neutral-950 text-white min-h-lvh'>
      <div className='p-8 max-w-4xl'>
        <header className='flex items-center justify-between mb-6'>
          <h1 className='text-2xl font-bold'>首頁圖片管理</h1>
          <div className='text-sm opacity-80'>{msg}</div>
        </header>

        {loading ? (
          <div className='opacity-70 text-sm'>載入中...</div>
        ) : (
          <form onSubmit={handleSave} className='space-y-6'>
            <div>
              <label className='mb-2 block text-sm opacity-80'>新增圖片（可多選）</label>
              <input
                type='file'
                multiple
                accept='image/*'
                onChange={e => {
                  const fl = [...e.target.files];
                  setFiles(fl);
                  const tmp = fl.map(f => URL.createObjectURL(f));
                  setImages(v => [...v, ...tmp]);
                }}
                className='text-sm p-2 border cursor-pointer rounded bg-white/5 border-white/15'
              />
            </div>

            {images.length > 0 && (
              <div className='grid grid-cols-3 gap-4'>
                {images.map((img, i) => (
                  <div key={i} className='relative group'>
                    <img
                      src={img}
                      alt=''
                      className='w-full aspect-square object-cover rounded border border-white/10'
                    />
                    <a
                      href={img}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-black/40 flex items-center justify-center text-xs text-white'
                    >
                      查看原圖
                    </a>
                    <div
                      onClick={() => setImages(v => v.filter((_, idx) => idx !== i))}
                      className='absolute top-2 right-2 bg-black/70 text-white rounded-full size-6 scale-100 hover:scale-120 cursor-pointer text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition'
                    >
                      ✕
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className='pt-6 flex gap-3'>
              <button
                type='submit'
                disabled={saving}
                className={`px-4 py-2 rounded transition-all duration-100 ease-in-out ${saving
                    ? 'bg-white/5 text-white/40 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 cursor-pointer'
                  }`}
              >
                {saving ? '處理中...' : '儲存修改'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
