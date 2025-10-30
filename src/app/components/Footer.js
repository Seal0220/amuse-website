'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import useLocale from '@/app/hooks/useLocale';
import { pickLocalized } from '@/app/functions/utils';

export default function Footer() {
  const { currentLocale, localeDict } = useLocale();
  const headerLocale = localeDict.components.Header;
  const footerLocale = localeDict.components.Footer;

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

  const address = pickLocalized(currentLocale, contact?.address);
  const phone = contact?.phone || '';
  const email = contact?.email || '';
  const instagram = contact?.instagram || '#';
  const facebook = contact?.facebook || '#';

  return (
    <footer className='relative pt-8 pb-12 px-6 w-full z-100 flex flex-col items-center gap-3 text-white bg-neutral-950 border-t border-neutral-600'>
      {/* 上半區塊 */}
      <div className='mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 items-center justify-center text-center lg:text-left'>
        <div className='flex flex-row gap-6'>
          {/* 社群 icon */}
          <div className='flex flex-row gap-4 items-center lg:mr-2 order-2 lg:order-none'>
            <Link
              href={instagram}
              target='_blank'
              rel='noopener noreferrer'
              className='flex flex-row gap-2 items-center hover:-translate-y-0.5 transition-all duration-300 ease-in-out'
            >
              <img src='/ig-logo.png' alt='Instagram' className='size-7 min-w-7 min-h-7' />
            </Link>
            <Link
              href={facebook}
              target='_blank'
              rel='noopener noreferrer'
              className='flex flex-row gap-2 items-center hover:-translate-y-0.5 transition-all duration-300 ease-in-out'
            >
              <img src='/fb-logo.png' alt='Facebook' className='size-7 min-w-7 min-h-7' />
            </Link>
          </div>

          {/* LOGO */}
          <div className='flex items-center order-1 lg:order-none'>
            <img
              src='/Amuse-LOGO-w.png'
              alt={headerLocale.company_name}
              className='h-10 lg:h-12 object-contain select-none pointer-events-none'
            />
          </div>
        </div>



        {/* 聯絡資訊 */}
        <div className='flex flex-col gap-3 lg:gap-1 items-center lg:items-start lg:order-none'>
          <div className='text-xs font-bold flex flex-col lg:flex-row gap-1 lg:gap-2 items-center select-auto'>
            <span>{email}</span>
            <div className='hidden lg:block h-3 w-px bg-white/70 mt-0.5' />
            <span>{address}</span>
          </div>
          <div className='text-xs text-white/85 font-thin select-none'>
            {footerLocale?.copyright}
          </div>
        </div>
      </div>

      {/* 下方 credits */}
      <div className='text-[10px] lg:text-xs text-white/50 font-thin select-auto text-center'>
        {footerLocale?.credits}
      </div>
    </footer>
  );
}
