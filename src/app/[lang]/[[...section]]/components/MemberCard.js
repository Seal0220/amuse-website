'use client';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import useLocale from '@/app/hooks/useLocale';
import useWindowWidth from '@/app/hooks/useWindowWidth';

/**
 * MemberCard 元件
 * @param {string} name 成員姓名
 * @param {string} img 成員頭像路徑
 * @param {object} details 詳細資訊（例如 { education: 'xxx', specialty: 'yyy' }）
 * @param {boolean} showDetail 是否顯示詳細資訊
 */
const MemberCard = forwardRef(({ name, img, details }, ref) => {
  const { windowSize, isBelowSize } = useWindowWidth();
  const { currentLocale, localeDict } = useLocale();
  const teamLocale = localeDict.pages.home.team;
  const labels = teamLocale?.labels || {};
  const missing = teamLocale?.missing ?? '—';
  const colon = currentLocale === 'zh' ? '：' : ':';
  const educationLabel = labels.education || 'Education';
  const specialtyLabel = labels.specialty || 'Specialty';
  const educationText = details?.education || missing;
  const specialtyText = details?.specialty || missing;
  const cardRef = useRef(null);
  const [isShowDetail, setIsShowDetail] = useState(false);
  const isMobileShowDetail = isBelowSize('md') && isShowDetail;

  const showDetail = isShowDetail ? 'opacity-100 select-auto pointer-events-auto' : 'opacity-0 select-none pointer-events-auto';

  useImperativeHandle(ref, () => {
    cardRef.current.setIsShowDetail = (v) => setIsShowDetail(v);
    return cardRef.current;
  });


  return (
    <div
      ref={cardRef}
      className={`flex flex-col items-center gap-4 transition-all ease-in-out duration-500 ${isMobileShowDetail ? 'px-2 sm:px-3 md:px-5' : 'px-3 sm:px-10'} lg:px-10 xl:px-20`}
    >
      <img
        src={img}
        alt={name}
        className={`size-16 min-w-16 min-h-16 sm:size-24 sm:min-w-24 sm:min-h-24 lg:size-40 lg:min-w-40 lg:min-h-40 object-cover 
                    rounded-full border-2 border-white outline-2 outline-offset-2 sm:outline-offset-4 md:outline-offset-6 lg:outline-offset-8 
                    shadow-[0_0_64px_8px] shadow-white/20 select-none pointer-events-none 
                    transition-all ease-in-out duration-500
                    ${isMobileShowDetail ? 'rotate-90' : 'rotate-0'}
                    `}
      />

      <div
        className={`absolute top-30 sm:top-48 lg:top-40 mt-4 w-40 h-fit sm:w-60 lg:w-80 lg:h-60 lg:p-4 flex flex-col gap-2 lg:gap-4 items-start lg:items-center 
                    drop-shadow-md drop-shadow-white/70 transition-all ease-in-out duration-500
                    ${isMobileShowDetail ? 'rotate-90' : 'rotate-0'}
                  `}
      >
        <div className={`text-sm sm:text-lg xl:text-xl font-bold text-center transition-all ease-in-out duration-500 ${showDetail}`}>{name}</div>
        <div className={`hidden lg:block h-px w-8 bg-white transition-all ease-in-out duration-600 ${showDetail}`} />
        <div className={`w-full flex flex-col gap-2 text-xs sm:text-lg xl:text-xl text-start lg:text-center transition-all ease-in-out duration-700 ${showDetail}`}>
          <div>{educationLabel}{colon} {educationText}</div>
          <div>{specialtyLabel}{colon} {specialtyText}</div>
        </div>
      </div>
    </div>
  );
});

MemberCard.displayName = 'MemberCard';

export default MemberCard;
