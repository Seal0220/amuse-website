'use client';
import ImageSlider from '@/app/components/work/ImageSlider';

export default function Work({ lang, work, prevWork, nextWork }) {
  const { images, title, year, location, medium, management, description, size = {} } = work;

  return (
    <div className='relative w-full min-h-lvh h-auto bg-neutral-800'>
      <div className='size-full flex flex-col bg-neutral-950'>

        {/* 圖片區 */}
        <div className='relative w-full h-[80lvh]'>
          <ImageSlider images={images} />
          <div className='absolute bottom-0 w-full h-20 bg-gradient-to-t from-5% from-neutral-950 via-50% via-neutral-950/70 to-100% to-transparent'></div>
        </div>

        {/* 主內容 */}
        <div className='relative w-full bg-neutral-950 flex-1 flex flex-col gap-10 items-center'>
          {/* 頂部線 */}
          <div className='sticky z-50 w-full top-0 left-0 flex items-center justify-center bg-neutral-950 pt-32'>
            <div className='relative h-0.5 w-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
          </div>

          <div className='pt-20 flex flex-col gap-16 items-center overflow-visible'>
            {/* 標題橢圓 */}
            <div className='relative w-fit text-shadow-white text-shadow-[0_0_24px]'>
              <div className='w-fit h-fit px-20 bg-transparent border border-l-2 border-r-2 border-white rounded-[50%/50%] shadow-[0_0_48px_16px] shadow-white/25 overflow-hidden'>
                <div className='size-full p-20 flex flex-col gap-4 items-center justify-center'>
                  <div className='text-5xl text-center font-bold inline-block tracking-[1.5rem] -mr-[1.5rem] whitespace-nowrap'>
                    {title}
                  </div>
                  <div className='text-base text-center font-bold inline-block tracking-[0.5rem] -mr-[0.5rem] whitespace-nowrap'>
                    {year}
                  </div>
                </div>
              </div>
            </div>

            {/* 作品資訊 */}
            <div className='border-l-2 border-r-2 border-white py-10 px-16 rounded-full flex flex-col gap-1 items-baseline text-base text-left tracking-wider whitespace-nowrap'>
              <div className='flex flex-row justify-center'>
                <span className='text-xs mt-1 mr-2 w-20'>設置地點:</span>
                <span className='font-bold'>{location || '—'}</span>
              </div>
              <div className='flex flex-row justify-center'>
                <span className='text-xs mt-1 mr-2 w-20'>媒材:</span>
                <span className='font-bold'>{medium || '—'}</span>
              </div>
              <div className='flex flex-row justify-center'>
                <span className='text-xs mt-1 mr-2 w-20'>管理單位:</span>
                <span className='font-bold'>{management || '—'}</span>
              </div>
              <div className='flex flex-row justify-center'>
                <span className='text-xs mt-1 mr-2 w-20 font-bold'>尺寸 (cm):</span>
                {!size.width && !size.height && !size.depth ? (
                  '—'
                ) : (
                  <span className='font-bold'>
                    {size.length && `長 ${size.length}`} ×{' '}
                    {size.width && `寬 ${size.width} `} ×{' '}
                    {size.height && `高 ${size.height} `}
                  </span>
                )}
              </div>
            </div>

            {/* 描述文字 */}
            <div className='max-w-3xl text-lg font-medium tracking-wide leading-8 text-left whitespace-pre-line'>
              {description || ''}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}