'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useLocale from '@/app/hooks/useLocale';

export default function Footer() {
  const { currentLocale, changeLanguage, localeDict } = useLocale();
  const locale = localeDict.components.Header;

  return (
    <footer className='pt-8 pb-10 w-full z-100 text-white bg-neutral-950 border-y border-neutral-600'>
      <div className='mx-auto flex flex-col gap-2 items-center justify-between'>
        <div className='flex items-center'>
          <img src='/Amuse-LOGO-w.png' alt={locale.company_name} className='h-12 object-contain select-none pointer-events-none' />
        </div>
        <div className='flex flex-row gap-20 items-center text-xs font-thin select-none'>
          Copyright © 2025 amuse art and design 阿木司設計 All right reserved.
        </div>
      </div>
    </footer>
  );
}
