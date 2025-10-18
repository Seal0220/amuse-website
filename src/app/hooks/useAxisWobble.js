'use client';
import { useRef, useEffect, useState } from 'react';
import createPerlinNoise from '@/app/functions/createPerlinNoise';

/**
 * useAxisWobbleRef
 * - 不透過 React 重新 render
 * - 直接對元素的 transform 更新 rotate()
 */
export default function useAxisWobbleRef(ref, baseDeg = -150, amplitude = 10, speed = 0.5, textRefs = []) {
  const noise = useRef(createPerlinNoise());
  const frame = useRef(null);
  const start = useRef(Math.random() * 1000);

  useEffect(() => {
    if (!ref?.current) return;
    const el = ref.current;
    let t = start.current;

    const animate = () => {
      t += 0.005 * speed;
      const n = noise.current(t) * 0.5 + 0.5;
      const delta = (n - 0.5) * 2 * amplitude;
      const deg = baseDeg + delta;

      el.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
      el.style.transformOrigin = 'center center';

      // --- 更新所有年份文字反向旋轉 ---
      textRefs.forEach((r) => {
        if (r) r.style.transform = `rotate(${-deg}deg)`;
      });

      frame.current = requestAnimationFrame(animate);
    };

    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [ref, baseDeg, amplitude, speed, textRefs]);
}
