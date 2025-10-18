'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function TransitionLayout({ children }) {
  const pathname = usePathname();

  // 解析語言根
  const segments = pathname.split('/').filter(Boolean);
  const lang = segments[0] || 'zh';
  const root = '/' + lang;

  // [[...section]] 群組：這些路徑之間不做轉場
  const noTransitionGroups = ['/', '/team', '/contact'];
  const isInSectionGroup = noTransitionGroups.some((p) =>
    pathname.startsWith(`${root}${p}`)
  );

  // 群組內 -> key 固定為 lang（不觸發轉場）
  // 跨群組 -> key 為完整 pathname（觸發轉場）
  const transKey = useMemo(
    () => (isInSectionGroup ? lang : pathname),
    [isInSectionGroup, lang, pathname]
  );

  // 黑幕狀態
  const prevKeyRef = useRef(transKey);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayOpaque, setOverlayOpaque] = useState(false);
  const DURATION = 500; // ms

  useEffect(() => {
    if (prevKeyRef.current === transKey) return; // 同群組，不觸發
    prevKeyRef.current = transKey;

    // 顯示黑幕 → 淡入 → 淡出 → 隱藏
    setOverlayVisible(true);
    requestAnimationFrame(() => setOverlayOpaque(true)); // 下一幀才加上不透明，觸發 CSS transition

    const t1 = setTimeout(() => setOverlayOpaque(false), DURATION);      // 淡入完成後開始淡出
    const t2 = setTimeout(() => setOverlayVisible(false), DURATION * 2); // 完成後隱藏

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [transKey]);

  return (
    <>
      {/* 主要內容 */}
      <div className="relative min-h-screen">{children}</div>

      {/* 黑幕層：不遮擋滑鼠（pointer-events-none），只做轉場效果 */}
      {overlayVisible && (
        <div
          className={`fixed inset-0 z-[9999] bg-black pointer-events-none transition-opacity duration-500 ease-in-out ${
            overlayOpaque ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </>
  );
}
