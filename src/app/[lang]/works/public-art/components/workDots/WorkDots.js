'use client';
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { deg2rad, normRad, nearestAngle } from '@/app/functions/utils';
import { useRouter } from 'next/navigation';

// ==== 小工具 ====
const setDotAtAngle = (dot, angleRad, radiusPx) => {
  dot.style.transform =
    `translate(-50%, -50%) rotate(${angleRad}rad) translate(${radiusPx}px, 0)`;
};

// 等弧長佈點（固定 gapPx），且「靠中線第一對」對中線也保留等弧長（=gapPx）
function layoutDots(
  dots,
  radius,
  centerDeg,
  gapPx,
  {
    centerVoidHalfDeg = 0,
    keepCenter = false,
    minGapPx = 0,
    maxGapPx = Infinity,
  } = {}
) {
  const n = dots.length;
  const r = Math.max(1, radius);

  const gapPxClamped = Math.min(Math.max(gapPx, minGapPx), maxGapPx);
  const gapDeg = Math.min((gapPxClamped / r) * (180 / Math.PI), 179);
  const g = deg2rad(gapDeg);

  const pad = deg2rad(Math.max(0, centerVoidHalfDeg));
  const c = normRad(deg2rad(centerDeg));

  const slots = [];
  if (keepCenter && (n % 2 === 1)) slots.push(c);

  const pairs = keepCenter && (n % 2 === 1) ? Math.floor((n - 1) / 2) : Math.floor(n / 2);
  const startOff = pad + g;
  for (let k = 0; k < pairs; k++) {
    const off = startOff + k * g;
    slots.push(c - off);
    slots.push(c + off);
  }
  if (!keepCenter && (n % 2 === 1) && slots.length < n) {
    const extraOff = startOff + pairs * g;
    slots.push(c + extraOff);
  }

  const indexed = dots
    .map((dot) => ({ dot, ang: parseFloat(dot.dataset.curAngle || dot.dataset.baseAngle || '0') }))
    .sort((a, b) => a.ang - b.ang);
  const orderedSlots = slots.slice().sort((a, b) => a - b);

  while (orderedSlots.length < n) {
    const last = orderedSlots[orderedSlots.length - 1] ?? c;
    orderedSlots.push(last + g);
  }

  for (let i = 0; i < n; i++) {
    const { dot, ang: cur } = indexed[i];
    const target = nearestAngle(cur, orderedSlots[i]);
    dot.dataset.curAngle = String(target);
    setDotAtAngle(dot, target, r);
  }
}

/**
 * WorkDots
 * - 建立各圈紅點（初始隨機角度，受 basicAxisDeg 與圈寬/邊緣內縮限制）
 * - 對外暴露 updateRing(i, { atCrestWindow, radius })：在動畫迴圈裡呼叫，命中時重排，離開時還原
 */
