'use client';
import React, { useEffect, useState, useRef } from 'react';
import useWindowWidth from '@/app/hooks/useWindowWidth';
import { FaAngleDown } from 'react-icons/fa6';

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
  const { isBelowSize } = useWindowWidth();

  const [works, setWorks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('zh');
  const [saving, setSaving] = useState(false);
  const [openChildIndex, setOpenChildIndex] = useState(null);

  // 行動版：上方列表是否展開
  const [listOpen, setListOpen] = useState(true);
  const listRef = useRef(null);

  // === 載入作品 ===
  async function load() {
    setLoading(true);
    const res = await fetch('/api/works?includeChildren=1', { cache: 'no-store' });
    const data = await res.json();
    setWorks(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

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
    isMultiple: false,
    children: [],
    isNew: true,
  };

  const createChildForm = () => ({
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
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 2010 + 1 },
    (_, i) => String(currentYear - i)
  );

  // === 選取作品（編輯） ===
  function selectWork(w) {
    setMsg('');

    if (!w) {
      setSelected({ ...blankForm });
      // 行動版：點「新增」後自動收合列表
      setListOpen(false);
      return;
    }

    const parse = str => {
      try { return JSON.parse(str || '{}'); } catch { return {}; }
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
      try { return JSON.parse(w.size || '{}'); } catch { return {}; }
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
      isMultiple: !!w.isMultiple,
      children: (w.children || []).map(child => {
        const childSize = (() => {
          try { return JSON.parse(child.size || '{}'); } catch { return {}; }
        })();
        return {
          ...child,
          type: child.type || 'public-art',
          title: parse(child.title),
          medium: parse(child.medium),
          location: parse(child.location),
          management: parse(child.management),
          description: parse(child.description),
          size: {
            width: childSize.width || '',
            height: childSize.height || '',
            length: childSize.length || '',
          },
          images: parseArr(child.images),
          files: [],
          isNew: false,
        };
      }),
      isNew: false,
    });

    // 行動版：選取後自動收合上方列表
    setListOpen(false);
  }

  const updateNested = (key, value) => {
    setSelected(v => ({
      ...v,
      [key]: { ...v[key], [lang]: value },
    }));
  };

  const updateChildField = (idx, key, value) => {
    setSelected(v => {
      const list = [...(v.children || [])];
      list[idx] = { ...list[idx], [key]: value };
      return { ...v, children: list };
    });
  };

  const updateChildNested = (idx, key, value) => {
    setSelected(v => {
      const list = [...(v.children || [])];
      const target = list[idx] || createChildForm();
      list[idx] = { ...target, [key]: { ...target[key], [lang]: value } };
      return { ...v, children: list };
    });
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

      const processedChildren = [];
      for (const child of selected.children || []) {
        if (!child.slug || !child.title?.zh) {
          throw new Error('子作品需要 slug 與中文標題');
        }
        let childUploads = [];
        if (child.files && child.files.length > 0) {
          childUploads = await uploadFilesToSlug(child.files, child.slug);
        }
        processedChildren.push({
          ...child,
          images:
            childUploads.length > 0
              ? [
                ...child.images.filter(img => !img.startsWith('blob:')),
                ...childUploads,
              ]
              : child.images.filter(img => !img.startsWith('blob:')),
          files: [],
        });
      }

      // === 組 payload ===
      const payload = {
        slug: selected.slug.trim(),
        type: selected.type === 'exhibition-space' ? 'exhibition-space' : 'public-art',
        isMultiple: !!selected.isMultiple,
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
        images:
          uploadedUrls.length > 0
            ? [
              ...selected.images.filter(img => !img.startsWith('blob:')),
              ...uploadedUrls,
            ]
            : selected.images.filter(img => !img.startsWith('blob:')),
        children: processedChildren,
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

  const year = new Date().getFullYear();

  // —— 群組清單（抽成一個可重用區塊：行動版／桌機共用內容）——
  const GroupedLists = ({ onPick }) => (
    <div className='space-y-12'>
      {/* 公共藝術 */}
      <div>
        {/* 公共藝術標題＋Hero 圖預覽與上傳 */}
        <div className='flex items-center justify-between mb-2 border-b border-white/15 pb-2'>
          <div className='flex items-center gap-3'>
            <img
              src='/types/public-art_hero.jpg'
              alt='公共藝術封面'
              className='size-20 object-cover rounded-full border border-white/10'
            />
            <span className='text-sm font-semibold text-white/70'>公共藝術</span>
          </div>
          <label className='text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded cursor-pointer transition'>
            更改圖片
            <input
              type='file'
              accept='image/*'
              className='hidden'
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('file', file);
                fd.append('type', 'public-art');
                await fetch('/api/works/types/hero', { method: 'POST', body: fd });
                location.reload();
              }}
            />
          </label>
        </div>

        {/* 公共藝術作品列表 */}
        <ul className='space-y-1'>
          {works
            .filter(w => (w.type || 'public-art') === 'public-art')
            .map(w => {
              let title = '';
              try { title = JSON.parse(w.title || '{}').zh || ''; } catch { }
              return (
                <li key={w.id}>
                  <button
                    type='button'
                    onClick={() => onPick(w)}
                    className={`w-full text-left px-3 py-2 rounded cursor-pointer transition
                      ${selected && selected.id === w.id && !selected.isNew ? 'bg-white/20' : 'hover:bg-white/10'}`}
                  >
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{title || '(未命名)'}</span>
                      <span className='text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-green-500/30'>
                        公共藝術
                      </span>
                    </div>
                    <div className='text-xs opacity-70'>
                      {w.year || '—'} · {w.slug}
                    </div>
                  </button>
                </li>
              );
            })}
        </ul>
      </div>

      {/* 展示空間 */}
      <div>
        {/* 展示空間標題＋Hero 圖預覽與上傳 */}
        <div className='flex items-center justify-between mb-2 border-b border-white/15 pb-2'>
          <div className='flex items-center gap-3'>
            <img
              src='/types/exhibition-space_hero.jpg'
              alt='展示空間封面'
              className='size-20 object-cover rounded-full border border-white/10'
            />
            <span className='text-sm font-semibold text-white/70'>展示空間</span>
          </div>
          <label className='text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded cursor-pointer transition'>
            更改圖片
            <input
              type='file'
              accept='image/*'
              className='hidden'
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('file', file);
                fd.append('type', 'exhibition-space');
                await fetch('/api/works/types/hero', { method: 'POST', body: fd });
                location.reload();
              }}
            />
          </label>
        </div>

        {/* 展示空間作品列表 */}
        <ul className='space-y-1'>
          {works
            .filter(w => (w.type || 'public-art') === 'exhibition-space')
            .map(w => {
              let title = '';
              try { title = JSON.parse(w.title || '{}').zh || ''; } catch { }
              return (
                <li key={w.id}>
                  <button
                    type='button'
                    onClick={() => onPick(w)}
                    className={`w-full text-left px-3 py-2 rounded cursor-pointer transition
                      ${selected && selected.id === w.id && !selected.isNew ? 'bg-white/20' : 'hover:bg-white/10'}`}
                  >
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{title || '(未命名)'}</span>
                      <span className='text-[10px] px-2 py-0.5 rounded-full border border-white/15 bg-orange-500/30'>
                        展示空間
                      </span>
                    </div>
                    <div className='text-xs opacity-70'>
                      {w.year || '—'} · {w.slug}
                    </div>
                  </button>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );

  // === 介面 ===
  return (
    <div className='bg-neutral-950 text-white'>
      <div className='md:flex md:min-h-screen min-h-dvh border-t border-white/15'>

        {/* ====== 行動版：上方可收合列表 ====== */}
        {isBelowSize('sm') ? (
          <section className='w-full border-b md:border-b-0 md:border-r border-white/15'>
            <div className='md:hidden sticky top-0 z-20 bg-neutral-950/90 backdrop-blur border-b border-white/15'>
              <div
                className='flex items-center justify-between px-4 py-3'
                onClick={() => setListOpen(o => !o)}
              >
                <h1 className='text-lg font-semibold'>作品列表</h1>
                <FaAngleDown className={`${listOpen ? 'rotate-180' : 'rotate-0'} transition`} />
                <button
                  onClick={() => selectWork(null)}
                  className='px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded transition'
                >
                  + 新增
                </button>
              </div>

              {/* 收合內容 */}
              <div
                ref={listRef}
                className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${listOpen ? 'opacity-100' : 'opacity-0'}`}
                style={{ maxHeight: listOpen ? '60lvh' : 0 }}
              >
                <div className='p-4'>
                  {loading ? (
                    <div className='opacity-70 text-sm'>載入中...</div>
                  ) : works.length === 0 ? (
                    <div className='opacity-70 text-sm'>目前沒有資料</div>
                  ) : (
                    <div className='overflow-y-auto max-h-[56lvh] pr-1'>
                      <GroupedLists onPick={selectWork} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          // ====== 桌機版：左側固定清單 ======
          <aside className='hidden md:flex md:flex-col md:w-90 md:h-auto border-r border-white/15 gap-6'>
            <div className='flex flex-row justify-between border-b border-neutral-800'>
              <div className='p-4 text-xl font-semibold tracking-wide'>
                作品列表
              </div>
              <div className='p-4'>
                <button
                  onClick={() => selectWork(null)}
                  className='px-2 py-1 text-sm bg-white/10 hover:bg-white/20 rounded cursor-pointer transition'
                >
                  + 新增
                </button>
              </div>
            </div>
            <div className='flex-1 overflow-y-auto px-4 pb-4'>
              {loading ? (
                <div className='opacity-70 text-sm'>載入中...</div>
              ) : works.length === 0 ? (
                <div className='opacity-70 text-sm'>目前沒有資料</div>
              ) : (
                <GroupedLists onPick={selectWork} />
              )}
            </div>
          </aside>
        )}

        {/* ====== 主要編輯區（行動版：在下方；桌機：在右側） ====== */}
        <main className='flex-1 p-6 overflow-y-auto'>
          {!selected ? (
            <div className='text-white/60'>
              {isBelowSize('sm') ? '↑ 請在上方「作品列表」選擇作品或點「新增」' : '← 請選擇左側作品或新增新作品'}
            </div>
          ) : (
            <form className='space-y-6 max-w-2xl mx-auto md:mx-0' onSubmit={handleSave}>
              <header className='flex items-center justify-between'>
                <h2 className='text-lg md:text-xl font-semibold'>
                  {selected.isNew ? '新增作品' : `編輯：${selected.title.zh}`}
                </h2>
                <div className='text-xs md:text-sm opacity-80'>{msg}</div>
              </header>

              {/* 語言切換 */}
              <div className='flex gap-2 mb-2'>
                {['zh', 'en'].map(l => (
                  <button
                    type='button'
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-4 py-1 rounded-full text-sm border cursor-pointer transition
                      ${lang === l ? 'bg-white text-black border-white' : 'border-white/20 text-white/60 hover:text-white'}`}
                  >
                    {l === 'zh' ? '中文' : '英文'}
                  </button>
                ))}
              </div>

              {/* 類別 + 基本欄位 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                <label className='col-span-1'>
                  <div className='mb-1 text-sm opacity-80'>類別</div>
                  <select
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15 cursor-pointer'
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
                    required
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                    value={selected.slug}
                    onChange={e => setSelected(v => ({ ...v, slug: e.target.value }))}
                  />
                </label>
                <label className='col-span-1'>
                  <div className='mb-1 text-sm opacity-80'>年份</div>
                  <select
                    className='w-full px-3 py-2 rounded bg-white/5 border border-white/15 cursor-pointer'
                    value={selected.year ?? ''}
                    onChange={e => setSelected(v => ({ ...v, year: e.target.value }))}
                  >
                    <option value=''>—</option>
                    {yearOptions.map(y => (<option key={y} value={y}>{y}</option>))}
                  </select>
                </label>
              </div>

              {/* 尺寸欄位 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                {['length', 'width', 'height'].map(k => (
                  <label key={k}>
                    <div className='mb-1 text-sm opacity-80'>
                      {k === 'width' ? '寬（cm）' : k === 'height' ? '高（cm）' : '長（cm）'}
                    </div>
                    <input
                      className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                      value={selected.size?.[k] ?? ''}
                      onChange={e => setSelected(v => ({ ...v, size: { ...v.size, [k]: e.target.value } }))}
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
                <div className='mb-1 text-sm opacity-80'>作品描述（{lang === 'zh' ? '中文' : '英文'}）</div>
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
                  <label className='mb-1 text-sm opacity-80'>圖片（可多選）</label>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={e => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      const tempUrls = [...files].map(f => URL.createObjectURL(f));
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
                  <div className='mt-3 grid grid-cols-2 md:grid-cols-3 gap-3'>
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
                        <button
                          type='button'
                          onClick={() =>
                            setSelected(v => ({
                              ...v,
                              images: v.images.filter((_, idx) => idx !== i),
                            }))
                          }
                          className='absolute top-2 right-2 bg-black/70 text-white rounded-full size-6 scale-100 hover:scale-110 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition'
                          aria-label='刪除圖片'
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              <div className='h-px w-full bg-white/50' />
              {/* 包含子作品切換 */}
              <div className='flex flex-wrap items-center gap-3'>
                <button
                  type='button'
                  onClick={() =>
                    setSelected(v => ({ ...v, isMultiple: !v.isMultiple }))
                  }
                  className={`px-4 py-1 rounded-full text-sm border select-none cursor-pointer transition
                        ${selected.isMultiple
                      ? 'bg-white text-black border-white'
                      : 'border-white/20 text-white/60 hover:text-white'
                    }`}
                >
                  包含子作品
                </button>

                <span className='text-xs text-white/60 select-none'>
                  勾選後可在下方新增子作品，前台僅顯示父作品。
                </span>
              </div>

              {selected.isMultiple && (
                <div className='border border-white/10 rounded p-4 space-y-4 bg-white/5'>
                  <div className='flex items-center justify-between'>
                    <div className='font-semibold'>子作品管理</div>
                    <button
                      type='button'
                      onClick={() => {
                        setSelected(v => ({
                          ...v,
                          children: [...(v.children || []), createChildForm()],
                        }));
                        setOpenChildIndex((selected?.children?.length ?? 0));
                      }}
                      className='px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20 cursor-pointer transition select-none'
                    >
                      + 新增子作品
                    </button>
                  </div>
                  {(selected.children || []).length === 0 && (
                    <div className='text-sm text-white/60'>目前沒有子作品，點右上方按鈕新增。</div>
                  )}

                  {(selected.children || []).map((child, idx) => {
                    const isOpen = openChildIndex === idx;
                    const subTitle = child.title?.[lang] || '(未命名)';

                    return (
                      <div
                        key={child.id || idx}
                        className='border border-white/10 rounded-lg p-3 bg-black/30'
                      >
                        {/* Header：顯示名稱＋狀態＋收合箭頭 */}
                        <div className='relative flex items-center justify-between gap-2'>
                          <FaAngleDown className={`absolute left-1/2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                          <button
                            type='button'
                            onClick={() =>
                              setOpenChildIndex(prev => (prev === idx ? null : idx))
                            }
                            className='flex-1 flex items-center gap-2 text-left group cursor-pointer'
                          >
                            <div className='font-semibold'>
                              <span className='text-xs text-neutral-400 mr-2'>
                                子作品 {idx + 1}:
                              </span>
                              <span className='text-sm'>
                                {subTitle}
                              </span>
                            </div>
                          </button>

                          <div className='flex items-center gap-2'>
                            <span className='text-xs opacity-70 select-none'>
                              {child.isNew ? '未儲存' : '已建立'}
                            </span>
                            <button
                              type='button'
                              onClick={() => {
                                const ok = window.confirm(`確定要移除 子作品 ${idx + 1}: 「${subTitle}」嗎？`);
                                if (!ok) return;

                                // 先更新 children
                                setSelected(v => ({
                                  ...v,
                                  children: (v.children || []).filter((_, i) => i !== idx),
                                }));

                                // 再調整目前展開 index
                                setOpenChildIndex(prev => {
                                  if (prev == null) return prev;
                                  if (prev === idx) return null;
                                  if (prev > idx) return prev - 1;
                                  return prev;
                                });
                              }}
                              className='px-2 py-1 text-xs bg-red-600/80 hover:bg-red-600 rounded cursor-pointer select-none'
                            >
                              移除
                            </button>

                          </div>
                        </div>

                        {/* Body：可收合內容 */}
                        <div
                          className={`space-y-3 transition-[max-height,opacity] duration-300 ease-out 
                              ${isOpen ? 'mt-3 max-h-[1200px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}
                        >
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                            <label className='col-span-1'>
                              <div className='mb-1 text-sm opacity-80'>類別</div>
                              <select
                                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15 cursor-pointer'
                                value={child.type}
                                onChange={e => updateChildField(idx, 'type', e.target.value)}
                              >
                                <option value='public-art'>公共藝術</option>
                                <option value='exhibition-space'>展示空間</option>
                              </select>
                            </label>
                            <label className='col-span-1'>
                              <div className='mb-1 text-sm opacity-80'>Slug</div>
                              <input
                                required
                                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                                value={child.slug}
                                onChange={e => updateChildField(idx, 'slug', e.target.value)}
                              />
                            </label>
                            <label className='col-span-1'>
                              <div className='mb-1 text-sm opacity-80'>年份</div>
                              <select
                                required
                                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15 cursor-pointer'
                                value={child.year ?? ''}
                                onChange={e => updateChildField(idx, 'year', e.target.value)}
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

                          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
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
                                  value={child.size?.[k] ?? ''}
                                  onChange={e =>
                                    updateChildField(idx, 'size', {
                                      ...child.size,
                                      [k]: e.target.value,
                                    })
                                  }
                                />
                              </label>
                            ))}
                          </div>

                          {[['title', '標題', true], ['medium', '媒材', false], ['location', '設置地點', false], ['management', '管理單位', false]].map(
                            ([key, label, required]) => (
                              <label key={key} className='block'>
                                <div className='mb-1 text-sm opacity-80'>
                                  {label}（{lang === 'zh' ? '中文' : '英文'}）
                                </div>
                                <input
                                  required={required}
                                  type='text'
                                  className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                                  value={child[key]?.[lang] ?? ''}
                                  onChange={e =>
                                    updateChildNested(idx, key, e.target.value)
                                  }
                                />
                              </label>
                            ),
                          )}

                          <label className='block'>
                            <div className='mb-1 text-sm opacity-80'>
                              作品描述（{lang === 'zh' ? '中文' : '英文'}）
                            </div>
                            <textarea
                              rows={4}
                              className='w-full px-3 py-2 rounded bg-white/5 border border-white/15'
                              value={child.description?.[lang] ?? ''}
                              onChange={e =>
                                updateChildNested(idx, 'description', e.target.value)
                              }
                            />
                          </label>

                          <div>
                            <div className='flex flex-col gap-2 mb-2'>
                              <label className='mb-1 text-sm opacity-80'>子作品圖片</label>
                              <input
                                type='file'
                                multiple
                                accept='image/*'
                                onChange={e => {
                                  const files = e.target.files;
                                  if (!files || files.length === 0) return;
                                  const tempUrls = [...files].map(f =>
                                    URL.createObjectURL(f),
                                  );
                                  updateChildField(idx, 'files', files);
                                  updateChildField(idx, 'images', [
                                    ...(child.images || []),
                                    ...tempUrls,
                                  ]);
                                }}
                                className='text-sm p-2 border cursor-pointer rounded bg-white/5 border-white/15'
                              />
                            </div>

                            {child.images?.length > 0 && (
                              <div className='mt-2 grid grid-cols-2 md:grid-cols-3 gap-3'>
                                {child.images.map((img, i) => (
                                  <div key={i} className='relative group'>
                                    <img
                                      src={img}
                                      alt={`child-${idx}-image-${i}`}
                                      className='w-full aspect-square object-cover rounded border border-white/10'
                                    />
                                    <button
                                      type='button'
                                      onClick={() =>
                                        updateChildField(
                                          idx,
                                          'images',
                                          (child.images || []).filter(
                                            (_, ii) => ii !== i,
                                          ),
                                        )
                                      }
                                      className='absolute top-2 right-2 bg-black/70 text-white rounded-full size-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition'
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              )}

              <div className='h-px w-full bg-white/50' />

              {/* 操作按鈕 */}
              <div className='flex flex-wrap gap-3 pt-4'>
                <button
                  type='submit'
                  disabled={saving}
                  className={`px-4 py-2 rounded transition
                    ${saving ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 cursor-pointer'}`}
                >
                  {saving ? '處理中...' : selected.isNew ? '送出' : '儲存修改'}
                </button>

                {!selected.isNew && (
                  <button
                    type='button'
                    onClick={handleDelete}
                    className='px-4 py-2 rounded bg-red-600/80 hover:bg-red-600 transition'
                  >
                    刪除
                  </button>
                )}

                <button
                  type='button'
                  onClick={() => setSelected(null)}
                  className='px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition'
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div >
  );
}
