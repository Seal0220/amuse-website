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
    <footer className='relative pt-6 sm:pt-8 pb-10 w-full z-100 flex flex-col items-center gap-4 text-white bg-neutral-950 border-y border-neutral-600 px-4 sm:px-0'>
      <div className='mx-auto flex flex-col sm:flex-row gap-4 sm:gap-2 items-center justify-center text-center sm:text-left'>
        <div className='flex flex-row gap-4 items-center sm:mr-2'>
          <Link href={instagram} target='_blank' rel='noopener noreferrer' className='flex flex-row gap-2 items-center hover:-translate-y-0.5 transition-all duration-300 ease-in-out'>
            <img src='/ig-logo.png' alt='Instagram' className='size-8' />
          </Link>
          <Link href={facebook} target='_blank' rel='noopener noreferrer' className='flex flex-row gap-2 items-center hover:-translate-y-0.5 transition-all duration-300 ease-in-out'>
            <img src='/fb-logo.png' alt='Facebook' className='size-8' />
          </Link>
        </div>
        <div className='flex items-center'>
          <img src='/Amuse-LOGO-w.png' alt={headerLocale.company_name} className='h-10 sm:h-12 object-contain select-none pointer-events-none' />
        </div>
        <div className='flex flex-col gap-1'>
          <div className='text-xs font-bold flex flex-col sm:flex-row gap-1 sm:gap-2 items-center select-auto'>
            <span>{email}</span>
            <div className='hidden sm:block h-3 w-px bg-white/70 mt-0.5' />
            <span>{address}</span>
          </div>
          <div className='text-xs text-white/85 font-thin select-none'>
            {footerLocale?.copyright}
          </div>
        </div>
      </div>
      <div className='text-xs text-white/50 font-thin select-auto text-center'>
        {footerLocale?.credits}
      </div>
    </footer>
  );
}
