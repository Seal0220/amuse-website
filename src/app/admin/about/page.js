'use client';

import React, { useEffect, useMemo, useState } from 'react';

const LANG_OPTIONS = [
  { key: 'zh', label: '中文' },
  { key: 'en', label: '英文' },
];

const createEmptyState = () => ({
  headline: { zh: '', en: '' },
  paragraphs: { zh: [''], en: [''] },
});

export default function AdminAboutPage() {
  const [about, setAbout] = useState(createEmptyState());
  const [lang, setLang] = useState('zh');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const activeParagraphs = useMemo(() => {
    const list = about.paragraphs?.[lang];
    if (!Array.isArray(list) || list.length === 0) return [''];
    return list;
  }, [about.paragraphs, lang]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/about', { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const sanitize = list => {
          if (!Array.isArray(list)) return [];
          return list.reduce((acc, item) => {
            if (typeof item !== 'string') return acc;
            if (item.trim() === '') return acc;
            acc.push(item);
            return acc;
          }, []);
        };

        const zhParagraphs = sanitize(data?.paragraphs?.zh);
        const enParagraphs = sanitize(data?.paragraphs?.en);

        setAbout({
          headline: {
            zh: data?.headline?.zh ?? '',
            en: data?.headline?.en ?? '',
          },
          paragraphs: {
            zh: zhParagraphs.length > 0 ? zhParagraphs : [''],
            en: enParagraphs.length > 0 ? enParagraphs : [''],
          },
        });
      } catch (err) {
        console.error('Failed to load about info:', err);
        setAbout(createEmptyState());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateParagraph(index, value) {
    setAbout(prev => {
      const current = Array.isArray(prev.paragraphs?.[lang]) ? [...prev.paragraphs[lang]] : [];
      current[index] = value;
      return {
        ...prev,
        paragraphs: { ...prev.paragraphs, [lang]: current },
      };
    });
  }

  function addParagraph() {
    setAbout(prev => {
      const current = Array.isArray(prev.paragraphs?.[lang]) ? [...prev.paragraphs[lang]] : [];
      current.push('');
      return {
        ...prev,
        paragraphs: { ...prev.paragraphs, [lang]: current },
      };
    });
  }

  function removeParagraph(index) {
    setAbout(prev => {
      const current = Array.isArray(prev.paragraphs?.[lang]) ? [...prev.paragraphs[lang]] : [];
      current.splice(index, 1);
      if (current.length === 0) current.push('');
      return {
        ...prev,
        paragraphs: { ...prev.paragraphs, [lang]: current },
      };
    });
  }

  async function handleSave(e) {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    setMsg('');
    try {
      const sanitize = list => {
        if (!Array.isArray(list)) return [];
        return list.reduce((acc, item) => {
          if (typeof item !== 'string') return acc;
          const text = item.trim();
          if (text === '') return acc;
          acc.push(item);
          return acc;
        }, []);
      };

      const zhParagraphs = sanitize(about.paragraphs?.zh);
      const enParagraphs = sanitize(about.paragraphs?.en);

      const payload = {
        headline: about.headline,
        paragraphs: {
          zh: zhParagraphs,
          en: enParagraphs,
        },
      };

      const res = await fetch('/api/about', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setAbout(prev => ({
        headline: { ...prev.headline },
        paragraphs: {
          zh: zhParagraphs.length > 0 ? zhParagraphs : [''],
          en: enParagraphs.length > 0 ? enParagraphs : [''],
        },
      }));
      setMsg('已儲存');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      console.error('Failed to save about info:', err);
      setMsg('儲存失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className='bg-neutral-950 text-white p-8 opacity-70'>載入中...</div>;
  }

  return (
    <div className='bg-neutral-950 text-white min-h-lvh'>
      <div className='flex min-h-lvh border-t border-white/15'>
        <main className='flex-1 p-8 overflow-y-auto max-w-3xl'>
          <header className='flex items-center justify-between mb-8'>
            <h1 className='text-2xl font-bold'>關於我們</h1>
            <div className='text-sm opacity-80'>{msg}</div>
          </header>

          <div className='flex gap-2 mb-6'>
            {LANG_OPTIONS.map(option => (
              <button
                key={option.key}
                type='button'
                onClick={() => setLang(option.key)}
                className={`px-4 py-1 rounded-full text-sm border transition-colors cursor-pointer ${
                  lang === option.key
                    ? 'bg-white text-black border-white'
                    : 'border-white/20 text-white/60 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className='space-y-8'>
            <div>
              <label className='block mb-2 text-sm opacity-80'>標題（{lang === 'zh' ? '中文' : '英文'}）</label>
              <input
                type='text'
                className='w-full px-3 py-2 rounded bg-white/5 border border-white/15 text-white'
                value={about.headline?.[lang] ?? ''}
                onChange={e =>
                  setAbout(prev => ({
                    ...prev,
                    headline: { ...prev.headline, [lang]: e.target.value },
                  }))
                }
              />
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <label className='text-sm opacity-80'>內文段落（{lang === 'zh' ? '中文' : '英文'}）</label>
                <button
                  type='button'
                  onClick={addParagraph}
                  className='px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-sm transition'
                >
                  新增段落
                </button>
              </div>

              {activeParagraphs.map((text, index) => (
                <div key={index} className='space-y-2 border border-white/10 rounded p-4 bg-white/[0.04]'>
                  <textarea
                    className='w-full min-h-[100px] px-3 py-2 rounded bg-black/40 border border-white/15 text-white'
                    value={text}
                    onChange={e => updateParagraph(index, e.target.value)}
                  />
                  <div className='flex justify-end'>
                    <button
                      type='button'
                      onClick={() => removeParagraph(index)}
                      className='text-xs text-red-300 hover:text-red-200'
                      disabled={activeParagraphs.length <= 1}
                    >
                      移除段落
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className='pt-4 flex gap-3'>
              <button
                type='submit'
                disabled={saving}
                className={`px-4 py-2 rounded transition-all duration-100 ease-in-out ${
                  saving
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
