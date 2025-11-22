'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Planet from './Planet';
import Typewriter from '@/app/components/Typewriter';
import useLocale from '@/app/hooks/useLocale';
import useWindowWidth from '@/app/hooks/useWindowWidth';
import FadeOut from '@/app/components/FadeOut';

export default function ExhibitionSpace() {
  const router = useRouter();
  const { currentLocale, localeDict } = useLocale();
  const { isBelowSize } = useWindowWidth();
  const isMobile = isBelowSize('sm');

  const worksLocale = localeDict.pages.works || {};
  const exhibitionLocale = worksLocale.types?.exhibitionSpace || {};
  const titleMain = exhibitionLocale.title || 'Exhibition Space';
  const titleSub = exhibitionLocale.subtitle || '';

  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const titleMainRef = useRef(null);
  const titleSubRef = useRef(null);
  const fadeOutRef = useRef(null);

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
        const res = await fetch('/api/works?type=exhibition-space');
        const data = await res.json();
        if (canceled) return;
        const sorted = [...data].sort((a, b) => {
          const ay = Number(a.year) || 0;
          const by = Number(b.year) || 0;
          return by - ay; // 年份大的排前面
        });
        setWorks(sorted);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => (canceled = true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    if (isMobile) {
      container.style.height = '';
      content.style.transform = '';
      return;
    }

    let rafId = null;
    let ticking = false;

    const recalcAndApply = () => {
      const contentWidth = content.scrollWidth;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const maxTranslate = Math.max(contentWidth - viewportWidth, 0);

      const neededHeight = maxTranslate + window.innerHeight;
      if (Math.abs(container.clientHeight - neededHeight) > 1) {
        container.style.height = `${neededHeight}px`;
      }

      const containerTop = container.getBoundingClientRect().top + window.scrollY;
      const totalScrollable = Math.max(container.scrollHeight - window.innerHeight, 0);
      const raw = window.scrollY - containerTop;
      const clamped = Math.min(Math.max(raw, 0), totalScrollable);
      const progress = totalScrollable > 0 ? clamped / totalScrollable : 0;

      const translateX = Math.round(progress * maxTranslate);
      const finalX = Math.min(Math.max(translateX, 0), maxTranslate);

      content.style.transform = `translate3d(-${finalX}px, -50%, 0)`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        rafId = requestAnimationFrame(recalcAndApply);
      }
    };
    const onResize = () => {
      if (!ticking) {
        ticking = true;
        rafId = requestAnimationFrame(recalcAndApply);
      }
    };

    recalcAndApply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    const onWheel = (e) => {
      if (!content) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

      e.preventDefault();
      e.stopPropagation();

      const contentWidth = content.scrollWidth;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const maxTranslate = Math.max(contentWidth - viewportWidth, 0);
      const totalScrollable = Math.max(container.scrollHeight - window.innerHeight, 0);
      if (maxTranslate <= 0 || totalScrollable <= 0) return;

      const ratio = totalScrollable / maxTranslate;
      const deltaY = e.deltaX * ratio;
      window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
    };

    content.addEventListener('wheel', onWheel, { passive: false });

    let lastTouchX = null;
    let lastTouchY = null;
    let touching = false;

    const onTouchStart = (e) => {
      if (e.touches && e.touches.length === 1) {
        touching = true;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e) => {
      if (!touching || !e.touches || e.touches.length !== 1) return;
      const tx = e.touches[0].clientX;
      const ty = e.touches[0].clientY;
      const dx = lastTouchX - tx;
      const dy = lastTouchY - ty;

      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        e.stopPropagation();

        const contentWidth = content.scrollWidth;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const maxTranslate = Math.max(contentWidth - viewportWidth, 0);
        const totalScrollable = Math.max(container.scrollHeight - window.innerHeight, 0);
        if (maxTranslate > 0 && totalScrollable > 0) {
          const ratio = totalScrollable / maxTranslate;
          const deltaY = dx * ratio;
          window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
        }
      }

      lastTouchX = tx;
      lastTouchY = ty;
    };
    const onTouchEnd = () => {
      touching = false;
      lastTouchX = null;
      lastTouchY = null;
    };

    content.style.touchAction = 'pan-y';
    content.addEventListener('touchstart', onTouchStart, { passive: true });
    content.addEventListener('touchmove', onTouchMove, { passive: false });
    content.addEventListener('touchend', onTouchEnd, { passive: true });
    content.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // === mouse drag 行為（對應 touch 邏輯） ===
    let lastMouseX = null;
    let lastMouseY = null;
    let mousing = false;

    const onMouseDown = (e) => {
      mousing = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!mousing) return;
      const mx = e.clientX;
      const my = e.clientY;
      const dx = lastMouseX - mx;
      const dy = lastMouseY - my;

      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        e.stopPropagation();

        const contentWidth = content.scrollWidth;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const maxTranslate = Math.max(contentWidth - viewportWidth, 0);
        const totalScrollable = Math.max(container.scrollHeight - window.innerHeight, 0);
        if (maxTranslate > 0 && totalScrollable > 0) {
          const ratio = totalScrollable / maxTranslate;
          const deltaY = dx * ratio;
          window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
        }
      }

      lastMouseX = mx;
      lastMouseY = my;
    };

    const onMouseUp = () => {
      mousing = false;
      lastMouseX = null;
      lastMouseY = null;
    };

    content.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);

      if (content) {
        content.removeEventListener('wheel', onWheel);
        content.removeEventListener('touchstart', onTouchStart);
        content.removeEventListener('touchmove', onTouchMove);
        content.removeEventListener('touchend', onTouchEnd);
        content.removeEventListener('touchcancel', onTouchEnd);
        content.removeEventListener('mousedown', onMouseDown);
        content.style.touchAction = '';
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [works, isMobile]);

  const onWorkClick = (slug) => {
    fadeOutRef.current?.onComplete(() => {
      router.push(`/${currentLocale}/works/exhibition-space/${slug}`);
    });
    fadeOutRef.current?.start?.();
  }

  return (
    <div ref={containerRef} className='relative w-full bg-neutral-950'>
      {/* Title */}
      <div className='fixed left-[8%] top-[14%] text-white select-none z-20 pointer-events-none'>
        <div className='text-4xl mb-1'>
          <Typewriter ref={titleMainRef} speed={150} content={titleMain} />
        </div>
        <div className='text-lg text-neutral-400'>
          <Typewriter ref={titleSubRef} speed={60} content={titleSub} />
        </div>
      </div>

      {/* Container */}
      <div
        ref={contentRef}
        className={`
          flex items-center md:justify-between min-w-full min-h-full active:cursor-grabbing
          gap-20 sm:gap-25 md:gap-30 lg:gap-45 xl:gap-60
          sm:px-40 md:px-60 lg:px-80 mt-60 mb-20 md:my-0
          whitespace-nowrap z-10 transition-all duration-300 ease-out
          ${isMobile ? `relative w-full py-32 flex-col` : `fixed left-0 top-1/2`} 
          ${loading ? 'opacity-0' : 'opacity-100'}
         `}
      >
        {/* Line */}
        {isMobile ? (
          <div className='absolute top-0 h-full'>
            <div className='absolute h-full overflow-hidden'>
              <div className='w-[2px] left-1/2 top-0 -translate-y-[10%] h-[120%] bg-gradient-to-b from-5% from-transparent via-white/20 to-95% to-transparent' />
            </div>
            <div className='absolute w-px h-[80%] shadow-[0_0_48px_4px] shadow-white/25 mx-auto' />
          </div>
        ) : (
          <div className='fixed left-0 w-full'>
            <div className='fixed left-0 w-full overflow-hidden'>
              <div className='h-[2px] left-1/2 -translate-x-[10%] w-[120%] bg-gradient-to-r from-5% from-transparent via-white/20 to-95% to-transparent' />
            </div>
            <div className='h-px w-[80%] shadow-[0_0_48px_4px] shadow-white/25 mx-auto' />
          </div>
        )}

        {/* Works */}
        {works.map((work, i) => (
          <div key={work.id || i} className='inline-block'>
            <Planet
              work={work}
              index={i}
              onClick={() => onWorkClick(work.slug)}
            />
          </div>
        ))}
      </div>

      <FadeOut ref={fadeOutRef} />
    </div>
  );
}
