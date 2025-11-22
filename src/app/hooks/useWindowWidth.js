import { useState, useEffect } from 'react';

/**
 * Tailwind breakpoints (min-width):
 * sm:  640px
 * md:  768px
 * lg: 1024px
 * xl: 1280px
 * 2xl: 1536px
 * 3xl: 1920px
 * 4xl: 2560px
 */
const sizes = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
};

export default function useWindowWidth() {
  const getWidth = () =>
    typeof window !== 'undefined' ? window.innerWidth : NaN;

  const getHeight = () =>
    typeof window !== 'undefined' ? window.innerHeight : NaN;

  const [windowWidth, setWindowWidth] = useState(getWidth());
  const [windowHeight, setWindowHeight] = useState(getHeight());

  useEffect(() => {
    const onResize = () => {
      setWindowWidth(getWidth());
      setWindowHeight(getHeight());
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 動態取得目前所在的 Tailwind 區間
  const sorted = Object.entries(sizes).sort((a, b) => a[1] - b[1]);
  let windowSize = 'xs';
  if (Number.isFinite(windowWidth)) {
    for (const [label, min] of sorted) {
      if (windowWidth >= min) windowSize = label;
    }
  }

  // 找出下一個 breakpoint
  const getNextBreakpoint = (label) => {
    const keys = Object.keys(sizes);
    const idx = keys.indexOf(label);
    if (idx === -1 || idx === keys.length - 1) return Infinity;
    return sizes[keys[idx + 1]];
  };

  // === 主要邏輯 ===
  // 小於「下一個區間」的寬度都算在這一級裡面（包含該級）
  const isBelowSize = (label) => windowWidth < getNextBreakpoint(label);
  // 大於等於該區間起點
  const isAboveSize = (label) => windowWidth >= (sizes[label] ?? -Infinity);

  return {
    windowSize,
    windowWidth,
    windowHeight,
    sizes,
    isBelowSize,
    isAboveSize,
  };
}
