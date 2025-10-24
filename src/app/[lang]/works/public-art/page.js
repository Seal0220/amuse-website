'use client';
import React, { useRef, useMemo, useEffect } from 'react';
import useAnimator from '@/app/hooks/useAnimator';
import useBreathingNoise from '@/app/hooks/useBreathingNoise';
import useAxisWobbleRef from '@/app/hooks/useAxisWobble';
import WorkDots from './components/workDots/WorkDots';


export default function PublicArt() {
  // 含有 __CENTER__ 與 __GAP__
  const years = useMemo(() => ['2018', '2020', '2022', '2023', '2024', '2025', '__CENTER__',], []);
  const pageHeight = `${years.length * 75 + years.length * 20}lvh`;
  const pageProgress = years.length * 0.75;

  // Refs
  const animatorRef = useRef(null);
  const animator = useAnimator(animatorRef);

  const tickRefs = useRef([]);
  tickRefs.current = years.map((_, i) => tickRefs.current[i] ?? React.createRef());

  const lineRef = useRef(null);
  const centerTickRef = useRef(null);

  const ringGroupRef = useRef(null);
  const ringRefs = useRef([]);
  ringRefs.current = years.map((_, i) => ringRefs.current[i] ?? React.createRef());

  const textRefs = useRef([]);
  textRefs.current = years.map((_, i) => textRefs.current[i] ?? null);

  const basicAxisDeg = -150;
  const axisRef = useRef(null);
  useAxisWobbleRef(axisRef, basicAxisDeg, 10, 0.25, textRefs.current);

  const workDotsRef = useRef(null);

  useBreathingNoise(centerTickRef, { baseBlur: 64, baseSpread: 16 });
  useBreathingNoise(lineRef, { baseBlur: 32, baseSpread: 2, speed: 0.5, isScale: false });

  // 幾何
  const base = 500;
  const minDiam = 160;
  const maxDiam = minDiam + (years.length - 1) * base;
  const diamAt = (i) => maxDiam - i * base;

  const isCenter = (y) => y === '__CENTER__';
  const isGap = (y) => y === '__GAP__';
  const isYear = (y) => !isCenter(y) && !isGap(y);

  useEffect(() => {
    if (!animatorRef.current) return;
    animatorRef.current.style.opacity = '1';

    // 動畫
    const rippleAni = animator
      .useAnimation(ringGroupRef)
      .before({ on: 0 }, () => { })
      .when({ on: 0, to: pageProgress }, (ele, vars, { progress }) => {
        const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

        const norm = Math.min(Math.max(progress / pageProgress, 0), 1);
        const smoothMove = easeInOutCubic(norm);

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const endX = vw * 0.625;
        const endY = vh * 0.625;
        const moveX = endX * smoothMove;
        const moveY = endY * smoothMove;
        ele.style.transform = `translate(${moveX}px, ${moveY}px)`;

        const delayPerRing = 0.08 * pageProgress;
        const band = 0.18 * pageProgress;
        const waveStartOffset = 0.0;
        const centerProg = progress * (1 - waveStartOffset);

        // 中心呼吸
        if (centerTickRef.current) {
          const centerWave = Math.sin((progress / pageProgress) * Math.PI) ** 1.5;
          const s = 1 + 0.5 * centerWave;
          centerTickRef.current.style.transform = `translate(-50%, -50%) scale(${s})`;
        }

        ringRefs.current.forEach((r, i) => {
          const node = r.current;
          if (!node) return;

          // 波峰權重（原樣）
          let totalWave = 0;
          let weightSum = 0;
          for (let j = 0; j <= i; j++) {
            const local = (centerProg - (years.length - 1 - j) * delayPerRing) / band;
            const t = Math.max(0, Math.min(local, 1));
            const w = Math.exp(-(i - j) * 0.4);
            totalWave += Math.sin(t * Math.PI) * w;
            weightSum += w;
          }

          const wave = (totalWave / Math.max(weightSum, 1e-6)) ** 1.1 * 1.8;
          const baseScale = 0.85;
          const expand = 0.25 * wave * (1 - (i / years.length) * 0.5);
          const offset = (i - (years.length - 1) / 2) * 0.035 * wave;
          const scale = baseScale + expand + offset;
          const alpha = 0.25 + 0.75 * Math.min(1, wave * 1.2);

          node.style.transform = `scale(${scale})`;
          node.style.opacity = String(alpha);

          // 白點沿半徑定位（原樣）
          if (isYear(years[i])) {
            const tick = tickRefs.current[i]?.current;
            if (tick) {
              const currentRadius = (diamAt(i) / 2) * scale;
              tick.style.transform = `translate(${currentRadius}px, -50%)`;
            }
          }

          const local = (centerProg - (years.length - 1 - i) * delayPerRing) / band;
          const t = Math.max(0, Math.min(local, 1));
          const atCrestWindow = t > 0.3 && t < 0.75;

          if (workDotsRef.current) {
            workDotsRef.current.updateRing(i, {
              atCrestWindow,
              radius: diamAt(i) / 2,
            });
          }
        });
      })
      .after({ on: pageProgress + 0.5 }, () => { });

    animator.start();

    return () => {
      animator.stop();
    };
  }, [years.length]);

  return (
    <div style={{ height: pageHeight }} className='relative w-full bg-neutral-800'>
      <div
        ref={animatorRef}
        style={{ opacity: 0 }}
        className='sticky top-0 w-full h-screen bg-neutral-950 overflow-hidden transition-opacity duration-500 ease-in-out'
      >
        {/* 環 */}
        <div
          ref={ringGroupRef}
          className='absolute scale-50 sm:scale-100 right-[20vw] bottom-[30lvh] flex items-center justify-center transition-all duration-500 ease-out'
        >
          <div className='h-px ' />
          {years.map((y, i) => {
            const diam = diamAt(i);
            return (
              <div
                key={`${y}-${i}`}
                ref={ringRefs.current[i]}
                className='absolute rounded-full border border-white/50 shadow-[0_0_64px_8px] shadow-white/20 transition-all duration-300 ease-out flex items-center justify-center text-white select-none'
                style={{ width: `${diam}px`, height: `${diam}px`, opacity: 0 }}
              />
            );
          })}

          {/* 紅點 */}
          <WorkDots
            ref={workDotsRef}
            years={years}
            ringRefs={ringRefs}
            isYear={(y) => !(y === '__CENTER__' || y === '__GAP__')}
            diamAt={diamAt}
            basicAxisDeg={basicAxisDeg}
            ringGroupRef={ringGroupRef}
            dotsPerRing={4}
            edgeMarginDeg={10}
            gapPx={96}
            centerVoidHalfDeg={5}
            keepCenter={false}
          />

          {/* 軸 */}
          <div
            ref={axisRef}
            className='absolute left-1/2 top-1/2 pointer-events-none z-20 will-change-transform transform-3d'
            style={{
              transform: `translate(-50%, -50%) rotate(-150deg)`,
              transformOrigin: 'center center',
            }}
          >

            {/* 射線 */}
            <div
              ref={lineRef}
              className='absolute z-0 h-px bg-white/70 shadow-[0_0_32px_8px] shadow-white/50 '
              style={{ left: 0, top: 0, width: `${maxDiam * 2}px` }}
            />

            {/* 節點 */}
            {years.map((y, i) => {
              if (y === '__CENTER__') {
                return (
                  <div
                    key={`center-tick-${i}`}
                    ref={centerTickRef}
                    className='absolute z-5 size-20 rounded-full bg-white border border-black/40 shadow-[0_0_64px_16px] shadow-white transition-all duration-300 ease-out will-change-transform transform-3d'
                    style={{ transform: 'translate(-50%, -50%) scale(1)' }}
                  />
                );
              }
              if (y === '__GAP__') {
                return null;
              }
              return (
                <div
                  key={`tick-${y}-${i}`}
                  ref={tickRefs.current[i]}
                  className='absolute transition-all duration-300 ease-out'
                  style={{ left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
                >
                  <div className='size-6 rounded-full -translate-x-1/2 bg-white border border-black/40 shadow-[0_0_64px_16px] shadow-white' />
                  <div
                    ref={(el) => { if (el) textRefs.current[i] = el; }}
                    className='absolute left-4 top-1/2 -translate-y-1/2 text-white/90'
                  >
                    <span className='text-3xl font-bold tracking-wide text-nowrap'>{y}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
