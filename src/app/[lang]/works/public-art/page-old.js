'use client';
import React, { useRef, useMemo, useEffect } from 'react';
import useAnimator from '@/app/hooks/useAnimator';

export default function PublicArt() {
  const animatorRef = useRef(null);
  const animator = useAnimator(animatorRef);

  const startYear = 2020;
  const endYear = 2025;
  const years = useMemo(() => {
    const arr = [];
    arr.push('CENTER')
    for (let y = endYear; y >= startYear; y--) {
      arr.push(y);
      arr.push(y + 10);
    };
    console.log(arr);

    return arr; // [2025, 2024, ..., 2020] 內→外
  }, []);

  const pageHeight = `${years.length * 75 + years.length * 20}lvh`;
  const pageProgress = years.length * 0.75;

  const ringGroupRef = useRef(null);
  const ringRefs = useRef([]);
  ringRefs.current = years.map((_, i) => ringRefs.current[i] ?? React.createRef());

  useEffect(() => {
    if (!animatorRef.current) return;

    const totalRings = years.length;
    const sigma = 3;        // ← 更窄的擴散 ⇒ 峰值更尖銳
    const baseScale = 0.85; // ← 降低基準，讓放大空間更大
    const maxExpand = 0.5;  // ← 強化放大量

    const ripple = animator.useAnimation(ringGroupRef)
      .before({ on: 0 }, () => {

      })
      .when({ on: 0, to: pageProgress }, (ele, vars, { progress }) => {
        const moveX = progress * 20;
        const moveY = progress * 15;
        ele.style.transform = `translate(${moveX}vw, ${moveY}lvh)`;

        ringRefs.current.forEach((r, i) => {
          const node = r.current;
          if (!node) return;

          // 外圈反應更慢，內圈更快
          const localSensitivity = 1 + (i / totalRings) * 1.2;
          const offsetProgress = progress * localSensitivity;
          const uLocal = Math.min(offsetProgress / pageProgress, 1);

          const localPeak = (1 - uLocal) * (totalRings - 1);
          const distance = Math.abs(i - localPeak);
          const gauss = Math.exp(-(distance * distance) / (2 * sigma * sigma));

          // 使用平滑遞減並加速的曲線，讓放大過程更自然且持續有變化
          const intensity = Math.pow(gauss, 1.1) * (1 + Math.exp(-distance * 0.5));
          
          const speedFactor = 1 + progress * (1 - i / totalRings) * 1.2; // 滾動越下加速越明顯
          const smoothIntensity = intensity * speedFactor / (1 + progress * 2);

          const dynamicScale = baseScale + maxExpand * smoothIntensity;
          const alpha = 0.1 + 0.9 * smoothIntensity;

          node.style.transform = `scale(${dynamicScale})`;
          node.style.opacity = String(alpha);
        });
      })
      .after({ on: pageProgress + 0.5 }, () => {
        // ringRefs.current.forEach((r) => {
        //   if (!r.current) return;
        //   r.current.style.opacity = '0';
        // });
      });

    animator.start();
    return () => animator.stop();
  }, []);

  const base = 500;
  const minDiam = 160;
  const maxDiam = minDiam + (years.length - 1) * base;

  return (
    <div
      style={{ height: pageHeight }}
      className="relative w-full bg-neutral-800"
    >
      <div ref={animatorRef} className="sticky top-0 w-full h-screen overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900" />

        <div
          ref={ringGroupRef}
          className="absolute right-[20vw] bottom-[30lvh] flex items-center justify-center transition-all duration-500 ease-out"
        >
          {years.map((y, i) => {
            const diam = maxDiam - i * base;
            return (
              <div
                key={y}
                ref={ringRefs.current[i]}
                className="absolute rounded-full border border-white/50 bg-red-500 shadow-[0_0_64px_8px] shadow-white/20 transition-[transform,opacity,filter,border-color] duration-300 ease-out flex items-center justify-center text-white select-none"
                style={{ width: `${diam}px`, height: `${diam}px`, opacity: 0 }}
              >
                <span className="text-[10px] tracking-[0.35em] uppercase opacity-80">{y}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}