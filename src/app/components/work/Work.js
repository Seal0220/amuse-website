'use client';
import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import ImageSlider from '@/app/components/work/ImageSlider';
import { useRouter, usePathname } from 'next/navigation';
import { IoIosArrowBack } from "react-icons/io";
import Typewriter, { startTypewriter } from '@/app/components/Typewriter';
import useLocale from '@/app/hooks/useLocale';

export default function Work({ lang, work, type }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentLocale, localeDict } = useLocale();
  const workLocale = useMemo(() => localeDict.components.Work || {}, [localeDict]);
  const listText = workLocale.listLabel || 'Project List';
  const typeLabels = workLocale.types || {};
  const labels = workLocale.labels || {};
  const dims = workLocale.dimensions || {};
  const separator = dims.separator || ' × ';
  const aria = workLocale.aria || {};
  const dash = localeDict.pages?.home?.team?.missing || '—';

  const { images, title, year, location, medium, management, description, size = {} } = work || {};
  const activeLang = lang || currentLocale || 'zh';

  // ---------- Typewriter refs ----------
  const backTypeRef = useRef(null);
  const backListRef = useRef(null);

  const titleRef = useRef(null);
  const yearRef = useRef(null);

  const locLabelRef = useRef(null);
  const locValRef = useRef(null);

  const medLabelRef = useRef(null);
  const medValRef = useRef(null);

  const mgmtLabelRef = useRef(null);
  const mgmtValRef = useRef(null);

  const sizeLabelRef = useRef(null);
  const sizeValRef = useRef(null);

  const descRef = useRef(null);
  const descBoxRef = useRef(null);
  const descMeasureRef = useRef(null);
  const [descH, setDescH] = useState(null);

  // ---------- Helpers ----------
  const dashIfEmpty = (v) => (v ? String(v) : dash);

  // ---------- Derived values ----------
  const [typeName, setTypeName] = useState('');

  // 尺寸字串（依照原本顯示邏輯）
  const sizeParts = [
    size.length ? `${dims.length || 'Length'} ${size.length}` : null,
    size.width ? `${dims.width || 'Width'} ${size.width}` : null,
    size.height ? `${dims.height || 'Height'} ${size.height}` : null,
  ].filter(Boolean);
  const sizeText = sizeParts.length ? sizeParts.join(separator) : dash;

  // ---------- Kick animation ----------
  useEffect(() => {
    const match = pathname?.match(/\/works\/(public-art|exhibition-space)(?:\/|$)/);
    const typeSlug = match?.[1] || type || 'public-art';
    setTypeName(typeLabels[typeSlug] || typeLabels[type] || typeSlug);

    startTypewriter(backListRef, 150);

    // 標題與年份
    startTypewriter(titleRef, 250);
    startTypewriter(yearRef, 450);

    // 資訊列（標籤與值交錯進場）
    startTypewriter(locLabelRef, 600);
    startTypewriter(locValRef, 700);

    startTypewriter(medLabelRef, 800);
    startTypewriter(medValRef, 900);

    startTypewriter(mgmtLabelRef, 1000);
    startTypewriter(mgmtValRef, 1100);

    startTypewriter(sizeLabelRef, 1200);
    startTypewriter(sizeValRef, 1300);

    // 描述
    startTypewriter(descRef, 1500);
  }, [pathname, typeLabels, type]);

  useEffect(() => {
    if (typeName && backTypeRef.current) {
      backTypeRef.current.retype(typeName, 40);
    }
  }, [typeName]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!descMeasureRef.current) return;
      // 將完整描述文字塞到隱形量測容器（若你描述是多段，可直接用同一字串）
      descMeasureRef.current.textContent = description || '';
      const h = descMeasureRef.current.scrollHeight;
      // 設定可見容器高度（加一點餘裕防止字型抖動）
      setDescH(Math.ceil(h + 2));
    };

    measure();
    // 視窗尺寸改變時重量
    const ro = new ResizeObserver(measure);
    if (descMeasureRef.current) ro.observe(descMeasureRef.current);
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [description]);

  return (
    <div className='relative w-full min-h-lvh h-auto bg-neutral-800'>
      <div className='size-full flex flex-col bg-neutral-950'>

        {/* 圖片區 */}
        <div className='relative w-full h-[80lvh]'>
          <ImageSlider images={images} />
          <div className='absolute bottom-0 w-full h-20 bg-gradient-to-t from-5% from-neutral-950 via-50% via-neutral-950/70 to-100% to-transparent' />
        </div>

        {/* 主內容 */}
        <div className='relative w-full bg-neutral-950 flex-1 flex flex-col gap-10 items-center'>

          {/* 頂部線 */}
          <div className='sticky z-50 w-full top-0 left-0 flex items-center justify-center bg-neutral-950 pt-32'>
            {/* 返回 */}
            <div
              className='absolute flex flex-row gap-2 items-center bg-neutral-800 z-51 px-4 py-2 rounded-full border-2 border-white/30 mr-[40%] select-none cursor-pointer translate-y-0 hover:-translate-y-1 shadow-[0_0_12px_4px] hover:shadow-[0_0_24px_12px] shadow-white/15 transition-all duration-300 ease-in-out'
              onClick={() => { router.replace(`/${activeLang}/works/${type}`); }}
              aria-label={aria.back || 'Back to project list'}
            >
              <IoIosArrowBack className='mt-0.5' />
              <Typewriter
                ref={backTypeRef}
                speed={40}
                className='font-bold'
                content={typeName}
              />
              <Typewriter
                ref={backListRef}
                speed={40}
                className='text-sm'
                content={listText}
              />
            </div>

            <div className='relative h-0.5 w-full bg-gradient-to-r from-transparent via-white to-transparent' />
          </div>

          <div className='pt-20 flex flex-col gap-16 items-center overflow-visible'>

            {/* 標題橢圓 */}
            <div className='relative w-fit text-shadow-white text-shadow-[0_0_24px]'>
              <div className='w-fit h-fit px-20 bg-transparent border border-l-2 border-r-2 border-white rounded-[50%/50%] shadow-[0_0_48px_16px] shadow-white/25 overflow-hidden'>
                <div className='size-full p-20 flex flex-col gap-4 items-center justify-center'>
                  <div className='text-5xl text-center font-bold inline-block tracking-[1.5rem] -mr-[1.5rem] whitespace-nowrap'>
                    <Typewriter
                      ref={titleRef}
                      speed={40}
                      className=''
                      content={title || ''}
                    />
                  </div>
                  <div className='text-base text-center font-bold inline-block tracking-[0.5rem] -mr-[0.5rem] whitespace-nowrap'>
                    <Typewriter
                      ref={yearRef}
                      speed={50}
                      className=''
                      content={dashIfEmpty(year)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 作品資訊 */}
            <div className='border-l-2 border-r-2 border-white py-10 px-16 rounded-full flex flex-col gap-1 items-baseline text-base text-left tracking-wider whitespace-nowrap'>
              {/* 設置地點 */}
              <div className='flex flex-row justify-center'>
                <Typewriter
                  ref={locLabelRef}
                  speed={40}
                  className='text-xs mt-1 mr-2 w-20'
                  content={labels.location || 'Location:'}
                />
                <Typewriter
                  ref={locValRef}
                  speed={40}
                  className='font-bold'
                  content={dashIfEmpty(location)}
                />
              </div>

              {/* 媒材 */}
              <div className='flex flex-row justify-center'>
                <Typewriter
                  ref={medLabelRef}
                  speed={40}
                  className='text-xs mt-1 mr-2 w-20'
                  content={labels.medium || 'Medium:'}
                />
                <Typewriter
                  ref={medValRef}
                  speed={40}
                  className='font-bold'
                  content={dashIfEmpty(medium)}
                />
              </div>

              {/* 管理單位 */}
              <div className='flex flex-row justify-center'>
                <Typewriter
                  ref={mgmtLabelRef}
                  speed={40}
                  className='text-xs mt-1 mr-2 w-20'
                  content={labels.management || 'Client:'}
                />
                <Typewriter
                  ref={mgmtValRef}
                  speed={40}
                  className='font-bold'
                  content={dashIfEmpty(management)}
                />
              </div>

              {/* 尺寸 */}
              <div className='flex flex-row justify-center'>
                <Typewriter
                  ref={sizeLabelRef}
                  speed={40}
                  className='text-xs mt-1 mr-2 w-20 font-bold'
                  content={labels.size || 'Dimensions (cm):'}
                />
                <Typewriter
                  ref={sizeValRef}
                  speed={40}
                  className='font-bold'
                  content={sizeText}
                />
              </div>
            </div>

            {/* 描述文字（固定高度容器 + 隱形量測） */}
            <div
              ref={descBoxRef}
              className='max-w-3xl text-lg font-medium tracking-wide leading-8 text-left'
              style={{
                height: descH != null ? `${descH}px` : '16rem', // 初始給個保底高度
                overflow: 'hidden',                             // 或想要可滾動就換成 'auto'
                whiteSpace: 'pre-line',
              }}
            >
              <Typewriter
                ref={descRef}
                speed={30}
                className=''
                content={description || ''}
              />
            </div>

            {/* 隱形量測器：樣式需與可見容器內容一致 */}
            <div
              ref={descMeasureRef}
              className='max-w-3xl text-lg font-medium tracking-wide leading-8 whitespace-pre-line pointer-events-none'
              style={{
                position: 'absolute',
                visibility: 'hidden',
                zIndex: -1,
                // 確保同寬度以得到正確高度（與上方一致）
              }}
            />

          </div>
        </div>
      </div>
    </div>
  );
}
