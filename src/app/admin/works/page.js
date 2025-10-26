'use client';
import React, { useEffect, useState } from 'react';

// ===== 工具 =====
async function uploadFilesToSlug(fileList, slug) {
  if (!slug) throw new Error('請先填 slug');
  const fd = new FormData();
  [...fileList].forEach(f => fd.append('files', f));
  const res = await fetch(`/api/works/upload/${encodeURIComponent(slug)}`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.files.map(f => f.url);
}

// ===== 主頁 =====
export default function AdminWorksPage() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState(null); // 當前選中的作品或新建

  // 載入作品
  async function load() {
    setLoading(true);
    const res = await fetch('/api/works', { cache: 'no-store' });
    const data = await res.json();
    data.sort((a, b) => (b.year || '').localeCompare(a.year || ''));
    setWorks(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // 建立空白表單
  const blankForm = {
    slug: '', title: '', year: '', medium: '', size: '',
    location: '', management: '', description: '', files: []
  };

  // 選取作品（現有或新增）
  function selectWork(w) {
    if (!w) setSelected({ ...blankForm, isNew: true });
    else
      setSelected({
        ...w,
        isNew: false,
        files: [],
      });
  }

  // ===== CRUD =====
  async function handleSave() {
    try {
      if (!selected.slug || !selected.title) {
        setMsg('請填 slug 與 title');
        return;
      }
      setMsg('上傳中...');

      let uploadedUrls = [];
      if (selected.files && selected.files.length > 0) {
        uploadedUrls = await uploadFilesToSlug(selected.files, selected.slug);
      }

      const payload = {
        slug: selected.slug.trim(),
        title: {
          zh: selected.title_zh || '',
          en: selected.title_en || '',
        },
        description: {
          zh: selected.description_zh || '',
          en: selected.description_en || '',
        },
        medium: {
          zh: selected.medium_zh || '',
          en: selected.medium_en || '',
        },
        location: {
          zh: selected.location_zh || '',
          en: selected.location_en || '',
        },
        management: {
          zh: selected.management_zh || '',
          en: selected.management_en || '',
        },
        size: selected.size,
        year: selected.year,
        images: uploadedUrls,
      };


      if (selected.isNew) {
        const res = await fetch('/api/works', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        setMsg('新增成功');
      } else {
        const res = await fetch(`/api/works/id/${selected.id}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        setMsg('已更新');
      }

      await load();
      setSelected(null);
    } catch (err) {
      setMsg('失敗：' + err.message);
    }
  }

  async function handleDelete() {
    if (!selected || selected.isNew) return;
    if (!confirm(`確定要刪除「${selected.title}」？`)) return;
    const res = await fetch(`/api/works/id/${selected.id}`, { method: 'DELETE' });
    if (!res.ok) setMsg('刪除失敗：' + (await res.text()));
    else {
      setMsg('已刪除');
      await load();
      setSelected(null);
    }
  }

  // ===== UI =====
  return (
    <div className='min-h-lvh pt-32 bg-neutral-950 text-white flex'>
      {/* ===== 左側清單 ===== */}
      <aside className='w-1/4 border-r border-white/15 p-4 flex flex-col'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-xl font-bold'>作品列表</h1>
          <button
            onClick={() => selectWork(null)}
            className='px-2 py-1 text-sm bg-white/10 hover:bg-white/20 rounded'
          >
            + 新增
          </button>
        </div>

        {loading ? (
          <div className='opacity-70 text-sm'>載入中...</div>
        ) : works.length === 0 ? (
          <div className='opacity-70 text-sm'>目前沒有資料</div>
        ) : (
          <ul className='space-y-1 overflow-y-auto'>
            {works.map(w => (
              <li key={w.id}>
                <button
                  onClick={() => selectWork(w)}
                  className={`w-full text-left px-3 py-2 rounded ${selected && selected.id === w.id && !selected.isNew
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                    }`}
                >
                  <div className='font-medium'>{w.title || '(未命名)'}</div>
                  <div className='text-xs opacity-70'>{w.year || '—'} · {w.slug}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ===== 右側表單 ===== */}
      <main className='flex-1 p-6 overflow-y-auto'>
        {!selected ? (
          <div className='text-white/60'>← 請選擇左側作品或新增新作品</div>
        ) : (
          <div className='space-y-6 max-w-2xl'>
            <header className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>
                {selected.isNew ? '新增作品' : `編輯：${selected.title}`}
              </h2>
              <div className='text-sm opacity-80'>{msg}</div>
            </header>

            <div className='grid grid-cols-2 gap-3'>
              {[['slug', 'Slug（必填）'], ['title', '標題（必填）'],
              ['year', '年份'], ['size', '尺寸'],
              ['medium', '媒材'], ['location', '設置地點'],
              ['management', '管理單位'],
              ].map(([k, label]) => (
                <label key={k} className='block'>
                  <div className='mb-1 text-sm opacity-80'>{label}</div>
                  <input
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                    value={selected[k]}
                    onChange={e => setSelected(v => ({ ...v, [k]: e.target.value }))}
                  />
                </label>
              ))}
            </div>

            <label className='block'>
              <div className='mb-1 text-sm opacity-80'>描述</div>
              <textarea
                rows={4}
                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                value={selected.description}
                onChange={e => setSelected(v => ({ ...v, description: e.target.value }))}
              />
            </label>

            <label className='block'>
              <div className='mb-1 text-sm opacity-80'>圖片（可多選）</div>
              <input
                type='file'
                multiple
                onChange={e => setSelected(v => ({ ...v, files: e.target.files }))}
                className='text-sm'
              />

              {/* === 預覽區 === */}
              {selected.images && selected.images.length > 0 && (
                <div className='mt-3 grid grid-cols-3 gap-3'>
                  {selected.images.map((img, idx) => (
                    <div key={idx} className='relative group'>
                      <img
                        src={img.startsWith('/') ? img : `/${img}`}
                        alt={`image-${idx}`}
                        className='w-full aspect-square object-cover rounded border border-white/10'
                      />
                      <button
                        onClick={() =>
                          setSelected(v => ({
                            ...v,
                            images: v.images.filter((_, i) => i !== idx),
                          }))
                        }
                        className='absolute top-1 right-1 cursor-pointer bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition'
                        title='刪除圖片'
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </label>


            <div className='flex gap-3 pt-4'>
              <button
                onClick={handleSave}
                className='px-4 py-2 rounded bg-white/10 hover:bg-white/20'
              >
                {selected.isNew ? '送出' : '儲存修改'}
              </button>

              {!selected.isNew && (
                <button
                  onClick={handleDelete}
                  className='px-4 py-2 rounded bg-red-600/80 hover:bg-red-600'
                >
                  刪除
                </button>
              )}

              <button
                onClick={() => setSelected(null)}
                className='px-4 py-2 rounded bg-white/10 hover:bg-white/20'
              >
                取消
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
