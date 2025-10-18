'use client';
import React from 'react';

export default function ExhibitionSpace() {
  return (
    <div className='relative w-full h-lvh bg-neutral-800 overflow-hidden'>
      {/* 左上角文字區塊 */}
      <div className='absolute left-[8%] top-[14%] text-white select-none z-[5]'>
        <div className='text-4xl mb-1'>展示空間</div>
        <div className='text-lg text-neutral-400'>Our Works</div>
      </div>


    </div>
  );
};
