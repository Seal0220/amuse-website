'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useLocale from '@/app/hooks/useLocale';

export default function Footer() {
  const { currentLocale, changeLanguage, localeDict } = useLocale();
  const locale = localeDict.components.Header;

  const [contact, setContact] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/contact', { cache: 'no-store' });
        const data = await res.json();
        setContact(data);
      } catch (err) {
        console.error('載入聯絡資訊失敗:', err);
      }
    }
    load();
  }, []);

  const address = contact?.address?.zh || contact?.address?.en || '';
  const phone = contact?.phone || '';
  const email = contact?.email || '';
  const hours = contact?.hours
    ? `${contact.hours.open || ''} ~ ${contact.hours.close || ''}`
    : '';
  const instagram = contact?.instagram || '#';
  const facebook = contact?.facebook || '#';

  return (
    <footer className='relative pt-8 pb-10 w-full z-100 flex flex-col items-center gap-2 text-white bg-neutral-950 border-y border-neutral-600'>
      <div className='mx-auto flex flex-row gap-2 items-center justify-center'>
        <div className='flex flex-row gap-4 items-center mr-2'>
          <Link href={instagram} target='_blank' rel='noopener noreferrer' className='flex flex-row gap-2 items-center hover:-translate-y-0.5 transition-all duration-300 ease-in-out'>
            <img src='/ig-logo.png' className='size-8' />
          </Link>
          <Link href={facebook} target='_blank' rel='noopener noreferrer' className='flex flex-row gap-2 items-center hover:-translate-y-0.5 transition-all duration-300 ease-in-out'>
            <img src='/fb-logo.png' className='size-8' />
          </Link>
        </div>
        <div className='flex items-center'>
          <img src='/Amuse-LOGO-w.png' alt={locale.company_name} className='h-12 object-contain select-none pointer-events-none' />
        </div>
        <div className='flex flex-col gap-1'>
          <div className='text-xs font-bold flex flex-row gap-2 items-center select-auto'>
            <span>{email}</span>
            <div className='h-3 w-px bg-white/70 mt-0.5' />
            <span>{address}</span>
          </div>
          <div className='text-xs text-white/85 font-thin select-none'>
            Copyright © 2025 amuse art and design 阿木司設計 All right reserved.
          </div>
        </div>
      </div>
      <div className='text-xs text-white/50 font-thin select-auto'>
        website is developed by Chen Yiquan & Liao Xuan-Tang.
      </div>
    </footer>
  );
}
