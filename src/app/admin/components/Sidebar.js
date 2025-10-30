'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaAngleRight } from "react-icons/fa6";

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const links = [
    { href: '/admin/hero', label: '首頁圖片' },
    { href: '/admin/about', label: '關於我們' },
    { href: '/admin/contact', label: '聯絡我們' },
    { href: '/admin/members', label: '成員資料' },
    { href: '/admin/works', label: '作品資料' },
    { href: '/admin/messages', label: '訊息' },
  ];

  // 路由切換時自動關閉抽屜（行動版）
  useEffect(() => { setOpen(false); }, [path]);

  // ESC 關閉
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const year = new Date().getFullYear();

  return (
    <>
      {/* 行動版：漢堡按鈕（僅 <md 顯示） */}
      <button
        type='button'
        aria-label='開啟選單'
        aria-controls='admin-sidebar'
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className='md:hidden fixed top-[40lvh] left-0 z-90 rounded-r-full border border-l-0 border-white/20 bg-neutral-900/90 px-3 py-2 text-white/90 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur transition active:scale-95'
      >
        <span className='sr-only'>開啟選單</span>
        <FaAngleRight />
      </button>

      {/* 行動版：Backdrop（僅 <md 顯示） */}
      <div
        className={`md:hidden fixed inset-0 z-90 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
      />

      {/* 行動版：抽屜 + 桌機：固定欄位（共用DOM，透過斷點控制樣式） */}
      <aside
        id='admin-sidebar'
        ref={panelRef}
        className={`
          bg-neutral-950 border-r border-t border-white/15 flex flex-col
          w-64 h-dvh md:h-screen
          fixed md:static left-0 top-0 z-210 md:z-auto
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* 行動版：關閉鈕（放在側欄內右上角） */}
        <div className='md:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-800'>
          <div className='text-base font-semibold tracking-wide'>管理後台</div>
          <button
            type='button'
            aria-label='關閉選單'
            onClick={() => setOpen(false)}
            className='rounded-md border border-white/20 px-2 py-1.5 text-sm text-white/80 bg-neutral-800/60 active:scale-95 transition'
          >
            關閉
          </button>
        </div>

        {/* 桌機標題 */}
        <div className='hidden md:block p-4 text-xl font-semibold border-b border-neutral-800 tracking-wide'>
          管理後台
        </div>

        {/* 導覽 */}
        <nav className='flex-1 overflow-y-auto'>
          {links.map(({ href, label }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`block px-5 py-3 text-base transition-colors
                  ${active ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/70'}
                `}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 底部版權 */}
        <footer className='p-3 text-xs text-neutral-500 border-t border-neutral-800'>
          © {year} Admin Dashboard
        </footer>
      </aside>
    </>
  );
}
