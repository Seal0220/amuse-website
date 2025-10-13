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
    <header className='fixed top-0 w-full z-[100] text-white bg-gradient-to-b from-black/80 via-black/40 to-transparent'>
      <div className='mx-auto flex flex-row gap-10 items-center justify-between px-8 py-6'>
        {/* LOGO */}
        <div className='flex items-center'>
          <img
            src='/Amuse-LOGO-w.png'
            alt={locale.company_name}
            className='h-20 object-contain select-none pointer-events-none'
            draggable='false'
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* 導覽列 */}
        <nav className='flex flex-row gap-10'>
          <div className='flex flex-row gap-20 text-lg tracking-wide items-center'>
            {/* 這三個在動畫頁用同頁切換，不在動畫頁就真跳轉 */}
            <a href={`/${lang}`} onClick={(e) => navigateSamePage(e, 'home')} className='hover:text-gray-300'>
              {locale.home}
            </a>
            <a href={`/${lang}/team`} onClick={(e) => navigateSamePage(e, 'team')} className='hover:text-gray-300'>
              {locale.team}
            </a>
            <a href={`/${lang}/contact`} onClick={(e) => navigateSamePage(e, 'contact')} className='hover:text-gray-300'>
              {locale.contact}
            </a>

            {/* works 保留 Link（本來就是獨立頁） */}
            <Link href={`/${lang}/works`} className='hover:text-gray-300'>
              {locale.works}
            </Link>
          </div>

          {/* 語言切換 */}
          <button
            onClick={() => changeLanguage(currentLocale === 'zh' ? 'en' : 'zh')}
            className='ml-6 border border-gray-500 px-3 py-1 rounded hover:bg-gray-800 transition cursor-pointer'
          >
            {currentLocale === 'zh' ? 'EN' : '中'}
          </button>
        </nav>
      </div>
    </header>
  );
}
