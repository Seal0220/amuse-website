'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const path = usePathname();

  const links = [
    { href: '/admin/hero', label: '首頁圖片' },
    { href: '/admin/about', label: '關於我們' },
    { href: '/admin/members', label: '成員資料' },
    { href: '/admin/works', label: '作品資料' },
    { href: '/admin/contact', label: '聯絡我們' },
    { href: '/admin/messages', label: '訊息' },
  ];

  return (
    <aside className='w-60 h-screen bg-neutral-950 flex flex-col border-r border-t border-white/15'>
      <div className='p-4 text-xl font-semibold border-b border-neutral-800 tracking-wide'>
        管理後台
      </div>
      <nav className='flex-1 overflow-y-auto'>
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-5 py-3 text-base hover:bg-neutral-800 transition-colors 
            ${path.startsWith(href)
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white'
              }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <footer className='p-3 text-xs text-neutral-500 border-t border-neutral-800'>
        © {new Date().getFullYear()} Admin Dashboard
      </footer>
    </aside>
  );
}
