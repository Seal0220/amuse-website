'use client';
import { useEffect, useState } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css'; // 一定要引入樣式
import useLocale from '@/app/hooks/useLocale';

export default function ImageSlider({ images = [], initImage = '' }) {
  const { localeDict } = useLocale();
  const locale = localeDict.components.ImageSlider;

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
          <img
            src={initImage}
            alt=''
            className='absolute inset-0 size-full object-cover select-none pointer-events-none'
          />
        </div>
      );
    } else {
      return (
        <div className='relative w-full h-full flex items-center justify-center bg-neutral-900 text-white/50 select-none'>
          {locale.no_image}
        </div>
      );
    }
  }

  return (
    <div className='relative w-full h-full overflow-hidden'>
      <PhotoProvider
        loop
        onIndexChange={(i, state) => setCurrent(i)}
      >
        {/* 圖片顯示 */}
        {images.map((src, i) => (
          <PhotoView key={i} src={src.startsWith('/') ? src : `/${src}`}>
            <img
              src={src.startsWith('/') ? src : `/${src}`}
              alt={`work-image-${i}`}
              className={`absolute inset-0 size-full object-cover select-none cursor-zoom-in transition-opacity duration-1000 ${i === current ? 'opacity-100 pointer-events-auto select-auto' : 'opacity-0 pointer-events-none select-none'
                }`}
            />
          </PhotoView>
        ))}
      </PhotoProvider>

      {/* 底部操作 bar */}
      {images.length > 1 && (
        <>
          <div className='absolute z-50 bottom-6 left-0 right-0 flex justify-center gap-2'>
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

          <div className='absolute z-0 bottom-0 w-full h-20 bg-gradient-to-t from-5% from-neutral-950 via-50% via-neutral-950/70 to-100% to-transparent pointer-events-none'></div>
        </>
        )}
    </div>
  );
}
