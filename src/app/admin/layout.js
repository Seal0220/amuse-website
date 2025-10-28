'use client';
import Sidebar from './components/Sidebar';

export default function AdminLayout({ children }) {
  return (
    <div className='pt-32 min-h-lvh bg-neutral-950 text-white'>
      <div className='flex flex-row w-full h-fit border-t border-white/15'>
      <Sidebar />
      <main className='flex-1 overflow-y-auto bg-neutral-950 text-neutral-900'>
        {children}
      </main>
      </div>
    </div>
  );
}
