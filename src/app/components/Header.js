'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import useLocale from '@/app/hooks/useLocale';
import { IoIosMenu, IoIosClose } from 'react-icons/io';


export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentLocale, changeLanguage, localeDict } = useLocale();

  const locale = localeDict.components.Header;
  const segs = pathname.split('/').filter(Boolean);
  const lang = segs[0] || currentLocale || 'zh';
  const currentSection = segs[1] || 'home';
  const isInAnimatedPage =
    ['home', 'team', 'contact'].includes(currentSection) || segs.length <= 1;

  const [menuOpen, setMenuOpen] = useState(false);

  // 避免開單欄選單時可滾動背景
  useEffect(() => {
    try {
      if (menuOpen) document.body.classList.add('overflow-hidden');
      else document.body.classList.remove('overflow-hidden');
    } catch { }
    return () => {
      try { document.body.classList.remove('overflow-hidden'); } catch { }
    };
  }, [menuOpen]);

  const navigateSamePage = (e, goal) => {
    e.preventDefault();
    setMenuOpen(false);

    const target = goal === 'home' ? `/${lang}` : `/${lang}/${goal}`;

    if (!isInAnimatedPage) {
      router.push(target);
      return;
    }

    const url = typeof window !== 'undefined'
      ? target + window.location.search
      : target;

    window.history.pushState(null, '', url);
    window.dispatchEvent(new CustomEvent('section:navigate', { detail: goal }));
  };

  const goHome = () => {
    setMenuOpen(false);
    router.replace(`/${lang}`);
  };

  const toggleLang = () => {
    setMenuOpen(false);
    changeLanguage(currentLocale === 'zh' ? 'en' : 'zh');
  };

  return (
    <header className='fixed top-0 w-lvw z-200 text-white bg-gradient-to-b from-black/80 via-black/40 to-transparent overflow-hidden pointer-events-none'>
      <div className='mx-auto flex items-center justify-between px-4 md:px-8 py-4 md:py-6'>
        {/* 左：LOGO（手機/桌機皆顯示） */}
        <div
          className='flex items-center active:-translate-y-1 hover:-translate-y-1 cursor-pointer transition-all duration-300 ease-in-out pointer-events-auto'
          onClick={goHome}
        >
          <img
            src='/Amuse-LOGO-w.png'
            alt={locale.company_name}
            className='h-14 md:h-20 object-contain select-none pointer-events-none'
            draggable='false'
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* 右：桌機導覽（md 以上） */}
        <nav className='hidden md:flex flex-row gap-10 pointer-events-auto pr-2 md:pr-8'>
          <div className='flex flex-row gap-8 lg:gap-20 text-lg tracking-wide items-center'>
            <a
              href={`/${lang}`}
              onClick={(e) => navigateSamePage(e, 'home')}
              className='hover:text-neutral-300 text-shadow-white hover:text-shadow-[0_0_24px] hover:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'
            >
              {locale.home}
            </a>
            <a
              href={`/${lang}/team`}
              onClick={(e) => navigateSamePage(e, 'team')}
              className='hover:text-neutral-300 text-shadow-white hover:text-shadow-[0_0_24px] hover:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'
            >
              {locale.team}
            </a>
            <a
              href={`/${lang}/contact`}
              onClick={(e) => navigateSamePage(e, 'contact')}
              className='hover:text-neutral-300 text-shadow-white hover:text-shadow-[0_0_24px] hover:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'
            >
              {locale.contact}
            </a>
            <Link
              href={`/${lang}/works`}
              className='hover:text-neutral-300 text-shadow-white hover:text-shadow-[0_0_24px] hover:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'
            >
              {locale.works}
            </Link>
          </div>

          <button
            onClick={toggleLang}
            className='ml-6 border border-neutral-500 px-3 py-1 rounded hover:bg-neutral-800 transition cursor-pointer'
          >
            {currentLocale === 'zh' ? 'EN' : '中'}
          </button>
        </nav>

        {/* 右：手機選單按鈕（md 以下） */}
        <div className='absolute top-4 right-4'>
          <button
            aria-label='Open menu'
            aria-expanded={menuOpen ? 'true' : 'false'}
            onClick={() => setMenuOpen((v) => !v)}
            className='size-12 md:hidden pointer-events-auto p-2 rounded border border-white/30 active:bg-white/10 transition-all duration-200 ease-in-out'
          >
            <IoIosMenu className='size-full' />
          </button>
        </div>
      </div>

      {/* 手機全螢幕選單（md 以下） */}
      <div
        className={`
          md:hidden fixed inset-0 z-[110] pointer-events-auto
          bg-neutral-950/95 backdrop-blur
          transition-opacity duration-300 ease-in-out
          ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMenuOpen(false)}
      >
        {/* 關閉按鈕 */}
        <div className='absolute top-4 right-4'>
          <button
            aria-label='Close menu'
            onClick={() => setMenuOpen(false)}
            className='size-12 p-2 rounded border border-white/30 active:bg-white/10 transition-all duration-200 ease-in-out'
          >
            <IoIosClose className='size-full' />
          </button>
        </div>

        {/* 內容 */}
        <div className='w-full h-full flex flex-col items-center justify-center gap-8'>
          <a
            href={`/${lang}`}
            onClick={(e) => navigateSamePage(e, 'home')}
            className='text-xl active:text-neutral-300 text-shadow-white active:text-shadow-[0_0_24px] active:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'
          >
            {locale.home}
          </a>
          <a
            href={`/${lang}/team`}
            onClick={(e) => navigateSamePage(e, 'team')}
            className='text-xl active:text-neutral-300 text-shadow-white active:text-shadow-[0_0_24px] active:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'
          >
            {locale.team}
          </a>
          <a
            href={`/${lang}/contact`}
            onClick={(e) => navigateSamePage(e, 'contact')}
            className='text-xl active:text-neutral-300 text-shadow-white active:text-shadow-[0_0_24px] active:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'
          >
            {locale.contact}
          </a>
          <Link
            href={`/${lang}/works`}
            onClick={() => setMenuOpen(false)}
            className='text-xl active:text-neutral-300 text-shadow-white active:text-shadow-[0_0_24px] active:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'
          >
            {locale.works}
          </Link>

          <button
            onClick={toggleLang}
            className='mt-6 border border-neutral-500 px-4 py-2 text-base rounded active:bg-neutral-800 transition cursor-pointer'
          >
            {currentLocale === 'zh' ? 'EN' : '中'}
          </button>
        </div>
      </div>
    </header>
  );
}
