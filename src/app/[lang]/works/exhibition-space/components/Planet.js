'use client';
import React, { useMemo } from 'react';

// 可重現亂數（依 seed）
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const strSeed = (s) => {
  let h = 2166136261;
  for (let i = 0; i < (s || '').length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h);
};

export default function Planet({ work, index = 0, onClick }) {
  const planet = useMemo(() => {
    // 取第一張圖
    let imgs = [];
    try { imgs = JSON.parse(work.images || '[]'); } catch {}
    const img = imgs[0] || '/banner-test.png';

    // 穩定亂數
    const seed = strSeed(work.slug || `${index}`);
    const rnd = mulberry32(seed);

    // 參數
    const x = index === 0 ? '25%' : '75%';
    const y = '50%';
    const size = 360 + Math.floor(rnd() * 40) - 20;   // 340~380px
    const tilt = index === 0 ? (rnd() * 20 - 30) : (40 + rnd() * 10); // 左：-20~20deg；右：70~80deg
    const rings = index === 0 ? 3 : 3 + Math.floor(rnd() * 2);        // 左 3，右 3~4
    const ellipseScale = index === 0 ? (1.6 + rnd() * 0.4) : 1.05;    // 左扁、右直
    const ringOpacity = index === 0 ? 0.35 : 0.45;

    const satCount = index === 0 ? 2 : 0;
    const satRadii = Array.from({ length: satCount }).map(() => 0.85 + rnd() * 0.6);
    const satSize = 12 + Math.floor(rnd() * 8);

    // 穩定 keyframes 前綴，避免重名
    const kfPrefix = `orbit_${strSeed(work.slug || `${index}`)}`;

    // 顯示名稱
    let displayTitle = work.slug;
    try {
      const t = JSON.parse(work.title || '{}');
      displayTitle = t.zh || t.en || work.slug;
    } catch {
      displayTitle = work.title || work.slug;
    }

    return {
      img, x, y, size, tilt, rings, ellipseScale, ringOpacity,
      satRadii, satSize, kfPrefix, displayTitle,
      year: work.year,
    };
  }, [work, index]);

  const handleClick = () => {
    onClick?.(work.slug);
  };

  return (
    <div
      className='relative select-none'
      style={{
        width: planet.size, height: planet.size,
      }}
    >
      {/* 本體 */}
      <button
        onClick={handleClick}
        className='block size-full rounded-full overflow-hidden border border-white/20 shadow-[0_0_64px_8px_rgba(255,255,255,0.15)] cursor-pointer hover:scale-[1.1] transition-all duration-300 ease-in-out'
        title={planet.displayTitle}
        style={{
          backgroundImage: `url(${planet.img})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* 環（傾斜／直立） */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{ transform: `rotate(${planet.tilt}deg)` }}
      >
        {Array.from({ length: planet.rings }).map((_, ri) => {
          const t = (ri / planet.rings) * 0.32;
          const scale = t * planet.ellipseScale * 0.65;
          const expand = 1.4 + scale;   // x 軸橢圓
          const shrink = 0.25 + scale;  // y 軸微縮
          return (
            <div
              key={ri}
              className={`absolute left-1/2 top-1/2 rounded-full ${ri === Math.floor(planet.rings / 2) ? 'border-4' : 'border-2'}`}
              style={{
                width: '92%',
                height: '92%',
                transform: `translate(-50%,-50%) scale(${expand},${shrink})`,
                borderColor: `rgba(255,255,255,${planet.ringOpacity - ri * 0.06})`,
              }}
            />
          );
        })}
      </div>

      {/* 衛星（僅左顆） */}
      {planet.satRadii.length > 0 && (
        <div
          className='pointer-events-none absolute inset-0'
          style={{ transform: `rotate(${planet.tilt}deg)` }}
        >
          {planet.satRadii.map((R, si) => {
            const dur = 12 + si * 4;
            const name = `${planet.kfPrefix}_${si}`;
            return (
              <div
                key={si}
                className='absolute left-1/2 top-1/2'
                style={{
                  width: 0, height: 0,
                  transform: 'translate(-50%,-50%)',
                  animation: `${name} ${dur}s linear infinite`,
                }}
              >
                <div
                  className='rounded-full bg-white shadow-[0_0_16px_4px_rgba(255,255,255,0.35)]'
                  style={{
                    width: planet.satSize, height: planet.satSize,
                    transform: `translateX(${(planet.size / 2) * R}px)`,
                  }}
                />
              </div>
            );
          })}
          {/* 針對本顆星球專屬的 keyframes，避免命名衝突 */}
          <style jsx>{`
            ${planet.satRadii.map((_, si) => {
              const name = `${planet.kfPrefix}_${si}`;
              return `
                @keyframes ${name} {
                  0% { transform: translate(-50%,-50%) rotate(0deg); }
                  100% { transform: translate(-50%,-50%) rotate(360deg); }
                }
              `;
            }).join('\n')}
          `}</style>
        </div>
      )}

      {/* 標題 */}
      <div className='absolute left-1/2 -bottom-10 -translate-x-1/2 text-center text-white/90'>
        <div className='text-sm font-medium tracking-wide'>{planet.displayTitle}</div>
        <div className='text-xs text-white/60'>{planet.year}</div>
      </div>
    </div>
  );
}
