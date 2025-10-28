'use client';
import React, { useEffect, useState, useRef } from 'react';
import ImageSlider from '@/app/components/work/ImageSlider';

export default function HeroImages({ indexRef }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 從資料庫載入 hero 圖片
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/hero', { cache: 'no-store' });
        const data = await res.json();
        setImages(data.images || []);
      } catch (err) {
        console.error('載入 hero 圖片失敗:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div
      ref={indexRef}
      className="fixed z-0 w-full h-lvh translate-y-0 flex items-center justify-center bg-gray-300 overflow-hidden transition ease-in-out duration-500"
    >
      {/* Hero 圖片輪播 */}
      <ImageSlider images={images} initImage={'/hero/hero-01.png'} />

      {/* 底部漸層區塊 */}
      <div className="absolute flex items-center justify-center p-12 pt-18 box-border bottom-0 w-full h-20 bg-gradient-to-t from-5% from-neutral-900 via-70% via-neutral-900/70 to-100% to-transparent" />
    </div>
  );
}
