'use client';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Planet from './Planet';
import Typewriter from '@/app/components/Typewriter';
import useLocale from '@/app/hooks/useLocale';

export default function ExhibitionSpace() {
  const router = useRouter();
  const { lang: langParam } = useParams();
  const { currentLocale, localeDict } = useLocale();
  const worksLocale = localeDict.pages.works || {};
  const exhibitionLocale = worksLocale.types?.exhibitionSpace || {};
  const titleMain = exhibitionLocale.title || 'Exhibition Space';
  const titleSub = exhibitionLocale.subtitle || '';
  const activeLang = langParam || currentLocale || 'zh';
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---- Title Typewriter refs ----
  const titleMainRef = useRef(null); // 展示空間
  const titleSubRef = useRef(null);  // Exhibition Space

  useEffect(() => {
    titleMainRef.current?.reset?.();
    titleSubRef.current?.reset?.();
    titleMainRef.current?.start?.();
    titleSubRef.current?.start?.();
  }, [titleMain, titleSub]);

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
    <div className='relative w-full min-h-lvh bg-neutral-950 overflow-hidden'>
      {/* Title */}
      <div className='fixed left-[8%] top-[14%] text-white select-none z-5 text-shadow-white text-shadow-[0_0_40px] pointer-events-none transition-all ease-in-out duration-500'>
        <div className='text-4xl mb-1'>
          <Typewriter ref={titleMainRef} speed={150} content={titleMain} />
        </div>
        <div className='text-lg text-neutral-400'>
          <Typewriter ref={titleSubRef} speed={60} content={titleSub} />
        </div>
      </div>

      <div className={`bg-neutral-950 min-h-lvh flex flex-row items-center justify-center transition-opacity duration-250 ease-in-out ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <div className='flex flex-row justify-center gap-80'>
          {/* Planet */}
          {works.map((w, i) => (
            <Planet
              key={w.id || w.slug || i}
              work={w}
              index={i}
              onClick={(slug) => router.push(`/${activeLang}/works/exhibition-space/${slug}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
