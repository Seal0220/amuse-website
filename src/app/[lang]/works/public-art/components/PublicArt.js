'use client';
import React, { useRef, useMemo, useEffect, useState } from 'react';
import useAnimator from '@/app/hooks/useAnimator';
import useBreathingNoise from '@/app/hooks/useBreathingNoise';
import useAxisWobbleRef from '@/app/hooks/useAxisWobble';
import WorkDots from './WorkDots';
import Typewriter from '@/app/components/Typewriter';
import useLocale from '@/app/hooks/useLocale';
import useWindowWidth from '@/app/hooks/useWindowWidth';
import FadeOut from '@/app/components/FadeOut';

/**
 * 動態：一年一軌道、一作一點（public-art）
 * 年份排序：由舊到新（越新越後面），最後附上 __CENTER__
 * 其餘動畫／幾何維持原樣
 */
export default function PublicArt() {
  const { isBelowSize } = useWindowWidth();
  const { currentLocale, localeDict } = useLocale();
  const worksLocale = localeDict.pages.works || {};
  const publicArtLocale = worksLocale.types?.publicArt || {};
  const titleMain = publicArtLocale.title || 'Public Art';
  const titleSub = publicArtLocale.subtitle || '';
  const [years, setYears] = useState(['__CENTER__']);           // 例如 ['2018', '2020', ..., '__CENTER__']
  const [worksByYear, setWorksByYear] = useState([]);           // 例如 [['a','b'], ['c'], ...] 對應 years（不含 CENTER）

  // 讀後台資料（直接用 /api/works -> 前端篩 public-art）
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/works?type=public-art', { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const pubs = await res.json();

        // year 正規化（字串化，空的丟掉）
        const normalizeYear = (y) => {
          if (y == null) return null;
          const s = String(y).trim();
          return s ? s : null;
        };

        // 依年份（字串）分組
        const map = new Map();
        for (const w of pubs) {
          const y = normalizeYear(w.year);
          if (!y) continue;
          if (!map.has(y)) map.set(y, []);
          map.get(y).push(w);
        }

        // 年份排序：由舊到新（越新越後面）
        const sortedYears = Array.from(map.keys()).sort((a, b) => {
          const na = parseInt(a, 10), nb = parseInt(b, 10);
          if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
          return a.localeCompare(b);
        });

        // 轉陣列給 WorkDots
        const grouped = sortedYears.map(y => map.get(y));

        setYears([...sortedYears, '__CENTER__']);
        setWorksByYear(grouped);
      } catch (e) {
        console.error('[PublicArt] load error:', e);
        setYears(['__CENTER__']);
        setWorksByYear([]);
      }
    })();
  }, []);

  const pageHeight = `${years.length * 75}lvh`;
  const pageProgress = years.length * 0.75;

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

  const dotGapPx = isBelowSize('sm') ? 48 : 96;
  const basicAxisDeg = isBelowSize('sm') ? -120 : -150;
  const wobbleRangeDeg = isBelowSize('sm') ? 5 : 10;
  const axisRef = useRef(null);
  useAxisWobbleRef(axisRef, basicAxisDeg, wobbleRangeDeg, 0.25, textRefs.current);

  const workDotsRef = useRef(null);

  const fadeOutRef = useRef(null);

  // useBreathingNoise(centerTickRef, { baseBlur: 64, baseSpread: 16 });
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

    const rippleAni = animator
      .useAnimation(ringGroupRef)
      .before({ on: 0 }, () => { })
      .when({ on: 0, to: pageProgress }, (ele, vars, { progress }) => {
        const easeInOutCubic = (t) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        // === 手機模式時：加速 ×2，緩動時間 ×0.75 ===
        const speedFactor = isBelowSize('sm') ? 2 : 1;
        const easingFactor = isBelowSize('sm') ? 0.55 : 1; // 縮短緩動時長為原本的 75%

        // progress → norm：把動畫進度時間壓縮為 easingFactor 倍（越快完成）
        const normRaw = progress / pageProgress;
        const norm = Math.min(Math.max(normRaw / easingFactor, 0), 1);
        const smoothMove = easeInOutCubic(norm);

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // 位移距離加倍（速度提升）
        const moveX = vw * 0.625 * smoothMove * speedFactor;
        const moveY = vh * 0.625 * smoothMove * speedFactor;
        ele.style.transform = `translate(${moveX}px, ${moveY}px)`;

        // === 以下維持原樣 ===
        const delayPerRing = 0.08 * pageProgress;
        const band = 0.18 * pageProgress;
        const waveStartOffset = 0.0;
        const centerProg = progress * (1 - waveStartOffset);

        if (centerTickRef.current) {
          const centerWave = Math.sin((progress / pageProgress) * Math.PI) ** 1.5;
          const s = 1 + 0.5 * centerWave;
          centerTickRef.current.style.transform = `translate(-50%, -50%) scale(${s})`;
        }

        ringRefs.current.forEach((r, i) => {
          const node = r.current;
          if (!node) return;

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

          if (years[i] !== '__CENTER__' && years[i] !== '__GAP__') {
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
    return () => animator.stop();
  }, [years.length, pageProgress, isBelowSize]);


  // ==== Title: Typewriter（只在掛載時 reset + start）====
  const titleMainRef = useRef(null);
  const titleSubRef = useRef(null);
  useEffect(() => {
    titleMainRef.current?.reset?.();
    titleSubRef.current?.reset?.();
    titleMainRef.current?.start?.();
    titleSubRef.current?.start?.();
  }, [titleMain, titleSub]);

  return (
    <div style={{ height: pageHeight }} className='min-h-lvh relative w-full bg-neutral-950'>
      {/* Title */}
      <div className='fixed left-[8%] top-[14%] text-white select-none z-5 text-shadow-white text-shadow-[0_0_40px] pointer-events-none transition-all ease-in-out duration-500'>
        <div className='text-4xl mb-1'>
          <Typewriter ref={titleMainRef} speed={150} content={titleMain} />
        </div>
        <div className='text-lg text-neutral-400'>
          <Typewriter ref={titleSubRef} speed={60} content={titleSub} />
        </div>
      </div>

      <div
        ref={animatorRef}
        style={{ opacity: 0 }}
        className='sticky top-0 w-full h-screen bg-neutral-950 overflow-hidden transition-opacity duration-500 ease-in-out'
      >
        {/* 環 */}
        <div
          ref={ringGroupRef}
          className='absolute scale-70 sm:scale-100 right-[20vw] bottom-[30lvh] flex items-center justify-center transition-all duration-500 ease-out'
        >
          <div className='h-px' />
          {years.map((y, i) => {
            const diam = (y === '__CENTER__') ? 0 : diamAt(i);
            if (y === '__CENTER__') return null;
            return (
              <div
                key={`${y}-${i}`}
                ref={ringRefs.current[i]}
                className='absolute rounded-full border border-white/50 shadow-[0_0_64px_8px] shadow-white/20 transition-all duration-300 ease-out flex items-center justify-center text-white select-none'
                style={{ width: `${diam}px`, height: `${diam}px`, opacity: 0 }}
              />
            );
          })}

          {/* 作品白點（依每年實際作品數量） */}
          <WorkDots
            ref={workDotsRef}
            lang={currentLocale}
            years={years}
            ringRefs={ringRefs}
            isYear={(y) => !(y === '__CENTER__' || y === '__GAP__')}
            diamAt={diamAt}
            basicAxisDeg={basicAxisDeg}
            ringGroupRef={ringGroupRef}
            edgeMarginDeg={wobbleRangeDeg}
            gapPx={dotGapPx}
            centerVoidHalfDeg={wobbleRangeDeg / 2}
            keepCenter={false}
            worksByYear={worksByYear}
            fadeOutRef={fadeOutRef}
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
              style={{ left: 0, top: 0, width: '500vmax' }}
            />

            {/* 節點（年份刻度與中心） */}
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

      <FadeOut ref={fadeOutRef} />
    </div>
  );
}
