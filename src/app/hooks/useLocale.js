'use client';
import { useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// 匯入所有語系 JSON
import zh from '@/app/locales/zh.json';
import en from '@/app/locales/en.json';

const supportedLanguages = ['zh', 'en'];
const locales = { zh, en };

export default function useLocale(defaultLang = 'zh') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 直接由 pathname 推導目前語系（不用 state，避免 zh→en 閃爍）
  const currentLocale = useMemo(() => {
    if (!pathname) return defaultLang;

    const segments = pathname.split('/').filter(Boolean);
    const first = segments[0];

    if (first && supportedLanguages.includes(first)) return first;

    // 無語系前綴時，試著讀 localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('lang');
        if (stored && supportedLanguages.includes(stored)) return stored;
      } catch {}
    }
    return defaultLang;
  }, [pathname, defaultLang]);

  // 對應字典同樣由 currentLocale 衍生（不用 state）
  const localeDict = useMemo(() => locales[currentLocale], [currentLocale]);

  // 切換語言：只改 URL 與 localStorage，不 setState
  const changeLanguage = useCallback(
    (newLang) => {
      if (!supportedLanguages.includes(newLang)) return;

      const pathSegments = (pathname || '/').split('/').filter(Boolean);

      if (pathSegments.length > 0 && supportedLanguages.includes(pathSegments[0])) {
        pathSegments[0] = newLang;
      } else {
        pathSegments.unshift(newLang);
      }

      const newPath = '/' + pathSegments.join('/');
      const queryParams = searchParams ? searchParams.toString() : '';
      const url = queryParams ? `${newPath}?${queryParams}` : newPath;

      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('lang', newLang);
        }
      } catch {}

      router.replace(url);
    },
    [pathname, router, searchParams]
  );

  return { currentLocale, changeLanguage, localeDict };
}

// 若進入無語言 prefix 的頁面，自動導向
export function useLocaleRedirect(defaultLang = 'zh') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const segments = pathname.split('/').filter(Boolean);
    const first = segments[0];

    // 允許以環境變數覆蓋支援清單，否則預設 zh/en
    let supported = [];
    try {
      supported = JSON.parse(process.env.LANG || '["zh","en"]');
    } catch {
      supported = ['zh', 'en'];
    }

    if (!supported.includes(first || '')) {
      const queryParams = searchParams ? searchParams.toString() : '';
      const url = queryParams
        ? `/${defaultLang}${pathname}?${queryParams}`
        : `/${defaultLang}${pathname}`;
      router.replace(url);
    }
  }, [pathname, router, searchParams, defaultLang]);
}
