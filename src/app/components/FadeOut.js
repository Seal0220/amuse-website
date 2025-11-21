'use client';
import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';

const FadeOut = forwardRef(function FadeOut(
  {
    duration = 500,       // 動畫時間（ms），要跟 className 的 duration 對齊
    onComplete,           // 可選：也可以用 props 傳 callback
  },
  ref
) {
  const overlayRef = useRef(null);
  const timeoutRef = useRef(null);
  const completeRef = useRef(onComplete || (() => { }));

  // 若外面用 props.onComplete，維持最新版本
  useEffect(() => {
    if (typeof onComplete === 'function') {
      completeRef.current = onComplete;
    }
  }, [onComplete]);

  // 對外暴露的方法
  useImperativeHandle(ref, () => ({
    start() {
      const el = overlayRef.current;
      if (!el) return;

      // 先清掉舊的 timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // 觸發 CSS transition
      el.style.opacity = '1';
      el.style.width = '200vw';
      el.style.height = '200lvh';

      // 動畫結束後呼叫 callback
      timeoutRef.current = setTimeout(() => {
        completeRef.current?.();
      }, duration);
    },

    onComplete(cb) {
      if (typeof cb === 'function') {
        completeRef.current = cb;
      } else {
        completeRef.current = () => { };
      }
    },
  }));

  // 清理 timer
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className={`
        fixed z-5000
        left-1/2 top-1/2
        -translate-x-1/2 -translate-y-1/2
        bg-neutral-950 rounded-full
        w-0 h-0 opacity-0
        pointer-events-none
        shadow-[0_0_64px_32px_rgba(0,0,0,1)]
        transition-all duration-500 ease-out
      `}
    />
  );
});

export default FadeOut;
