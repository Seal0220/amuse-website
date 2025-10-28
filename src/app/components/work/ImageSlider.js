'use client';
import { useEffect, useState } from 'react';

export default function ImageSlider({ images = [], initImage = '' }) {
  const [current, setCurrent] = useState(0);
  const length = images.length;

  // 自動輪播，每 5 秒換一張
  useEffect(() => {
    if (length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % length);
    }, 5000);
    return () => clearInterval(interval);
  }, [length]);

  if (length === 0) {
    if (initImage) {
      return (
        <div className='relative w-full h-full overflow-hidden'>
          <img src={initImage} className='absolute inset-0 size-full object-cover select-none pointer-events-none' />
        </div>
      )
    } else {
      return (
        <div className='relative w-full h-full flex items-center justify-center bg-neutral-900 text-white/50'>
          無圖片
        </div>
      )
    }
  }

  return (
    <div className='relative w-full h-full overflow-hidden'>
      {/* 圖片顯示 */}
      {images.map((src, i) => (
        <img
          key={i}
          src={src.startsWith('/') ? src : `/${src}`}
          alt={`work-image-${i}`}
          className={`absolute inset-0 size-full object-cover select-none pointer-events-none transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'
            }`}
        />
      ))}

      {/* 底部操作 bar */}
      <div className='absolute z-200 bottom-6 left-0 right-0 flex justify-center gap-2'>
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 cursor-pointer rounded-full transition-all ${i === current
              ? 'bg-white scale-110 shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]'
              : 'bg-white/40 hover:bg-white/70'
              }`}
          />
        ))}
      </div>

      {/* 頭尾循環漸變遮罩 */}
      <div className='absolute bottom-0 w-full h-20 bg-gradient-to-t from-5% from-neutral-950 via-50% via-neutral-950/70 to-100% to-transparent pointer-events-none'></div>
    </div>
  );
}