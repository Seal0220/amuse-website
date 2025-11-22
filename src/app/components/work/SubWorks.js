'use client'
import { useMemo, useState } from "react";
import useLocale from "@/app/hooks/useLocale";
import ImageSlider from "./ImageSlider";

import { IoIosArrowDown } from "react-icons/io";


export default function SubWorks({ children }) {
  const { currentLocale, localeDict } = useLocale();
  const workLocale = useMemo(() => localeDict.components.Work || {}, [localeDict]);
  const listText = workLocale.listLabel || 'Project List';
  const labels = workLocale.labels || {};
  const dims = workLocale.dimensions || {};
  const separator = dims.separator || ' × ';
  const aria = workLocale.aria || {};
  const dash = localeDict.pages?.home?.team?.missing || '—';

  const [openChildId, setOpenChildId] = useState(null);

  const toggleChild = (id) => {
    setOpenChildId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {
        Array.isArray(children) && children.length > 0 && (
          <div className='flex flex-col gap-2 max-w-dvw w-6xl justify-center pb-16 px-0 sm:px-4 md:px-8'>
            {/* <div className='text-xs sm:text-sm tracking-[0.3em] uppercase text-white/60 mb-1'>
              {childHeading}
            </div> */}

            <div className='w-full px-4 sm:px-0 flex flex-col gap-px bg-gradient-to-r from-5% from-transparent via-50% via-white/40 to-95% to-transparent'>
              {children.map((child) => {
                const isOpen = openChildId === child.id;

                return (
                  <div
                    key={child.id}
                    className={`bg-neutral-950 transition-all duration-400 ease-in-out ${isOpen ? 'p-8' : ''}`}
                  >
                    <div className={`transition-all duration-500 border-neutral-600/80 ${isOpen ? 'p-4 bg-neutral-900/20 rounded-2xl border shadow-[0_0_48px_4px] shadow-neutral-600/25' : 'border-0'}`}>
                      {/* border-neutral-600/80 ${isOpen ? 'rounded-2xl border shadow-[0_0_48px_4px] shadow-neutral-600/25' : 'border-0'} */}
                      {/* Header */}
                      <button
                        type='button'
                        onClick={() => toggleChild(child.id)}
                        className={`
                            w-full flex items-center justify-between hover:bg-white/8 active:bg-white/8 transition-all duration-200 ease-in-out text-left cursor-pointer border-neutral-600/80 
                            ${isOpen ? 'rounded-2xl border bg-neutral-800/50 px-6 md:px-10 py-5 md:py-6 mb-4 shadow-[0_0_12px_2px] shadow-neutral-600/25' : 'border-0 px-4 md:px-6 py-3 md:py-4'}
                          `}
                      >
                        <div className='flex flex-col gap-1'>
                          <div className='text-xs sm:text-sm text-white/60 tracking-[0.2em] uppercase'>
                            {child.year || dash}
                          </div>
                          <div className='text-sm sm:text-lg font-semibold tracking-wide'>
                            {child.title || dash}
                          </div>
                        </div>
                        <IoIosArrowDown
                          className={`text-lg sm:text-xl transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                        />
                      </button>

                      {/* Body */}
                      <div
                        className={`
                          flex flex-col gap-4 sm:flex-row
                          transition-all duration-400 ease-in-out overflow-hidden
                          ${isOpen ? 'max-h-[200lvh] opacity-100' : 'max-h-0 opacity-0'}
                        `}
                      >
                        {/* 縮圖 */}
                        <div
                          className={`
                            relative min-w-full sm:min-w-auto aspect-square size-full sm:size-50 md:size-60 lg:size-80 bg-neutral-800 transition-all overflow-hidden
                          border-neutral-600/80 rounded-2xl border
                          `}
                        >
                          <ImageSlider images={child.images} />
                        </div>

                        {/* 文字 */}
                        <div className='flex-1 pb-8 text-xs sm:text-sm leading-6 text-white/90'>
                          {/* 基本資訊 */}
                          <div className={`space-y-1 mb-6 px-4 py-3 md:px-8 md:py-6 w-full sm:w-fit max-w-full bg-neutral-800/50 border-neutral-600/80 rounded-2xl border`}>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center sm:gap-2'>
                              <span className='shrink-0 text-white/50 sm:w-24'>
                                {labels.location || 'Location'}
                              </span>
                              <span className='font-medium whitespace-pre-line'>
                                {child.location || dash}
                              </span>
                            </div>

                            <div className='flex flex-col sm:flex-row items-start sm:items-center sm:gap-2'>
                              <span className='shrink-0 text-white/50 sm:w-24'>
                                {labels.medium || 'Medium'}
                              </span>
                              <span className='font-medium whitespace-pre-line'>
                                {child.medium || dash}
                              </span>
                            </div>

                            <div className='flex flex-col sm:flex-row items-start sm:items-center sm:gap-2'>
                              <span className='shrink-0 text-white/50 sm:w-24'>
                                {labels.management || 'Client'}
                              </span>
                              <span className='font-medium whitespace-pre-line'>
                                {child.management || dash}
                              </span>
                            </div>

                            <div className='flex flex-col sm:flex-row items-start sm:items-center sm:gap-2'>
                              <span className='shrink-0 text-white/50 sm:w-24'>
                                {labels.size || 'Dimensions (cm)'}
                              </span>
                              <span className='font-medium whitespace-pre-line'>
                                {(() => {
                                  const s = child.size || {};
                                  const parts = [
                                    s.length ? `${dims.length || 'Length'} ${s.length}` : null,
                                    s.width ? `${dims.width || 'Width'} ${s.width}` : null,
                                    s.height ? `${dims.height || 'Height'} ${s.height}` : null,
                                  ].filter(Boolean);
                                  return parts.length ? parts.join(separator) : dash;
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* 描述 */}
                          <div className='whitespace-pre-line'>
                            {child.description || dash}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      }
    </>
  );
}