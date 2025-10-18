'use client';
import { useEffect, useRef } from 'react';
import createPerlinNoise from '@/app/functions/createPerlinNoise';


/**
 * 共用一個 RAF 時鐘的群體呼吸 Hook
 */
export default function useNoiseBreathing(
  refs,
  { baseBlur, baseSpread, amplitude = 0.4, speed = 0.3, isScale = true } = {}
) {
  const noise = useRef(createPerlinNoise());
  const frameRef = useRef(null);

  useEffect(() => {
    const refArray = Array.isArray(refs)
      ? refs
      : Array.isArray(refs?.current)
      ? refs.current
      : [refs];

    if (refArray.length === 0) return;

    // 為每個元素設定一個 phase offset，讓呼吸不同步
    const phases = refArray.map(() => Math.random() * 1000);

    const animate = (time) => {
      const tBase = time * 0.001 * speed;

      for (let i = 0; i < refArray.length; i++) {
        const el = refArray[i]?.current;
        if (!el || !el.style) continue;

        const n = noise.current(tBase + phases[i]) * 0.5 + 0.5;
        const factor = 1 + amplitude * (n - 0.5) * 2;
        const blur = baseBlur + n * 30;
        const spread = baseSpread + n * 10;

        // 保留原 translate
        const prev = el.style.transform || '';
        const baseTranslate =
          prev.match(/translate\([^)]*\)/)?.[0] || 'translate(0, 0)';

        if (isScale) el.style.transform = `${baseTranslate} scale(${factor})`;
        else el.style.transform = baseTranslate;

        // 直接操作 box-shadow，避免 reflow
        el.style.boxShadow = `0 0 ${blur.toFixed(1)}px ${spread.toFixed(
          1
        )}px rgba(255,255,255,${(0.5 + n * 0.5).toFixed(2)})`;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [refs, baseBlur, baseSpread, amplitude, speed, isScale]);
}
