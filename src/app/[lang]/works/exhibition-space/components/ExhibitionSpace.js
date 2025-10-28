'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Planet from './Planet';

export default function ExhibitionSpace() {
  const router = useRouter();
  const { lang } = useParams();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/works?type=exhibition-space', { cache: 'no-store' });
        const data = await res.json();
        if (canceled) return;
        const sorted = [...data].sort((a, b) => String(a.year || '').localeCompare(String(b.year || '')));
        setWorks(sorted.slice(0, 2));
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, []);

  return (
    <div className='relative w-full min-h-lvh bg-neutral-800 overflow-hidden'>
      {/* 左上角文字區塊 */}
      <div className='absolute left-[8%] top-[12%] text-white select-none z-[5]'>
        <div className='text-4xl mb-1'>展示空間</div>
        <div className='text-lg text-neutral-400'>Exhibition Space</div>
      </div>

      <div className={`bg-neutral-950 min-h-lvh flex flex-row items-center justify-center transition-opacity duration-250 ease-in-out ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <div className='flex flex-row justify-center gap-80'>
          {/* Planet */}
          {works.map((w, i) => (
            <Planet
              key={w.id || w.slug || i}
              work={w}
              index={i}
              onClick={(slug) => router.push(`/${lang}/works/exhibition-space/${slug}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
