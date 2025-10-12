'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// 匯入所有語系 JSON
import zh from '@/app/locales/zh.json';
import en from '@/app/locales/en.json';

const supportedLanguages = ["zh", "en"];
const locales = { zh, en };

export default function useLocale(defaultLang = 'zh') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---------- 偵測目前語系 ----------
  const detectLang = useCallback(() => {
    if (!pathname) return defaultLang;
    const segments = pathname.split('/').filter(Boolean);
    const first = segments[0];
    if (supportedLanguages.includes(first)) return first;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lang');
      if (stored && supportedLanguages.includes(stored)) return stored;
    }
    return defaultLang;
  }, [pathname, defaultLang]);

  const [currentLocale, setCurrentLocale] = useState(detectLang);
  const [localeDict, setLocaleDict] = useState(locales[defaultLang]);

  // ---------- 語言切換 ----------
  const changeLanguage = useCallback(
    (newLang) => {
      if (!supportedLanguages.includes(newLang)) return;
      const pathSegments = pathname.split('/').filter(Boolean);

      if (pathSegments.length > 0 && supportedLanguages.includes(pathSegments[0])) {
        pathSegments[0] = newLang;
      } else {
        pathSegments.unshift(newLang);
      }

      const newPath = '/' + pathSegments.join('/');
      const queryParams = searchParams.toString();
      const url = queryParams ? `${newPath}?${queryParams}` : newPath;

      localStorage.setItem('lang', newLang);
      setCurrentLocale(newLang);
      setLocaleDict(locales[newLang]);
      router.replace(url);
    },
    [pathname, router, searchParams]
  );

  // ---------- 每次路由改變時更新 ----------
  useEffect(() => {
    const lang = detectLang();
    setCurrentLocale(lang);
    setLocaleDict(locales[lang]);
  }, [pathname, detectLang]);

  return { currentLocale, changeLanguage, localeDict };
}

// 若進入無語言 prefix 頁面，自動導向
export function useLocaleRedirect(defaultLang = 'zh') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const segments = pathname.split('/').filter(Boolean);
    const first = segments[0];
    const supported = JSON.parse(process.env.LANG || '["zh","en"]');
    if (!supported.includes(first)) {
      const queryParams = searchParams.toString();
      const url = queryParams
        ? `/${defaultLang}${pathname}?${queryParams}`
        : `/${defaultLang}${pathname}`;
      router.replace(url);
    }
  }, [pathname, router, searchParams, defaultLang]);
}
