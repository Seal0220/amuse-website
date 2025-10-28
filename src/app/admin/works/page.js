'use client';
import React, { useEffect, useState } from 'react';

// === 上傳圖片 API ===
async function uploadFilesToSlug(fileList, slug) {
  if (!slug) throw new Error('請先填 slug');
  const fd = new FormData();
  [...fileList].forEach(f => fd.append('files', f));
  const res = await fetch(`/api/works/upload/${encodeURIComponent(slug)}`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.files.map(f => f.url);
}

export default function AdminWorksPage() {
  const [works, setWorks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('zh');
  const [saving, setSaving] = useState(false);

  // === 載入作品 ===
  async function load() {
    setLoading(true);
    const res = await fetch('/api/works', { cache: 'no-store' });
    const data = await res.json();
    setWorks(data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  // === 空白表單（新增時） ===
  const blankForm = {
    slug: '',
    type: 'public-art',
    title: { zh: '', en: '' },
    medium: { zh: '', en: '' },
    location: { zh: '', en: '' },
    management: { zh: '', en: '' },
    description: { zh: '', en: '' },
    size: { width: '', height: '', length: '' },
    year: '',
    images: [],
    files: [],
    isNew: true,
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 2010 + 1 },
    (_, i) => String(currentYear - i)
  );

  // === 選取作品（編輯） ===
  function selectWork(w) {
    setMsg('');

    if (!w) return setSelected({ ...blankForm });
    const parse = str => {
      try {
        return JSON.parse(str || '{}');
      } catch {
        return {};
      }
    };
    const parseArr = input => {
      if (!input) return [];
      if (Array.isArray(input)) return input;
      try {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    const sizeObj = (() => {
      try {
        return JSON.parse(w.size || '{}');
      } catch {
        return {};
      }
    })();

    setSelected({
      ...w,
      type: w.type || 'public-art',
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
  async function handleSave(e) {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      if (!selected.slug || !selected.title.zh) {
        setMsg('請填 slug 與中文標題');
        setSaving(false);
        return;
      }
      setMsg('上傳中...');

      let uploadedUrls = [];
      if (selected.files && selected.files.length > 0) {
        uploadedUrls = await uploadFilesToSlug(selected.files, selected.slug);
      }

      // === 組 payload ===
      const payload = {
        slug: selected.slug.trim(),
        type:
          selected.type === 'exhibition-space'
            ? 'exhibition-space'
            : 'public-art',
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
        images: uploadedUrls.length > 0
          ? [
            ...selected.images.filter(img => !img.startsWith('blob:')),
            ...uploadedUrls,
          ]
          : selected.images.filter(img => !img.startsWith('blob:')),
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
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg('失敗：' + err.message);
    } finally {
      setSaving(false);
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
      setTimeout(() => setMsg(''), 2000);
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
            <div
              onClick={() => selectWork(null)}
              className='px-2 py-1 text-sm bg-white/10 hover:bg-white/20 rounded cursor-pointer'
            >
              + 新增
            </div>
          </div>

          {loading ? (
            <div className='opacity-70 text-sm'>載入中...</div>
          ) : works.length === 0 ? (
            <div className='opacity-70 text-sm'>目前沒有資料</div>
          ) : (
            <div className='overflow-y-auto space-y-8'>
              {/* 公共藝術 */}
              <div>
                <div className='text-sm font-semibold text-white/70 mb-2 border-b border-white/15 pb-1'>
                  公共藝術（Public Art）
                </div>
                <ul className='space-y-1'>
                  {works
                    .filter(w => (w.type || 'public-art') === 'public-art')
                    .map(w => {
                      let title = '';
                      try {
                        title = JSON.parse(w.title || '{}').zh || '';
                      } catch { }
                      return (
                        <li key={w.id}>
                          <div
                            onClick={() => selectWork(w)}
                            className={`w-full text-left px-3 py-2 rounded cursor-pointer ${selected && selected.id === w.id && !selected.isNew
                              ? 'bg-white/20'
                              : 'hover:bg-white/10'
                              }`}
                          >
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>
                                {title || '(未命名)'}
                              </span>
                              <span className='text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-green-500/30'>
                                公共藝術
                              </span>
                            </div>
                            <div className='text-xs opacity-70'>
                              {w.year || '—'} · {w.slug}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>

              {/* 展示空間 */}
              <div>
                <div className='text-sm font-semibold text-white/70 mb-2 border-b border-white/15 pb-1'>
                  展示空間（Exhibition Space）
                </div>
                <ul className='space-y-1'>
                  {works
                    .filter(w => (w.type || 'public-art') === 'exhibition-space')
                    .map(w => {
                      let title = '';
                      try {
                        title = JSON.parse(w.title || '{}').zh || '';
                      } catch { }
                      return (
                        <li key={w.id}>
                          <div
                            onClick={() => selectWork(w)}
                            className={`w-full text-left px-3 py-2 rounded cursor-pointer ${selected && selected.id === w.id && !selected.isNew
                              ? 'bg-white/20'
                              : 'hover:bg-white/10'
                              }`}
                          >
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>
                                {title || '(未命名)'}
                              </span>
                              <span className='text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-orange-500/30'>
                                展示空間
                              </span>
                            </div>
                            <div className='text-xs opacity-70'>
                              {w.year || '—'} · {w.slug}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
          )}
        </aside>

        {/* 右側編輯區 */}
        <main className='flex-1 p-6 overflow-y-auto'>
          {!selected ? (
            <div className='text-white/60'>
              ← 請選擇左側作品或新增新作品
            </div>
          ) : (
            <form className='space-y-6 max-w-2xl' onSubmit={handleSave}>
              <header className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>
                  {selected.isNew ? '新增作品' : `編輯：${selected.title.zh}`}
                </h2>
                <div className='text-sm opacity-80'>{msg}</div>
              </header>

              {/* 語言切換 */}
              <div className='flex gap-2 mb-2'>
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

              {/* 類別 + 基本欄位 */}
              <div className='grid grid-cols-3 gap-3'>
                <label className='col-span-1'>
                  <div className='mb-1 text-sm opacity-80'>類別</div>
                  <select
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                    value={selected.type}
                    onChange={e =>
                      setSelected(v => ({ ...v, type: e.target.value }))
                    }
                  >
                    <option value='public-art'>公共藝術</option>
                    <option value='exhibition-space'>展示空間</option>
                  </select>
                </label>
                <label className='col-span-1'>
                  <div className='mb-1 text-sm opacity-80'>Slug（網址代稱）</div>
                  <input
                    required
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                    value={selected.slug}
                    onChange={e =>
                      setSelected(v => ({ ...v, slug: e.target.value }))
                    }
                  />
                </label>
                <label className='col-span-1'>
                  <div className='mb-1 text-sm opacity-80'>年份</div>
                  <select
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                    value={selected.year ?? ''}
                    onChange={e =>
                      setSelected(v => ({ ...v, year: e.target.value }))
                    }
                  >
                    <option value=''>—</option>
                    {yearOptions.map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* 尺寸欄位 */}
              <div className='grid grid-cols-3 gap-3'>
                {['length', 'width', 'height'].map(k => (
                  <label key={k}>
                    <div className='mb-1 text-sm opacity-80'>
                      {k === 'width'
                        ? '寬（cm）'
                        : k === 'height'
                          ? '高（cm）'
                          : '長（cm）'}
                    </div>
                    <input
                      className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                      value={selected.size?.[k] ?? ''}
                      onChange={e =>
                        setSelected(v => ({
                          ...v,
                          size: { ...v.size, [k]: e.target.value },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              {/* 多語欄位 */}
              {[
                ['title', '標題', true],
                ['medium', '媒材', false],
                ['location', '設置地點', false],
                ['management', '管理單位', false],
              ].map(([key, label, required]) => (
                <label key={key} className='block'>
                  <div className='mb-1 text-sm opacity-80'>
                    {label}（{lang === 'zh' ? '中文' : '英文'}）
                  </div>
                  <input
                    required={required}
                    type='text'
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                    value={selected[key][lang]}
                    onChange={e => updateNested(key, e.target.value)}
                  />
                </label>
              ))}

              {/* 作品描述 */}
              <label className='block'>
                <div className='mb-1 text-sm opacity-80'>
                  作品描述（{lang === 'zh' ? '中文' : '英文'}）
                </div>
                <textarea
                  rows={8}
                  className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                  value={selected.description[lang]}
                  onChange={e => updateNested('description', e.target.value)}
                />
              </label>

              {/* 圖片上傳與預覽 */}
              <div>
                <div className='flex flex-col gap-2 mb-6'>
                  <label className='mb-1 text-sm opacity-80'>
                    圖片（可多選）
                  </label>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={e => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      const tempUrls = [...files].map(f =>
                        URL.createObjectURL(f)
                      );
                      setSelected(v => ({
                        ...v,
                        files,
                        images: [...v.images, ...tempUrls],
                      }));
                    }}
                    className='text-sm p-2 border cursor-pointer rounded bg-white/5 border-white/15'
                  />
                </div>

                {selected.images?.length > 0 && (
                  <div className='mt-3 grid grid-cols-3 gap-3'>
                    {selected.images.map((img, i) => (
                      <div key={i} className='relative group'>
                        <img
                          src={img}
                          alt={`image-${i}`}
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
                          onClick={() =>
                            setSelected(v => ({
                              ...v,
                              images: v.images.filter((_, idx) => idx !== i),
                            }))
                          }
                          className='absolute top-2 right-2 bg-black/70 text-white rounded-full size-6 scale-100 hover:scale-120 cursor-pointer text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition'
                        >
                          ✕
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className='flex gap-3 pt-4'>
                <button
                  type='submit'
                  disabled={saving}
                  className={`px-4 py-2 rounded ${saving
                    ? 'bg-white/5 text-white/40 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 cursor-pointer'
                    }`}
                >
                  {saving
                    ? '處理中...'
                    : selected.isNew
                      ? '送出'
                      : '儲存修改'}
                </button>
                {!selected.isNew && (
                  <div
                    onClick={handleDelete}
                    className='px-4 py-2 rounded bg-red-600/80 hover:bg-red-600 cursor-pointer'
                  >
                    刪除
                  </div>
                )}
                <div
                  onClick={() => setSelected(null)}
                  className='px-4 py-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer'
                >
                  取消
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
