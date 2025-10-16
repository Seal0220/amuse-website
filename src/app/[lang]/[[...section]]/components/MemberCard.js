'use client';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

/**
 * MemberCard 元件
 * @param {string} name 成員姓名
 * @param {string} img 成員頭像路徑
 * @param {object} details 詳細資訊（例如 { education: 'xxx', specialty: 'yyy' }）
 * @param {boolean} showDetail 是否顯示詳細資訊
 */
const MemberCard = forwardRef(({ name, img, details }, ref) => {
  const cardRef = useRef(null);
  const [isShowDetail, setIsShowDetail] = useState(false);

  const showDetail = isShowDetail ? 'opacity-100 select-auto pointer-events-auto' : 'opacity-0 select-none pointer-events-auto';

  useImperativeHandle(ref, () => {
    cardRef.current.setIsShowDetail = (v) => setIsShowDetail(v);
    return cardRef.current;
  });

  return (
    <div
      ref={cardRef}
      className='flex flex-col items-center gap-4 transition-all ease-in-out duration-500'
    >
      <img
        src={img}
        alt={name}
        className='size-40 min-w-40 min-h-40 object-cover rounded-full border-2 border-white outline-2 outline-offset-8 shadow-[0_0_64px_8px] shadow-white/20 select-none pointer-events-none transition-all ease-in-out duration-500'
      />

      <div className={`absolute top-40 mt-4 w-80 h-60 p-4 flex flex-col gap-4 items-center drop-shadow-md drop-shadow-white/70 transition-all ease-in-out duration-500`}>
        <div className={`text-xl font-bold text-center transition-all ease-in-out duration-500 ${showDetail}`}>{name}</div>
        <div className={`h-px w-8 bg-white transition-all ease-in-out duration-600 ${showDetail}`} />
        <div className={`w-full flex flex-col gap-2 text-center transition-all ease-in-out duration-700 ${showDetail}`}>
          <div>學歷：{details?.education || '—'}</div>
          <div>專長：{details?.specialty || '—'}</div>
        </div>
      </div>
    </div>
  );
});

export default MemberCard;
