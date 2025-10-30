'use client';
import React, { useEffect, useState, useRef } from 'react';
import useWindowWidth from '@/app/hooks/useWindowWidth';
import { FaAngleDown } from "react-icons/fa6";


// === 上傳頭像 API ===
async function uploadMemberImage(file, id) {
  if (!id && id !== 0) throw new Error('缺少成員 id');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`/api/members/upload/${id}`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.url;
}

export default function AdminMembersPage() {
  const { isBelowSize } = useWindowWidth();
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState('zh');

  // 行動版：上方列表是否展開
  const [listOpen, setListOpen] = useState(true);
  const listRef = useRef(null);

  // === 載入成員 ===
  async function load() {
    setLoading(true);
    const res = await fetch('/api/members', { cache: 'no-store' });
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // === 空白表單 ===
  const blankForm = {
    name: { zh: '', en: '' },
    education: { zh: '', en: '' },
    specialty: { zh: '', en: '' },
    image: '',
    file: null,
    isNew: true,
  };

  // === 選取成員 ===
  function selectMember(m) {
    setMsg('');
    if (!m) {
      setSelected({ ...blankForm });
      // 行動版：點「新增」後自動收合列表
      setListOpen(false);
      return;
    }

    const parse = str => {
      try { return JSON.parse(str || '{}'); } catch { return {}; }
    };

    setSelected({
      ...m,
      name: parse(m.name),
      education: parse(m.education),
      specialty: parse(m.specialty),
      file: null,
      isNew: false,
    });

    // 行動版：選取後自動收合上方列表
    setListOpen(false);
  }

  // === 更新多語欄位 ===
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
      if (!selected.name.zh) {
        setMsg('請至少填寫中文姓名');
        setSaving(false);
        return;
      }

      let imageUrl = selected.image;
      if (selected.file) {
        setMsg('上傳中...');
        imageUrl = await uploadMemberImage(selected.file, selected.name.en || selected.name.zh);
      }

      const payload = {
        name: selected.name,
        education: selected.education,
        specialty: selected.specialty,
        image: imageUrl,
        order_index: selected.order_index ?? 0,
      };

      const res = await fetch(
        selected.isNew ? '/api/members' : `/api/members/id/${selected.id}`,
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
    if (!confirm(`確定要刪除「${selected.name.zh}」？`)) return;
    const res = await fetch(`/api/members/id/${selected.id}`, { method: 'DELETE' });
    if (!res.ok) setMsg('刪除失敗');
    else {
      setMsg('已刪除');
      await load();
      setSelected(null);
      setTimeout(() => setMsg(''), 2000);
    }
  }

  const year = new Date().getFullYear();

  return (
    <div className='bg-neutral-950 text-white'>
      <div className='min-h-dvh border-t border-white/15 md:flex md:min-h-screen'>


        {isBelowSize('sm') ? (
          <section className='w-full md:w-90 border-b md:border-b-0 md:border-r border-white/15'>
            <div className='md:hidden sticky top-0 z-20 bg-neutral-950/90 backdrop-blur border-b border-white/15'>
              <div
                className='flex items-center justify-between px-4 py-3'
                onClick={() => setListOpen(o => !o)}
              >
                <h1 className='text-lg font-semibold'>成員列表</h1>
                <FaAngleDown className={`${listOpen ? 'rotate-180' : 'rotate-0'} transition`} />
                <button
                  onClick={() => selectMember(null)}
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
                  ) : members.length === 0 ? (
                    <div className='opacity-70 text-sm'>目前沒有資料</div>
                  ) : (
                    <ul className='space-y-2 overflow-y-auto max-h-[56lvh]'>
                      {members
                        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                        .map((m) => {
                          let nameZh = '', specZh = '';
                          try { nameZh = JSON.parse(m.name || '{}').zh || ''; } catch { }
                          try { specZh = JSON.parse(m.specialty || '{}').zh || ''; } catch { }
                          return (
                            <li key={m.id}>
                              <button
                                type='button'
                                onClick={() => selectMember(m)}
                                className={`w-full text-left px-3 py-2 rounded cursor-pointer transition ${selected && selected.id === m.id && !selected.isNew ? 'bg-white/20' : 'hover:bg-white/10'}`}
                              >
                                <div className='flex items-center gap-3'>
                                  {m.image && (
                                    <img
                                      src={m.image}
                                      alt=''
                                      className='w-8 h-8 rounded-full object-cover border border-white/20'
                                    />
                                  )}
                                  <div>
                                    <div className='font-medium'>{nameZh}</div>
                                    <div className='text-xs opacity-70'>{specZh || '—'}</div>
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <aside className='hidden md:flex md:flex-col md:w-90 md:h-screen border-r border-white/15'>
            <div className='p-4 text-xl font-semibold border-b border-neutral-800 tracking-wide'>
              成員列表
            </div>
            <div className='p-4'>
              <button
                onClick={() => selectMember(null)}
                className='px-2 py-1 text-sm bg-white/10 hover:bg-white/20 rounded cursor-pointer transition'
              >
                + 新增
              </button>
            </div>
            <div className='flex-1 overflow-y-auto px-4 pb-4'>
              {loading ? (
                <div className='opacity-70 text-sm'>載入中...</div>
              ) : members.length === 0 ? (
                <div className='opacity-70 text-sm'>目前沒有資料</div>
              ) : (
                <ul className='space-y-2'>
                  {members
                    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                    .map((m) => {
                      let nameZh = '', specZh = '';
                      try { nameZh = JSON.parse(m.name || '{}').zh || ''; } catch { }
                      try { specZh = JSON.parse(m.specialty || '{}').zh || ''; } catch { }
                      return (
                        <li key={m.id}>
                          <button
                            type='button'
                            onClick={() => selectMember(m)}
                            className={`w-full text-left px-3 py-2 rounded cursor-pointer transition ${selected && selected.id === m.id && !selected.isNew ? 'bg-white/20' : 'hover:bg-white/10'}`}
                          >
                            <div className='flex items-center gap-3'>
                              {m.image && (
                                <img
                                  src={m.image}
                                  alt=''
                                  className='w-8 h-8 rounded-full object-cover border border-white/20'
                                />
                              )}
                              <div>
                                <div className='font-medium'>{nameZh}</div>
                                <div className='text-xs opacity-70'>{specZh || '—'}</div>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
            <footer className='p-3 text-xs text-neutral-500 border-t border-neutral-800'>
              © {year} Admin Dashboard
            </footer>
          </aside>
        )}


        {/* 主要編輯區（行動版：在下方；桌機：在右側） */}
        <main className='flex-1 p-6 overflow-y-auto'>
          {!selected ? (
            <div className='text-white/60'>
              {isBelowSize('sm') ? '↑ 請在上方「作品列表」選擇作品或點「新增」' : '← 請選擇左側作品或新增新作品'}
            </div>
          ) : (
            <form className='space-y-6 max-w-2xl mx-auto md:mx-0' onSubmit={handleSave}>
              <header className='flex items-center justify-between gap-4'>
                <h2 className='text-lg md:text-xl font-semibold'>
                  {selected.isNew ? '新增成員' : `編輯：${selected.name.zh}`}
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
                    className={`px-4 py-1 rounded-full text-sm border transition 
                      ${lang === l ? 'bg-white text-black border-white' : 'border-white/20 text-white/60 hover:text-white'}
                    `}
                  >
                    {l === 'zh' ? '中文' : '英文'}
                  </button>
                ))}
              </div>

              {/* 多語欄位 */}
              {[
                ['name', '姓名', true],
                ['education', '學歷', true],
                ['specialty', '專長', true],
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

              <label className='block'>
                <div className='mb-1 text-sm opacity-80'>顯示順序</div>
                <input
                  type='number'
                  className='w-24 px-3 py-2 rounded bg-white/5 border border-white/15'
                  value={selected.order_index ?? 0}
                  onChange={(e) =>
                    setSelected((v) => ({ ...v, order_index: Number(e.target.value) }))
                  }
                />
              </label>

              {/* 頭像上傳 */}
              <div>
                <div className='mb-2 text-sm opacity-80'>照片</div>
                <input
                  type='file'
                  accept='image/*'
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const tempUrl = URL.createObjectURL(file);
                      setSelected(v => ({
                        ...v,
                        file,
                        image: tempUrl,
                      }));
                    }
                  }}
                  className='text-sm p-2 border cursor-pointer rounded bg-white/5 border-white/15'
                />
                {selected.image && (
                  <div className='mt-4 w-40 h-40 rounded-full overflow-hidden border border-white/20'>
                    <img
                      src={selected.image}
                      alt='預覽'
                      className='w-full h-full object-cover'
                    />
                  </div>
                )}
              </div>

              {/* 操作按鈕 */}
              <div className='flex flex-wrap gap-3 pt-2'>
                <button
                  type='submit'
                  disabled={saving}
                  className={`px-4 py-2 rounded transition ${saving
                    ? 'bg-white/5 text-white/40 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 cursor-pointer'
                    }`}
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
    </div>
  );
}
