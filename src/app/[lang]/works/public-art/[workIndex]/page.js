'use client';
import React, { useEffect } from 'react';

const testData = {
  images: [],
  title: '光徑',
  medium: '金屬、影像PC板、LED燈、控制系統',
  size: '720 × 720 × 48（cm）',
  year: '2024',
  location: '成功大學',
  management: '財團法人國家實驗研究院台灣半導體研究中心',
  description: '從石器到鐵器，在文明的長河裡，每一個時代都以工具為名——而今，「矽」成為科技的核心，鋪展了我們的「矽時代」。「矽」開啟人類探索二元之外的旅程，在導體與絕緣體之間，因雜質的注入而生成新的可能。「矽」成為了人類開啟未來之門的要角。而光作為指引者、穿越微觀疆域，經由照射與聚焦，雕琢出指甲大小、數億電晶體連結而成的積體電路。作品「光徑」簇立在台灣半導體研究中心；在光與科技交融、於夜幕降臨時，幻化為光性雕塑，啟迪著每一個路過的人。這些如神經元般交織的微連接，築成了通向未來的光徑。它超越有機與無機，模糊象界、擴張感知的疆界，創造無限可能。',
};

export default function WorkPage() {
  useEffect(() => {

  }, []);

  return (
    <div className='relative w-full min-h-lvh h-auto bg-neutral-800'>
      <div className='size-full flex flex-col bg-neutral-950'>

        {/* Image */}
        <div className='relative w-full h-[80lvh]'>
          <img src='/banner-test.png' className='size-full object-cover' />

          <div className='absolute bottom-0 w-full h-20 bg-gradient-to-t from-5% from-neutral-950 via-50% via-neutral-950/70 to-100% to-transparent'></div>
        </div>

        {/* Contents */}
        <div className='relative w-full bg-neutral-950 flex-1 flex flex-col gap-10 items-center mb-[20lvh]'>

          {/* Decorative Elements */}
          <div className='sticky z-50 w-full top-0 left-0 flex items-center justify-center bg-neutral-950 pt-32'>
            <div className='relative h-0.5 w-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
          </div>

          <div className='p-40 flex flex-col gap-16 items-center overflow-hidden'>

            {/* Ellipse */}
            <div className='relative w-fit'>
              <div className='w-120 h-80 bg-transparent border-2 border-white rounded-[50%/50%] shadow-[0_0_48px_16px] shadow-white/25 overflow-hidden'>
                <div className='size-full p-20 flex flex-col gap-4 items-center justify-center'>
                  {/* Title */}
                  <div className='text-5xl text-center font-bold inline-block tracking-[1.5rem] -mr-[1.5rem] whitespace-nowrap'>
                    {testData.title}
                  </div>
                  {/* Year */}
                  <div className='text-base text-center font-bold inline-block tracking-[0.5rem] -mr-[0.5rem] whitespace-nowrap'>
                    {testData.year}
                  </div>
                </div>
              </div>
            </div>


            {/* Info */}
            <div className='border-2 border-white py-10 px-16 rounded-full flex flex-col gap-1 items-baseline text-base text-left tracking-wider whitespace-nowrap'>
              <div className='flex flex-row justify-center'>
                <span className='text-sm mt-px mr-2 w-16'>設置地點: </span>
                <span className='font-bold'>{testData.location}</span>
              </div>
              <div className='flex flex-row justify-center'>
                <span className='text-sm mt-px mr-2 w-16'>媒材: </span>
                <span className='font-bold'>{testData.medium}</span>
              </div>
              <div className='flex flex-row justify-center'>
                <span className='text-sm mt-px mr-2 w-16'>管理單位: </span>
                <span className='font-bold'>{testData.management}</span>
              </div>
            </div>

            {/* Description */}
            <div className='max-w-3xl text-xl font-medium tracking-tighter leading-8 text-center'>
              {testData.description}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
