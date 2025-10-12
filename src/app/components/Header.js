'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import useLocale from '@/app/hooks/useLocale';
import Link from 'next/link';

export default function Header() {
  const { currentLocale, changeLanguage, localeDict } = useLocale();
  const locale = localeDict.components.Header;
  const pathname = usePathname();

  // 目前語言（以第一段為主）
  const segs = pathname.split('/').filter(Boolean);
  const lang = segs[0] || currentLocale || 'zh';

  // 在同一頁的三個區段，改用 pushState + 自訂事件，避免 Next 重置滾動到頂
  const navigateSamePage = (e, goal) => {
    e.preventDefault();

    const target = goal === 'home' ? `/${lang}` : `/${lang}/${goal}`;
    const url = typeof window !== 'undefined'
      ? target + window.location.search
      : target;

    // 更新網址但不觸發 Next 導覽
    window.history.pushState(null, '', url);
    // 通知主頁做平滑 seek（HomePage 會監聽 'section:navigate'）
    window.dispatchEvent(new CustomEvent('section:navigate', { detail: goal }));
  };

  return (
    <header className="fixed top-0 w-full z-100 text-white bg-gradient-to-b from-20% from-black/80 to-100% to-transparent">
      <div className="mx-auto flex flex-row gap-10 items-center justify-between px-8 py-6">
        <div className="flex items-center">
          <img
            src="/Amuse-LOGO-w.png"
            alt={locale.company_name}
            className="h-20 object-contain select-none pointer-events-none"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        <nav className="flex flex-row gap-10">
          <div className="flex flex-row gap-20 text-lg tracking-wide items-center">
            {/* 同頁：home / team / contact → 改用 <a> + pushState，避免滾到頂 */}
            <a href={`/${currentLocale}/`} onClick={(e) => navigateSamePage(e, 'home')} className="hover:text-gray-300">
              {locale.home}
            </a>
            <a href={`/${currentLocale}/team`} onClick={(e) => navigateSamePage(e, 'team')} className="hover:text-gray-300">
              {locale.team}
            </a>

            {/* 不是同頁區段（獨立頁）：照用 Next Link */}
            <Link href={`/${currentLocale}/works`} className="hover:text-gray-300">
              {locale.works}
            </Link>

            <a href={`/${currentLocale}/contact`} onClick={(e) => navigateSamePage(e, 'contact')} className="hover:text-gray-300">
              {locale.contact}
            </a>
          </div>

          <button
            onClick={() => changeLanguage(currentLocale === 'zh' ? 'en' : 'zh')}
            className="ml-6 border border-gray-500 px-3 py-1 rounded hover:bg-gray-800 transition cursor-pointer"
          >
            {currentLocale === 'zh' ? 'EN' : '中'}
          </button>
        </nav>
      </div>
    </header>
  );
}