const WorkDots = forwardRef(function WorkDots(
  {
    years,
    ringRefs,          // ref array: 每圈 ring 的 DOM
    isYear,            // (y) => boolean
    diamAt,            // (i) => diameter px
    basicAxisDeg,      // 中心軸角度
    baseSize = 10,     // 紅點基礎尺寸 px
    largeSize = 64,    // 紅點放大尺寸 px
    ringGroupRef,
    dotsPerRing = 10,
    edgeMarginDeg = 10,
    gapPx = 40,
    centerVoidHalfDeg = 5,
    keepCenter = false,
    hoverSize = 40,
    href = '/zh/works/public-art/test',         // 目標路由（同分頁跳轉）
  },
  apiRef
) {
  const workDotsGroupRef = useRef([]);
  const handlersRef = useRef([]);
  const router = useRouter();

  // 初始化：在每個年份圈掛上紅點（以弧形 transform 定位）
  useEffect(() => {
    // 先清掉上一輪可能殘留的點，避免重複生成
    ringRefs.current.forEach((r) => {
      const ringNode = r?.current;
      if (!ringNode) return;
      ringNode.querySelectorAll('[data-work-dot="1"]').forEach((n) => n.remove());
    });
    workDotsGroupRef.current = [];
    handlersRef.current = [];

    const nRings = years.length - 1; // 不含 CENTER
    ringRefs.current.forEach((r, i) => {
      const ringNode = r?.current;
      const y = years[i];
      if (!ringNode || !isYear(y)) {
        workDotsGroupRef.current[i] = [];
        handlersRef.current[i] = [];
        return;
      }
      const radius = diamAt(i) / 2;

      // 可分佈扇區：以 basicAxisDeg 為中心，不同圈寬 + 邊緣內縮
      const d = (nRings - 1) - i;
      const totalSpanDegRaw = 360 - (360 / nRings) * d;
      const totalSpanDeg = Math.max(0, totalSpanDegRaw - 2 * edgeMarginDeg);
      const halfSpan = deg2rad(totalSpanDeg / 2);
      const centerRad = normRad(deg2rad(basicAxisDeg));
      const minRad = centerRad - halfSpan;
      const maxRad = centerRad + halfSpan;

      const dots = [];
      const handlers = [];
      for (let j = 0; j < dotsPerRing; j++) {
        const angle = minRad + Math.random() * (maxRad - minRad);
        const dot = document.createElement('div');
        dot.className = 'absolute rounded-full bg-white pointer-events-none transition-all duration-400 ease-in-out';
        dot.style.width = `${baseSize}px`;
        dot.style.height = `${baseSize}px`;
        dot.style.left = '50%';
        dot.style.top = '50%';
        dot.style.willChange = 'transform,width,height';
        dot.style.filter = 'drop-shadow(0 0 12px rgba(255,255,255,0.7))';

        // 互動：為了 hover，需要接收事件；點擊是否生效由 state 判斷
        dot.style.pointerEvents = 'auto';   // 覆蓋 class 的 pointer-events-none，讓 hover 可用
        dot.style.cursor = 'default';       // 只有 active 時改成 pointer
        dot.tabIndex = 0;

        dot.dataset.workDot = '1';
        dot.dataset.radius = String(radius);
        dot.dataset.baseAngle = String(angle);
        dot.dataset.curAngle = String(angle);
        dot.dataset.baseSize = String(baseSize);
        dot.dataset.state = 'inactive'; // active/inactive
        dot.dataset.hover = '0';        // 0/1

        setDotAtAngle(dot, angle, radius);
        ringNode.appendChild(dot);
        dots.push(dot);

        // 事件：hover / leave / click / keyboard
        const onEnter = () => {
          dot.dataset.hover = '1';
          const isActive = dot.dataset.state === 'active';
          const base = isActive ? largeSize : Number(dot.dataset.baseSize || `${baseSize}`);
          const targetSize = base + hoverSize;
          dot.style.width = `${targetSize}px`;
          dot.style.height = `${targetSize}px`;
        };
        const onLeave = () => {
          dot.dataset.hover = '0';
          const isActive = dot.dataset.state === 'active';
          const base = isActive ? largeSize : Number(dot.dataset.baseSize || `${baseSize}`);
          dot.style.width = `${base}px`;
          dot.style.height = `${base}px`;
        };

        // 僅在 active（放大）時才允許路由跳轉
        const triggerClick = () => {
          if (dot.dataset.state !== 'active') return; // 未放大：直接忽略
          if (href) {
            try { router.push(href); } catch (_) {}
          }
        };
        const onClick = (e) => {
          e.preventDefault();
          triggerClick();
        };
        const onKeyDown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerClick();
          }
        };

        dot.addEventListener('mouseenter', onEnter);
        dot.addEventListener('mouseleave', onLeave);
        dot.addEventListener('click', onClick);
        dot.addEventListener('keydown', onKeyDown);
        handlers.push({ onEnter, onLeave, onClick, onKeyDown });
      }

      workDotsGroupRef.current[i] = dots;
      handlersRef.current[i] = handlers;
    });

    // 清理：移除所有建立的 dots 與事件
    return () => {
      ringRefs.current.forEach((r, i) => {
        const ringNode = r?.current;
        if (!ringNode) return;
        const group = workDotsGroupRef.current[i] || [];
        const handlers = handlersRef.current[i] || [];
        group.forEach((dot, idx) => {
          const h = handlers[idx];
          if (h) {
            dot.removeEventListener('mouseenter', h.onEnter);
            dot.removeEventListener('mouseleave', h.onLeave);
            dot.removeEventListener('click', h.onClick);
            dot.removeEventListener('keydown', h.onKeyDown);
          }
          if (dot && dot.parentNode === ringNode) ringNode.removeChild(dot);
        });
      });
      workDotsGroupRef.current = [];
      handlersRef.current = [];
    };
  }, [years.length]); // 年份數量改變才重建；其餘參數在 updateRing 使用

  // 暴露：每幀對「第 i 圈」做更新（命中則重排，否則沿弧回初始）
  useImperativeHandle(apiRef, () => ({
    updateRing(i, { atCrestWindow, radius: radiusOverride }) {
      const workDots = workDotsGroupRef.current[i];
      if (!workDots || !workDots.length) return;

      // 避免 ?? 與 || 混用，順帶處理 NaN
      const parsed = Number(workDots[0]?.dataset.radius ?? '0');
      const radius = (radiusOverride ?? (Number.isFinite(parsed) ? parsed : 0));

      if (atCrestWindow) {
        // 先依規則重排角度（等弧長 + 中線等弧長一次）
        layoutDots(workDots, radius, basicAxisDeg, gapPx, {
          centerVoidHalfDeg,
          keepCenter,
        });

        // 放大（active），允許點擊，游標顯示 pointer
        workDots.forEach(dot => {
          const ang = parseFloat(dot.dataset.curAngle || dot.dataset.baseAngle || '0');
          setDotAtAngle(dot, ang, radius);

          dot.dataset.state = 'active';
          const hovered = dot.dataset.hover === '1';
          const size = hovered ? (largeSize + hoverSize) : largeSize;

          dot.style.width = `${size}px`;
          dot.style.height = `${size}px`;
          dot.style.filter = 'drop-shadow(0 0 32px rgba(255,255,255,0.9))';
          dot.style.cursor = 'pointer';
        });
      } else {
        // 縮回（inactive），點擊無效，游標恢復 default
        workDots.forEach((dot) => {
          const baseA = parseFloat(dot.dataset.baseAngle || '0');
          const curA = parseFloat(dot.dataset.curAngle || String(baseA));
          const tgt = nearestAngle(curA, baseA);
          dot.dataset.curAngle = String(tgt);
          setDotAtAngle(dot, tgt, radius);

          dot.dataset.state = 'inactive';
          const baseSz = Number(dot.dataset.baseSize || String(baseSize));
          const hovered = dot.dataset.hover === '1';
          const size = hovered ? (baseSz + hoverSize) : baseSz;

          dot.style.width = `${size}px`;
          dot.style.height = `${size}px`;
          dot.style.filter = 'drop-shadow(0 0 12px rgba(255,255,255,0.7))';
          dot.style.cursor = 'default';
        });
      }
    }
  }), [basicAxisDeg, gapPx, centerVoidHalfDeg, keepCenter, href, baseSize, largeSize, hoverSize]);

  return null; // 純管理者，不渲染 UI
});

export default WorkDots;
