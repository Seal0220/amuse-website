'use client';
import { useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import zh from '@/app/locales/zh.json';
import en from '@/app/locales/en.json';

const supportedLanguages = ['zh', 'en'];
const locales = { zh, en };

// 這些第一層路徑「沒有語系前綴」，而且要固定用 zh
const FORCE_ZH_NO_PREFIX = new Set(['admin']); // 需要再加就放這：e.g. 'cms','dashboard'

export default function useLocale(defaultLang = 'zh') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 由 pathname 推導語系；後台(/admin)一律 zh；避免用 state 造成首幀閃爍
  const currentLocale = useMemo(() => {
    if (!pathname) return defaultLang;

    const seg0 = pathname.split('/').filter(Boolean)[0] || '';

    // 後台：固定 zh，不讀 localStorage
    if (FORCE_ZH_NO_PREFIX.has(seg0)) return 'zh';

    // 前台：有合法語系前綴就用
    if (supportedLanguages.includes(seg0)) return seg0;

    // 沒前綴時才看 localStorage，否則回 defaultLang
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('lang');
        if (stored && supportedLanguages.includes(stored)) return stored;
      } catch {}
    }
    return defaultLang;
  }, [pathname, defaultLang]);

  const localeDict = useMemo(
    () => locales[currentLocale] || locales[defaultLang],
    [currentLocale, defaultLang]
  );

  // 切換語言：後台不改 URL，只記偏好；前台修改路徑前綴
  const changeLanguage = useCallback(
    (newLang) => {
      if (!supportedLanguages.includes(newLang)) return;

      const segs = (pathname || '/').split('/').filter(Boolean);
      const seg0 = segs[0] || '';

      // 後台：不導頁，僅儲存偏好（給前台頁面用）
      if (FORCE_ZH_NO_PREFIX.has(seg0)) {
        try {
          if (typeof window !== 'undefined') window.localStorage.setItem('lang', newLang);
        } catch {}
        return;
      }

      // 前台：改前綴
      if (segs.length > 0 && supportedLanguages.includes(seg0)) segs[0] = newLang;
      else segs.unshift(newLang);

      const newPath = '/' + segs.join('/');
      const qs = searchParams ? searchParams.toString() : '';
      const url = qs ? `${newPath}?${qs}` : newPath;

      try {
        if (typeof window !== 'undefined') window.localStorage.setItem('lang', newLang);
      } catch {}
      router.replace(url);
    },
    [pathname, router, searchParams]
  );

  return { currentLocale, changeLanguage, localeDict };
}

// 只有前台需要自動補語系；後台(/admin)跳過
export function useLocaleRedirect(defaultLang = 'zh') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const segs = pathname.split('/').filter(Boolean);
    const seg0 = segs[0] || '';

    // 後台與 API/靜態資源全部跳過
    if (FORCE_ZH_NO_PREFIX.has(seg0)) return;
    if (pathname.startsWith('/api')) return;
    if (/\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$/i.test(pathname)) return;

    // 環境變數可覆蓋支援語系
    let supported = ['zh', 'en'];
    try {
      supported = JSON.parse(process.env.LANG || '["zh","en"]');
    } catch {}

    if (!supported.includes(seg0)) {
      const qs = searchParams ? searchParams.toString() : '';
      const url = qs ? `/${defaultLang}${pathname}?${qs}` : `/${defaultLang}${pathname}`;
      router.replace(url);
    }
  }, [pathname, router, searchParams, defaultLang]);
}
