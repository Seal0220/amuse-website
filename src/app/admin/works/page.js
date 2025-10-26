'use client';
import React, { useEffect, useState } from 'react';

// === 上傳圖片 API ===
async function uploadFilesToSlug(fileList, slug) {
  if (!slug) throw new Error('請先填 slug');
  const fd = new FormData();
  [...fileList].forEach(f => fd.append('files', f));
  const res = await fetch(`/api/works/upload/${encodeURIComponent(slug)}`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.files.map(f => f.url);
}

export default function AdminWorksPage() {
  const [works, setWorks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('zh'); // 當前語言狀態

  // === 載入作品 ===
  async function load() {
    setLoading(true);
    const res = await fetch('/api/works', { cache: 'no-store' });
    const data = await res.json();
    setWorks(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // === 空白表單（新增時） ===
  const blankForm = {
    slug: '',
    type: 'public-art', // ← 新增類別欄位（預設 public-art）
    title: { zh: '', en: '' },
    medium: { zh: '', en: '' },
    location: { zh: '', en: '' },
    management: { zh: '', en: '' },
    description: { zh: '', en: '' },
    size: { width: '', height: '', length: '' },
    year: '',
    images: [],
    files: [],
    isNew: true
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 2010 + 1 },
    (_, i) => String(currentYear - i)
  );

  // === 選取作品（編輯） ===
  function selectWork(w) {
    if (!w) return setSelected({ ...blankForm });
    const parse = (str) => { try { return JSON.parse(str || '{}'); } catch { return {}; } };
    const parseArr = (str) => { try { return JSON.parse(str || '[]'); } catch { return []; } };
    const sizeObj = (() => { try { return JSON.parse(w.size || '{}'); } catch { return {}; } })();
    setSelected({
      ...w,
      type: w.type || 'public-art', // ← 帶入既有資料的類別，預設 public-art
      title: parse(w.title),
      medium: parse(w.medium),
      location: parse(w.location),
      management: parse(w.management),
      description: parse(w.description),
      size: {
        width: sizeObj.width || '',
        height: sizeObj.height || '',
        length: sizeObj.length || '',
      },
      images: parseArr(w.images),
      files: [],
      isNew: false,
    });
  }

  const updateNested = (key, value) => {
    setSelected(v => ({
      ...v,
      [key]: { ...v[key], [lang]: value },
    }));
  };

  // === 儲存 ===
  async function handleSave() {
    try {
      if (!selected.slug || !selected.title.zh) {
        setMsg('請填 slug 與中文標題');
        return;
      }
      setMsg('上傳中...');

      let uploadedUrls = [];
      if (selected.files && selected.files.length > 0) {
        uploadedUrls = await uploadFilesToSlug(selected.files, selected.slug);
      }

      // 組 payload（加入 type 與 size JSON）
      const payload = {
        slug: selected.slug.trim(),
        type: selected.type === 'exhibition-space' ? 'exhibition-space' : 'public-art',
        title: selected.title,
        medium: selected.medium,
        location: selected.location,
        management: selected.management,
        description: selected.description,
        size: {
          width: selected.size?.width ?? '',
          height: selected.size?.height ?? '',
          length: selected.size?.length ?? '',
        },
        year: selected.year,
        images: uploadedUrls.length > 0 ? uploadedUrls : selected.images,
      };

      const res = await fetch(
        selected.isNew ? '/api/works' : `/api/works/id/${selected.id}`,
        {
          method: selected.isNew ? 'POST' : 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      setMsg(selected.isNew ? '新增成功' : '已更新');
      await load();
      setSelected(null);
    } catch (err) {
      setMsg('失敗：' + err.message);
    }
  }

  // === 刪除 ===
  async function handleDelete() {
    if (!selected || selected.isNew) return;
    if (!confirm(`確定要刪除「${selected.title.zh}」？`)) return;
    const res = await fetch(`/api/works/id/${selected.id}`, { method: 'DELETE' });
    if (!res.ok) setMsg('刪除失敗');
    else {
      setMsg('已刪除');
      await load();
      setSelected(null);
    }
  }

  // === 介面 ===
  return (
    <div className='min-h-lvh pt-32 bg-neutral-950 text-white'>
      <div className='flex min-h-lvh border-t border-white/15'>
        {/* 左側清單 */}
        <aside className='w-1/4 border-r border-white/15 p-4 flex flex-col'>
          <div className='flex items-center justify-between mb-4'>
            <h1 className='text-xl font-bold'>作品列表</h1>
            <button
              onClick={() => selectWork(null)}
              className='px-2 py-1 text-sm bg-white/10 hover:bg-white/20 rounded cursor-pointer'
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
              {works.map(w => {
                let title = '';
                try { title = JSON.parse(w.title || '{}').zh || ''; } catch { }
                const badge = w.type || 'public-art';
                return (
                  <li key={w.id}>
                    <button
                      onClick={() => selectWork(w)}
                      className={`w-full text-left px-3 py-2 rounded cursor-pointer ${selected && selected.id === w.id && !selected.isNew
                        ? 'bg-white/20'
                        : 'hover:bg-white/10'
                        }`}
                    >
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{title || '(未命名)'}</span>
                        <span className='text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15 uppercase'>
                          {badge}
                        </span>
                      </div>
                      <div className='text-xs opacity-70'>{w.year || '—'} · {w.slug}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* 右側編輯區 */}
        <main className='flex-1 p-6 overflow-y-auto'>
          {!selected ? (
            <div className='text-white/60'>← 請選擇左側作品或新增新作品</div>
          ) : (
            <div className='space-y-6 max-w-2xl'>
              <header className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>
                  {selected.isNew ? '新增作品' : `編輯：${selected.title.zh}`}
                </h2>
                <div className='text-sm opacity-80'>{msg}</div>
              </header>

              {/* 語言切換 pill */}
              <div className='flex gap-2 mb-2'>
                {['zh', 'en'].map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-4 py-1 rounded-full text-sm border cursor-pointer ${lang === l
                      ? 'bg-white text-black border-white'
                      : 'border-white/20 text-white/60 hover:text-white'
                      }`}
                  >
                    {l === 'zh' ? '中文' : '英文'}
                  </button>
                ))}
              </div>

              {/* 類別 + 基本欄位 */}
              <div className='grid grid-cols-3 gap-3'>
                <label className='col-span-1'>
                  <div className='mb-1 text-sm opacity-80'>類別</div>
                  <select
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                    value={selected.type}
                    onChange={e => setSelected(v => ({ ...v, type: e.target.value }))}
                  >
                    <option value='public-art'>公共藝術</option>
                    <option value='exhibition-space'>展示空間</option>
                  </select>
                </label>
                <label className='col-span-1'>
                  <div className='mb-1 text-sm opacity-80'>Slug（網址代稱）</div>
                  <input
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                    value={selected.slug}
                    onChange={e => setSelected(v => ({ ...v, slug: e.target.value }))}
                  />
                </label>
                <label className='col-span-1'>
                  <div className='mb-1 text-sm opacity-80'>年份</div>
                  <select
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                    value={selected.year ?? ''}
                    onChange={e => setSelected(v => ({ ...v, year: e.target.value }))}
                  >
                    <option value=''>—</option>
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </label>

              </div>

              {/* 尺寸欄位 */}
              <div className='grid grid-cols-3 gap-3'>
                {['length', 'width', 'height'].map((k, i) => (
                  <label key={i}>
                    <div className='mb-1 text-sm opacity-80'>
                      {k === 'width' ? '寬（cm）' : k === 'height' ? '高（cm）' : '長（cm）'}
                    </div>
                    <input
                      className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                      value={selected.size?.[k] ?? ''}
                      onChange={e =>
                        setSelected(v => ({
                          ...v,
                          size: { ...v.size, [k]: e.target.value }
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              {/* 當前語言欄位：標題、媒材、設置地點、管理單位 */}
              {[
                ['title', '標題'],
                ['medium', '媒材'],
                ['location', '設置地點'],
                ['management', '管理單位'],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <div className="mb-1 text-sm opacity-80">
                    {label}（{lang === 'zh' ? '中文' : '英文'}）
                  </div>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded bg-white/5 border border-white/15"
                    value={selected[key][lang]}
                    onChange={e => updateNested(key, e.target.value)}
                  />
                </label>
              ))}

              {/* 作品描述 */}
              <label className="block">
                <div className="mb-1 text-sm opacity-80">
                  作品描述（{lang === 'zh' ? '中文' : '英文'}）
                </div>
                <textarea
                  rows={8}
                  className="w-full px-3 py-2 rounded bg-white/5 border border-white/15"
                  value={selected.description[lang]}
                  onChange={e => updateNested('description', e.target.value)}
                />
              </label>

              {/* 圖片上傳 */}
              <label>
                <div className='mb-1 text-sm opacity-80'>圖片（可多選）</div>
                <input
                  type='file'
                  multiple
                  onChange={e => setSelected(v => ({ ...v, files: e.target.files }))}
                  className='text-sm'
                />
                {selected.images && selected.images.length > 0 && (
                  <div className='mt-3 grid grid-cols-3 gap-3'>
                    {selected.images.map((img, i) => (
                      <div key={i} className='relative group'>
                        <img src={img} alt='' className='w-full aspect-square object-cover rounded border border-white/10' />
                        <button
                          onClick={() =>
                            setSelected(v => ({ ...v, images: v.images.filter((_, idx) => idx !== i) }))
                          }
                          className='absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition'
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </label>

              {/* 操作按鈕 */}
              <div className='flex gap-3 pt-4 '>
                <button onClick={handleSave} className='px-4 py-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer'>
                  {selected.isNew ? '送出' : '儲存修改'}
                </button>
                {!selected.isNew && (
                  <button onClick={handleDelete} className='px-4 py-2 rounded bg-red-600/80 hover:bg-red-600 cursor-pointer'>
                    刪除
                  </button>
                )}
                <button onClick={() => setSelected(null)} className='px-4 py-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer'>
                  取消
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
