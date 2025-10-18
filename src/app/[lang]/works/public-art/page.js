'use client';
import React, { useRef, useMemo, useEffect } from 'react';
import useAnimator from '@/app/hooks/useAnimator';
import useBreathingNoise from '@/app/hooks/useBreathingNoise';
import useAxisWobble from '@/app/hooks/useAxisWobble';


export default function PublicArt() {
  const startYear = 2020;
  const endYear = 2025;
  const years = useMemo(() => {
    const arr = [];
    arr.push('CENTER');
    for (let y = startYear; y <= endYear; y++) {
      arr.push(y);
    }
    return arr;
  }, []);

  const pageHeight = `${years.length * 75 + years.length * 20}lvh`;
  const pageProgress = years.length * 0.75;

  // Ref
  const animatorRef = useRef(null);
  const animator = useAnimator(animatorRef);

  const axisRef = useRef(null);
  const axisDeg = useAxisWobble(-150, 10, 0.6); // 負值往左上，正值往右上

  const tickRefs = useRef([]);
  tickRefs.current = years.map((_, i) => tickRefs.current[i] ?? React.createRef());
  const lineRef = useRef(null);
  const centerTickRef = useRef(null);

  const ringGroupRef = useRef(null);
  const ringRefs = useRef([]);
  ringRefs.current = years.map((_, i) => ringRefs.current[i] ?? React.createRef());


  useBreathingNoise(centerTickRef, { baseBlur: 64, baseSpread: 16 });
  useBreathingNoise(lineRef, { baseBlur: 32, baseSpread: 2, speed: 0.5, isScale: false });
  // useBreathingNoise(tickRefs.current, { baseBlur: 128, baseSpread: 8, speed: 0.5, isScale: false });


  useEffect(() => {
    if (!animatorRef.current) return;
    animatorRef.current.style.opacity = '1';

    const rippleAni = animator.useAnimation(ringGroupRef)
      .before({ on: 0 }, () => {
      })
      .when({ on: 0, to: pageProgress }, (ele, vars, { progress }) => {
        const easeInOutCubic = (t) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const norm = Math.min(Math.max(progress / pageProgress, 0), 1);
        const smoothMove = easeInOutCubic(norm);

        // --- group 平移緩出範圍 ---
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const endX = vw * 0.5;
        const endY = vh * 0.5;
        const moveX = endX * smoothMove;
        const moveY = endY * smoothMove;
        ele.style.transform = `translate(${moveX}px, ${moveY}px)`;

        // --- 波峰邏輯 ---
        const delayPerRing = 0.08 * pageProgress;
        const band = 0.18 * pageProgress;
        const waveStartOffset = 0.0;
        const center = progress * (1 - waveStartOffset);

        ringRefs.current.forEach((r, i) => {
          const node = r.current;
          if (!node) return;

          let totalWave = 0;
          let weightSum = 0;

          for (let j = 0; j <= i; j++) {
            const local = (center - (years.length - 1 - j) * delayPerRing) / band;
            const t = Math.max(0, Math.min(local, 1));
            const w = Math.exp(-(i - j) * 0.4);
            totalWave += Math.sin(t * Math.PI) * w;
            weightSum += w;
          }

          const wave = (totalWave / weightSum) ** 1.1 * 1.8;
          const baseScale = 0.85;
          const expand = 0.25 * wave * (1 - i / years.length * 0.5);
          const offset = (i - (years.length - 1) / 2) * 0.035 * wave;
          const scale = baseScale + expand + offset;
          const alpha = 0.25 + 0.75 * Math.min(1, wave * 1.2);

          node.style.transform = `scale(${scale})`;
          node.style.opacity = alpha;

          // --- 白點 波動 ---
          const tick = tickRefs.current[i + 1]?.current;
          if (tick && years[i + 1] !== 'CENTER') {
            const diam = maxDiam - i * base;
            const baseRadius = diam / 2;
            const currentRadius = baseRadius * scale;
            tick.style.transform = `translate(${currentRadius}px, -50%)`;
          }

          // --- CENTER 波動 ---
          const centerNode = centerTickRef.current;
          if (centerNode) {
            const centerWave = Math.sin((progress / pageProgress) * Math.PI) ** 1.5;
            const scale = 1 + 0.5 * centerWave;
            centerNode.style.transform = `translate(-50%, -50%) scale(${scale})`;
          }

        });
      })
      .after({ on: pageProgress + 0.5 }, () => { });

    animator.start();
    // animator.debug();
    return () => animator.stop();
  }, []);

  const base = 500;
  const minDiam = 160;
  const maxDiam = minDiam + (years.length - 1) * base;

  return (
    <div style={{ height: pageHeight }} className='relative w-full bg-neutral-800'>
      <div
        ref={animatorRef}
        style={{ opacity: 0 }}
        className='sticky top-0 w-full h-screen bg-neutral-900 overflow-hidden transition-opacity duration-500 ease-in-out'
      >
        <div
          ref={ringGroupRef}
          className='absolute right-[20vw] bottom-[30lvh] flex items-center justify-center transition-all duration-500 ease-out'
        >
          {/* 你的 rings */}
          <div className='h-px ' />
          {years.map((y, i) => {
            const diam = maxDiam - i * base;
            return (
              <div
                key={y}
                ref={ringRefs.current[i]}
                className='absolute rounded-full border border-white/50 shadow-[0_0_64px_8px] shadow-white/20 transition-all duration-300 ease-out flex items-center justify-center text-white select-none'
                style={{ width: `${diam}px`, height: `${diam}px`, opacity: 0 }}
              >
              </div>
            );
          })}

          {/* ---- 斜線與節點（新增） ---- */}
          <div
            ref={axisRef}
            className='absolute left-1/2 top-1/2 pointer-events-none z-20'
            style={{
              transform: `translate(-50%, -50%) rotate(${axisDeg}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* 主線：由中心向一側延伸，寬度覆蓋最大半徑 */}
            <div
              ref={lineRef}
              className='absolute z-0 h-px bg-white/70 shadow-[0_0_32px_8px] shadow-white/50 '
              style={{ left: 0, top: 0, width: `${maxDiam}px`, }}
            />

            {/* 交點與年份標籤：沿 X 軸均放，旋轉容器會把它們帶到正確的斜向 */}
            {years.map((y, i) => {
              if (y === 'CENTER') {
                return (
                  <div
                    key={'center-tick'}
                    ref={centerTickRef}
                    className='absolute z-5 size-20 rounded-full bg-white border border-black/40 shadow-[0_0_64px_16px] shadow-white transition-all duration-300 ease-out'
                    style={{ transform: 'translate(-50%, -50%) scale(1)' }}
                  />
                )
              } else {
                return (
                  <div
                    key={`tick-${y}-${i}`}
                    ref={tickRefs.current[i]}
                    className='absolute transition-all duration-300 ease-out'
                    style={{
                      left: 0,
                      top: 0,
                      transform: 'translate(-50%, -50%)', // 初始先放在中心，待 JS 推
                    }}
                  >
                    {/* 白點本體 */}
                    <div className='size-6 rounded-full -translate-x-1/2 bg-white border border-black/40 shadow-[0_0_64px_16px] shadow-white' />

                    {/* 年份文字（為了閱讀性逆向旋轉） */}
                    <div
                      className='absolute left-4 top-1/2 -translate-y-1/2 text-white/90'
                      style={{ transform: `rotate(${-axisDeg}deg)` }}
                    >
                      <span className='text-3xl font-bold tracking-wide text-nowrap'>{y}</span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
          {/* ---- 斜線與節點（新增） ---- */}
        </div>

      </div>
    </div>
  );
}