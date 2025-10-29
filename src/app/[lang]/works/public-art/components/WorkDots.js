'use client';
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { deg2rad, normRad, nearestAngle } from '@/app/functions/utils';
import { useRouter } from 'next/navigation';

// 在點上定位：點本身做 rotate + translate；子元素以 --dot-rotate 抵銷旋轉
const setDotAtAngle = (dot, angleRad, radiusPx) => {
  // 主體：旋轉到角度並位移
  dot.style.transform =
    `translate(-50%, -50%) rotate(${angleRad}rad) translate(${radiusPx}px, 0)`;

  // 供子元素抵銷父旋轉
  dot.style.setProperty('--dot-rotate', `${-angleRad}rad`);

  // label 位置（抵銷旋轉 + 下移）
  const label = dot.label;
  if (label) {
    label.style.transform = `translate(-50%, -50%) rotate(var(--dot-rotate)) translate(0, 50px)`;
  }

  // 圖片內層（抵銷旋轉）
  const inner = dot.inner;
  if (inner) {
    inner.style.transform = `rotate(var(--dot-rotate))`;
  }
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

// 取作品標題（title 可能是字串或 {zh,en} JSON 字串/物件）
const pickTitle = (work, lang = 'zh') => {
  if (!work) return '';
  const t = work.title;
  if (typeof t === 'string') {
    try {
      const obj = JSON.parse(t);
      if (obj && typeof obj === 'object') return obj[lang] || obj.zh || obj.en || Object.values(obj)[0] || (work.slug ?? '');
      return t;
    } catch {
      return t;
    }
  }
  if (t && typeof t === 'object') return t[lang] || t.zh || t.en || Object.values(t)[0] || (work.slug ?? '');
  return t ?? (work.slug ?? '');
};

const WorkDots = forwardRef(function WorkDots(
  {
    lang = 'zh',
    years,
    ringRefs,          // ref array: 每圈 ring 的 DOM
    isYear,            // (y) => boolean
    diamAt,            // (i) => diameter px
    basicAxisDeg,      // 中心軸角度
    baseSize = 10,     // 白點基礎尺寸 px
    largeSize = 64,    // 白點放大尺寸 px
    ringGroupRef,
    edgeMarginDeg = 10,
    gapPx = 40,
    centerVoidHalfDeg = 5,
    keepCenter = false,
    hoverSize = 40,
    worksByYear = [],  // [[{slug,title,images}, ...], ...]，索引與 years 一致（非 CENTER）
    labelOffset = 18,  // 文字相對點中心的向下位移（px）
  },
  apiRef
) {
  const workDotsGroupRef = useRef([]);
  const handlersRef = useRef([]);
  const router = useRouter();

  useEffect(() => {
    // 清掉舊點
    ringRefs.current.forEach((r) => {
      const ringNode = r?.current;
      if (!ringNode) return;
      ringNode.querySelectorAll('[data-work-dot="1"]').forEach((n) => n.remove());
    });
    workDotsGroupRef.current = [];
    handlersRef.current = [];

    const allYears = years.filter(isYear);
    const nRings = allYears.length;

    ringRefs.current.forEach((r, i) => {
      const ringNode = r?.current;
      const y = years[i];
      if (!ringNode || !isYear(y)) {
        workDotsGroupRef.current[i] = [];
        handlersRef.current[i] = [];
        return;
      }
      const radius = diamAt(i) / 2;

      // 可分佈扇區
      const rankAmongYears = years.slice(0, i + 1).filter(isYear).length - 1;
      const d = (nRings - 1) - rankAmongYears;
      const totalSpanDegRaw = 360 - (360 / nRings) * d;
      const totalSpanDeg = Math.max(0, totalSpanDegRaw - 2 * edgeMarginDeg);
      const halfSpan = deg2rad(totalSpanDeg / 2);
      const centerRad = normRad(deg2rad(basicAxisDeg));
      const minRad = centerRad - halfSpan;
      const maxRad = centerRad + halfSpan;

      // 本圈實際作品
      const works = worksByYear[i] || [];
      const dotsCount = Math.max(0, works.length);

      const dots = [];
      const handlers = [];
      for (let j = 0; j < dotsCount; j++) {
        const work = works[j];
        const href = work?.slug ? `/${lang}/works/public-art/${encodeURIComponent(work.slug)}` : null;
        const labelText = pickTitle(work, lang);
        const img = work?.images?.[0] || '';

        const angle = minRad + Math.random() * (maxRad - minRad);

        // ====== dot（父） ======
        const dot = document.createElement('div');
        dot.className = 'absolute rounded-full bg-white pointer-events-none transition-all duration-400 ease-in-out';
        dot.style.width = `${baseSize}px`;
        dot.style.height = `${baseSize}px`;
        dot.style.left = '50%';
        dot.style.top = '50%';
        dot.style.willChange = 'transform,width,height';
        dot.style.filter = 'drop-shadow(0 0 12px rgba(255,255,255,0.7))';
        dot.style.pointerEvents = 'auto';  // 需要 hover 與 click
        dot.style.cursor = 'default';
        dot.tabIndex = 0;

        dot.dataset.workDot = '1';
        dot.dataset.radius = String(radius);
        dot.dataset.baseAngle = String(angle);
        dot.dataset.curAngle = String(angle);
        dot.dataset.baseSize = String(baseSize);
        dot.dataset.state = 'inactive'; // active/inactive
        dot.dataset.hover = '0';        // 0/1
        if (href) dot.dataset.href = href;
        if (img) dot.dataset.img = img;

        // ====== inner（子，專放圖片，抵銷旋轉） ======
        const inner = document.createElement('div');
        inner.className = 'absolute inset-0 rounded-full pointer-events-none transition-all duration-400 will-change-opacity';
        inner.style.transform = 'rotate(var(--dot-rotate))';
        inner.style.backgroundSize = 'cover';
        inner.style.backgroundPosition = 'center';
        inner.style.backgroundRepeat = 'no-repeat';
        inner.style.opacity = '0';
        dot.appendChild(inner);
        dot.inner = inner;

        // ====== label（子） ======
        const label = document.createElement('span');
        label.textContent = labelText || '';
        label.className =
          `absolute text-white/80 text-xs whitespace-nowrap select-none pointer-events-none 
          opacity-0 transition-all duration-300`;
        label.style.left = '50%';
        label.style.top = '50%';
        label.style.textShadow = '0 0 8px rgba(255,255,255,0.5)';

        dot.appendChild(label);
        dot.label = label;

        // 定位（點與其子元素）
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
          if (isActive && dot.label) dot.label.style.opacity = '1'; // hover 時若 active，維持亮
        };
        const onLeave = () => {
          dot.dataset.hover = '0';
          const isActive = dot.dataset.state === 'active';
          const base = isActive ? largeSize : Number(dot.dataset.baseSize || `${baseSize}`);
          dot.style.width = `${base}px`;
          dot.style.height = `${base}px`;
          if (dot.label) dot.label.style.opacity = isActive ? '1' : '0'; // 跟著 active 走
        };
        const triggerClick = () => {
          if (dot.dataset.state !== 'active') return; // 未放大不跳轉
          const to = dot.dataset.href;
          if (to) {
            try { router.push(to); } catch (_) { }
          }
        };
        const onClick = (e) => { e.preventDefault(); triggerClick(); };
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

    // 清理
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
  }, [lang, years.length, JSON.stringify(worksByYear)]);

  // 更新每圈的點狀態
  useImperativeHandle(apiRef, () => ({
    updateRing(i, { atCrestWindow, radius: radiusOverride }) {
      const workDots = workDotsGroupRef.current[i];
      if (!workDots || !workDots.length) return;

      const parsed = Number(workDots[0]?.dataset.radius ?? '0');
      const radius = (radiusOverride ?? (Number.isFinite(parsed) ? parsed : 0));

      // ====== 放大年份軌道階段 ======
      if (atCrestWindow) {
        layoutDots(workDots, radius, basicAxisDeg, gapPx, {
          centerVoidHalfDeg,
          keepCenter,
        });

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
          dot.style.transition = 'all 0.5s ease';

          // === 圖片淡入到 inner ===
          const imgUrl = dot.dataset.img || '';
          const inner = dot.inner;
          if (inner) {
            if (imgUrl) {
              inner.style.backgroundImage = `url("${imgUrl}")`;
              requestAnimationFrame(() => { inner.style.opacity = '1'; });
            } else {
              inner.style.opacity = '0';
              inner.style.backgroundImage = 'none';
            }
          }

          if (dot.label) dot.label.style.opacity = '1';
        });
      }

      // ====== 離開年份軌道階段 ======
      else {
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
          dot.style.transition = 'all 0.5s ease';

          // === 圖片淡出（inner 清空） ===
          const inner = dot.inner;
          if (inner) {
            const clearBg = () => {
              // 只在真的透明時清空，避免中途又被啟用
              if (getComputedStyle(inner).opacity === '0') {
                inner.style.backgroundImage = 'none';
              }
            };
            inner.addEventListener('transitionend', clearBg, { once: true });
            inner.style.opacity = '0';
          }

          if (dot.label) dot.label.style.opacity = '0';
        });
      }
    }
  }), [basicAxisDeg, gapPx, centerVoidHalfDeg, keepCenter, baseSize, largeSize, hoverSize, labelOffset]);

  return null; // 純管理者，不渲染 UI
});

export default WorkDots;
