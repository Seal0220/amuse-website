'use client';
import React, { useEffect, useRef, useState, useLayoutEffect, useMemo } from 'react';
import ImageSlider from '@/app/components/work/ImageSlider';
import { useRouter, usePathname } from 'next/navigation';
import { IoIosArrowBack } from "react-icons/io";
import Typewriter, { startTypewriter } from '@/app/components/Typewriter';
import useLocale from '@/app/hooks/useLocale';
import FadeOut from '../FadeOut';

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

  const { images, title, year, location, medium, management, description, size = {}, children = [] } = work || {};

  // ---------- Typewriter refs ----------
  const fadeOutRef = useRef(null);
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

  const dashIfEmpty = (v) => (v ? String(v) : dash);

  // ---------- Derived values ----------
  const [typeName, setTypeName] = useState('');

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
    startTypewriter(titleRef, 250);
    startTypewriter(yearRef, 450);
    startTypewriter(locLabelRef, 600);
    startTypewriter(locValRef, 700);
    startTypewriter(medLabelRef, 800);
    startTypewriter(medValRef, 900);
    startTypewriter(mgmtLabelRef, 1000);
    startTypewriter(mgmtValRef, 1100);
    startTypewriter(sizeLabelRef, 1200);
    startTypewriter(sizeValRef, 1300);
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
      descMeasureRef.current.textContent = description || '';
      const h = descMeasureRef.current.scrollHeight;
      setDescH(Math.ceil(h + 2));
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (descMeasureRef.current) ro.observe(descMeasureRef.current);
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [description]);

  const backHandler = () => {
    fadeOutRef.current?.onComplete(() => {
      router.replace(`/${currentLocale}/works/${type}`);
    });
    fadeOutRef.current?.start();
  }

  return (
    <div className='relative w-full min-h-lvh h-auto bg-neutral-800 overflow-x-hidden'>
      <div className='size-full flex flex-col bg-neutral-950'>

        {/* 圖片區 */}
        <div className='relative w-full h-[60lvh] sm:h-[80lvh]'>
          <ImageSlider images={images} />
          <div className='absolute bottom-0 w-full h-20 bg-gradient-to-t from-5% from-neutral-950 via-50% via-neutral-950/70 to-100% to-transparent' />
        </div>

        {/* 主內容 */}
        <div className='relative w-full bg-neutral-950 flex-1 flex flex-col gap-10 items-center'>

          {/* 頂部線 + 返回鍵 */}
          <div className='sticky z-50 w-full top-0 left-0 flex items-center justify-center bg-neutral-950 pt-16 sm:pt-32'>
            <div
              className='absolute flex flex-row gap-1 sm:gap-2 items-center bg-neutral-800 z-51 px-3 sm:px-4 py-2 rounded-full border-2 border-white/30 mr-[40%] select-none cursor-pointer hover:-translate-y-1 shadow-[0_0_12px_4px] hover:shadow-[0_0_24px_12px] active:-translate-y-1 active:shadow-[0_0_24px_12px] shadow-white/15 transition-all duration-300 ease-in-out text-xs sm:text-base'
              onClick={backHandler}
              aria-label={aria.back || 'Back to project list'}
            >
              <IoIosArrowBack className='mt-0.5' />
              <Typewriter ref={backTypeRef} speed={40} className='font-bold' content={typeName} />
              <Typewriter ref={backListRef} speed={40} className='text-[0.6rem] sm:text-sm' content={listText} />
            </div>
            <div className='relative h-0.5 w-full bg-gradient-to-r from-transparent via-white to-transparent' />
          </div>

          {/* 主體內容 */}
          <div className='pt-10 sm:pt-20 flex flex-col gap-10 sm:gap-16 items-center px-4 sm:px-0'>

            {/* 標題橢圓 */}
            <div className='relative w-fit text-shadow-white text-shadow-[0_0_24px]'>
              <div className='w-fit h-fit px-8 sm:px-20 bg-transparent border border-l-2 border-r-2 border-white rounded-[50%/50%] shadow-[0_0_48px_16px] shadow-white/25 overflow-hidden'>
                <div className='size-full p-10 sm:p-20 flex flex-col gap-2 sm:gap-4 items-center justify-center'>
                  <div className='text-3xl sm:text-5xl text-center font-bold inline-block tracking-[0.5rem] sm:tracking-[1.5rem] -mr-[0.5rem] sm:-mr-[1.5rem] whitespace-nowrap'>
                    <Typewriter ref={titleRef} speed={40} content={title || ''} />
                  </div>
                  <div className='text-sm sm:text-base text-center font-bold inline-block tracking-[0.25rem] sm:tracking-[0.5rem] -mr-[0.25rem] sm:-mr-[0.5rem] whitespace-nowrap'>
                    <Typewriter ref={yearRef} speed={50} content={dashIfEmpty(year)} />
                  </div>
                </div>
              </div>
            </div>

            {/* 作品資訊 */}
            <div className='border-l-2 border-r-2 min-w-dvw sm:min-w-0 border-white/40 py-6 sm:py-10 px-6 sm:px-16 rounded-full flex flex-col gap-2 sm:gap-1 items-baseline text-sm sm:text-base text-left tracking-wider whitespace-nowrap'>
              {[
                [locLabelRef, locValRef, labels.location || 'Location:', dashIfEmpty(location)],
                [medLabelRef, medValRef, labels.medium || 'Medium:', dashIfEmpty(medium)],
                [mgmtLabelRef, mgmtValRef, labels.management || 'Client:', dashIfEmpty(management)],
                [sizeLabelRef, sizeValRef, labels.size || 'Dimensions (cm):', sizeText],
              ].map(([labelRef, valRef, label, val], i) => (
                <div key={i} className='flex flex-col sm:flex-row gap-0.5 sm:gap-0 justify-center px-14 sm:px-0 min-w-dvw max-w-dvw sm:min-w-0 sm:max-w-none'>
                  <Typewriter ref={labelRef} speed={40} className='text-[10px] sm:text-sm mt-1 mr-2 w-20' content={label} />
                  <Typewriter ref={valRef} speed={40} className='font-bold text-xs sm:text-base' content={val} />
                </div>
              ))}
            </div>

            {/* 描述文字 */}
            <div
              ref={descBoxRef}
              className='max-w-dvw sm:max-w-3xl px-8 sm:px-0 text-base sm:text-lg font-medium tracking-wide leading-7 sm:leading-8 text-left'
              style={{
                height: descH != null ? `${descH}px` : '16rem',
                overflow: 'hidden',
                whiteSpace: 'pre-line',
              }}
            >
              <Typewriter ref={descRef} speed={30} content={description || ''} />
            </div>

            {/* 隱形量測 */}
            <div
              ref={descMeasureRef}
              className='max-w-[90vw] sm:max-w-3xl text-base sm:text-lg font-medium tracking-wide leading-7 sm:leading-8 whitespace-pre-line pointer-events-none'
              style={{ position: 'absolute', visibility: 'hidden', zIndex: -1 }}
            />
          </div>

          {Array.isArray(children) && children.length > 0 && (
            <div className='w-full max-w-5xl px-4 sm:px-0 pb-12 space-y-6'>
              <div className='text-center text-2xl font-semibold tracking-wide text-white/90'>
                {labels.children || 'Sub Works'}
              </div>
              <div className='space-y-8'>
                {children.map((child, idx) => (
                  <div key={child.id ?? idx} className='border border-white/10 rounded-2xl overflow-hidden bg-white/5'>
                    <div className='w-full h-72 sm:h-96 bg-black/50'>
                      <ImageSlider images={child.images || []} />
                    </div>
                    <div className='p-6 sm:p-8 space-y-4 text-white'>
                      <div className='flex flex-wrap items-baseline gap-2'>
                        <div className='text-xl sm:text-2xl font-bold tracking-wide'>{child.title || dash}</div>
                        <div className='text-sm text-white/70'>{child.year || dash}</div>
                      </div>
                      <div className='space-y-1 text-sm sm:text-base'>
                        {[['location', child.location], ['medium', child.medium], ['management', child.management]].map(([k, v]) => (
                          <div key={k} className='flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3'>
                            <span className='text-white/60 min-w-28'>{labels[k] || k}</span>
                            <span className='font-semibold'>{dashIfEmpty(v)}</span>
                          </div>
                        ))}
                        <div className='flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3'>
                          <span className='text-white/60 min-w-28'>{labels.size || 'Dimensions (cm):'}</span>
                          <span className='font-semibold'>{(() => {
                            const childSizeParts = [
                              child?.size?.length ? `${dims.length || 'Length'} ${child.size.length}` : null,
                              child?.size?.width ? `${dims.width || 'Width'} ${child.size.width}` : null,
                              child?.size?.height ? `${dims.height || 'Height'} ${child.size.height}` : null,
                            ].filter(Boolean);
                            return childSizeParts.length ? childSizeParts.join(separator) : dash;
                          })()}</span>
                        </div>
                      </div>
                      {child.description && (
                        <div className='pt-2 text-sm sm:text-base whitespace-pre-line leading-7 text-white/90'>
                          {child.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <FadeOut ref={fadeOutRef} />
    </div>
  );
}
