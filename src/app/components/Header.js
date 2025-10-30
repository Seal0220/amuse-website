'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useLocale from '@/app/hooks/useLocale';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const { currentLocale, changeLanguage, localeDict } = useLocale();
  const locale = localeDict.components.Header;
  const pathname = usePathname();

  const segs = pathname.split('/').filter(Boolean);
  const lang = segs[0] || currentLocale || 'zh';
  const currentSection = segs[1] || 'home';

  /** 是否在動畫頁（home/team/contact） */
  const isInAnimatedPage = ['home', 'team', 'contact'].includes(currentSection) || segs.length <= 1;

  const navigateSamePage = (e, goal) => {
    e.preventDefault();
    const target = goal === 'home' ? `/${lang}` : `/${lang}/${goal}`;

    // 若目前不在動畫頁（例如在 /works）
    // → 就讓 Next.js 重新載入動畫頁（會重新 mount HomePage）
    if (!isInAnimatedPage) {
      router.push(target);
      return;
    }

    // 若在動畫頁 → 用 pushState + 自訂事件實現平滑切換
    const url = typeof window !== 'undefined'
      ? target + window.location.search
      : target;

    window.history.pushState(null, '', url);
    window.dispatchEvent(new CustomEvent('section:navigate', { detail: goal }));
  };

  return (
    <header className='fixed top-0 w-full sm:w-lvw z-100 text-white bg-gradient-to-b from-black/80 via-black/40 to-transparent overflow-hidden pointer-events-none'>
      <div className='mx-auto flex flex-col sm:flex-row gap-4 sm:gap-10 items-start sm:items-center justify-between px-4 py-4 sm:px-8 sm:py-6 w-full'>
        {/* LOGO */}
        <div
          className='flex items-center hover:-translate-y-1 cursor-pointer transition-all duration-300 ease-in-out pointer-events-auto'
          onClick={() => { router.replace(`/${lang}`); }}
        >
          <img
            src='/Amuse-LOGO-w.png'
            alt={locale.company_name}
            className='h-16 sm:h-20 object-contain select-none pointer-events-none'
            draggable='false'
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* 導覽列 */}
        <nav className='flex flex-col sm:flex-row gap-4 sm:gap-10 pointer-events-auto pr-0 sm:pr-8 w-full sm:w-auto'>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-20 text-base sm:text-lg tracking-wide items-start sm:items-center w-full sm:w-auto'>
            {/* 這三個在動畫頁用同頁切換，不在動畫頁就真跳轉 */}
            <a href={`/${lang}`} onClick={(e) => navigateSamePage(e, 'home')} className='block w-full sm:w-auto hover:text-neutral-300 text-shadow-white hover:text-shadow-[0_0_24px] hover:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'>
              {locale.home}
            </a>
            <a href={`/${lang}/team`} onClick={(e) => navigateSamePage(e, 'team')} className='block w-full sm:w-auto hover:text-neutral-300 text-shadow-white hover:text-shadow-[0_0_24px] hover:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'>
              {locale.team}
            </a>
            <a href={`/${lang}/contact`} onClick={(e) => navigateSamePage(e, 'contact')} className='block w-full sm:w-auto hover:text-neutral-300 text-shadow-white hover:text-shadow-[0_0_24px] hover:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'>
              {locale.contact}
            </a>

            {/* works 保留 Link（本來就是獨立頁） */}
            <Link href={`/${lang}/works`} className='block w-full sm:w-auto hover:text-neutral-300 text-shadow-white hover:text-shadow-[0_0_24px] hover:-translate-y-1 text-nowrap transition-all duration-300 ease-in-out'>
              {locale.works}
            </Link>
          </div>

          {/* 語言切換 */}
          <button
            onClick={() => changeLanguage(currentLocale === 'zh' ? 'en' : 'zh')}
            className='mt-2 sm:mt-0 sm:ml-6 border border-neutral-500 px-3 py-1 rounded hover:bg-neutral-800 transition cursor-pointer self-start sm:self-auto text-sm sm:text-base'
          >
            {currentLocale === 'zh' ? 'EN' : '中'}
          </button>
        </nav>
      </div>
    </header>
  );
}
