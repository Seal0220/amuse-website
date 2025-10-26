'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * 交叉淡化容器 + 平滑滾到頂部：
 * - slug 改變：先把新內容設為透明 → 平滑滾回頂部 → 再淡入
 * - 全域事件 'work:fadeOut'：先淡出 → 平滑滾回頂部（通常在路由切換前 150ms）
 *
 * 備註：
 * - 會尊重使用者的偏好「減少動態效果」（prefers-reduced-motion）
 * - 以 window 為滾動容器，若你有指定的滾動容器，可把 scrollToTop 的 target 改成該容器
 */
export default function Crossfade({ slug, duration = 300, scrollDuration = 400, children }) {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef(0);
  const scrollRafRef = useRef(0);

  // ====== easing / scroll ======
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const cancelScroll = () => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = 0;
    }
  };

  const smoothScrollToTop = (ms = 400) => {
    // 若使用者不想要動畫，直接跳頂
    const prefersReduced = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    cancelScroll();

    if (prefersReduced || ms <= 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    const startY = window.scrollY || window.pageYOffset || 0;
    if (startY <= 0) return; // 已在頂部就不跑動畫

    const start = performance.now();
    const animate = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = easeInOutCubic(t);
      const y = Math.round(startY * (1 - eased));
      window.scrollTo(0, y);
      if (t < 1) {
        scrollRafRef.current = requestAnimationFrame(animate);
      } else {
        scrollRafRef.current = 0;
      }
    };
    scrollRafRef.current = requestAnimationFrame(animate);
  };

  // ====== slug 改變：先透明、滾到頂，再淡入 ======
  useEffect(() => {
    setVisible(false);
    // 先滾回頂部（比淡入時間略長一些比較自然）
    smoothScrollToTop(scrollDuration);

    // 下一幀開始淡入，確保 DOM 已替換為新內容
    rafRef.current = requestAnimationFrame(() => setVisible(true));
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ====== 收到全域淡出事件：先淡出再滾回頂部 ======
  useEffect(() => {
    const onFadeOut = () => {
      setVisible(false);
      smoothScrollToTop(scrollDuration);
    };
    window.addEventListener('work:fadeOut', onFadeOut);
    return () => {
      window.removeEventListener('work:fadeOut', onFadeOut);
      cancelScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${duration}ms ease`,
        willChange: 'opacity',
      }}
    >
      {children}
    </div>
  );
}
