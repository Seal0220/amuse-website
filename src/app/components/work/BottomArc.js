'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function BottomArc({ lang, prevWork, nextWork, type }) {
  const canvasHostRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    let p5Instance;
    let cleanup;

    (async () => {
      const p5Module = await import('p5');
      const P5 = p5Module.default || p5Module;

      p5Instance = new P5((sk) => {
        let w = 0, h = 0;
        let cx = 0, cy = 0, W = 0, H = 0;
        let pos = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 }, center: { x: 0, y: 0 } };

        // hover 轉場狀態（0→1）
        let hoverAmtL = 0;
        let hoverAmtR = 0;

        // 文字熱區（用於 hover 與點擊）
        const labelBounds = {
          left: { x: 0, y: 0, w: 0, h: 0 },
          right: { x: 0, y: 0, w: 0, h: 0 },
        };

        const atAngle = (t) => sk.lerp(0, sk.PI, t);
        const onEllipse = (theta) => ({
          x: cx + (W / 2) * Math.cos(theta),
          y: cy + (H / 2) * Math.sin(theta),
        });

        const recompute = () => {
          w = Math.max(320, window.innerWidth);
          h = 320;             // 畫布高度
          cx = w / 2;
          const visual = 260;  // 視覺調校
          cy = 0.22 * visual;  // 圓心在上方 → 畫出下弧
          W = w * 1.12;
          H = 2 * (0.9 * visual - cy);

          pos.left = onEllipse(atAngle(0.30));
          pos.center = onEllipse(sk.HALF_PI);
          pos.right = onEllipse(atAngle(0.70));
        };

        const tryDispatchFadeOut = () => {
          try { window.dispatchEvent(new CustomEvent('work:fadeOut')); } catch { }
        };

        const go = (slug) => {
          tryDispatchFadeOut();        // 先淡出
          setTimeout(() => {
            router.push(`/${lang}/works/${type}/${slug}`);
          }, 150);                     // 再導頁，新內容在 Crossfade 中淡入
        };

        const pickTitle = (w) => {
          if (!w) return '';
          const t = w.title;
          if (typeof t === 'string') {
            try {
              const obj = JSON.parse(t);
              if (obj && typeof obj === 'object') return obj.zh || obj.en || Object.values(obj)[0] || (w.slug ?? '');
            } catch {
              return t; // 當作純文字
            }
          }
          if (t && typeof t === 'object') return t.zh || t.en || Object.values(t)[0] || (w.slug ?? '');
          return t ?? (w.slug ?? '');
        };

        const inRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

        sk.setup = () => {
          const cnv = sk.createCanvas(1, 1, sk.P2D);
          const host = canvasHostRef.current;
          if (host) host.innerHTML = '';
          if (host) host.appendChild(cnv.elt);
          recompute();
          sk.resizeCanvas(w, h);
          sk.noFill();
          sk.frameRate(60);
          sk.textFont('system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial');
          sk.textAlign(sk.CENTER, sk.TOP);
        };

        sk.windowResized = () => {
          recompute();
          sk.resizeCanvas(w, h);
        };

        sk.draw = () => {
          sk.clear();

          // 弧線
          sk.stroke(255, 100);
          sk.strokeWeight(1.6);
          sk.noFill();
          sk.arc(cx, cy, W, H, 0, sk.PI);

          // 滑入檢測（球）
          const dL = sk.dist(sk.mouseX, sk.mouseY, pos.left.x, pos.left.y);
          const dR = sk.dist(sk.mouseX, sk.mouseY, pos.right.x, pos.right.y);

          // 先畫（或取得）標籤，計算熱區
          sk.textSize(12);

          const drawLabel = (key, p, text, amt) => {
            if (!text) {
              labelBounds[key].w = 0;
              labelBounds[key].h = 0;
              return;
            }
            const y = p.y + 23;
            const tw = sk.textWidth(text);
            const padX = 6; // 擴大可點擊區域
            const padY = 4;

            // 文字
            const alpha = sk.lerp(160, 255, amt);
            sk.noStroke();
            sk.fill(255, alpha);
            sk.text(text, p.x, y);

            // 記錄熱區（水平置中）
            labelBounds[key] = { x: p.x - tw / 2 - padX, y: y - padY, w: tw + padX * 2, h: 16 + padY * 2 };

            // hover 底線（文字 hover 判定）
            const isHoverText = inRect(sk.mouseX, sk.mouseY, labelBounds[key]);
            if (isHoverText) {
              sk.stroke(255, 220);
              sk.strokeWeight(1);
              const uy = y + 14; // 底線 y
              sk.line(p.x - tw / 2, uy, p.x + tw / 2, uy);
            }
          };

          // 目標 hover（球）/ 文字 hover（加成）
          const textHoverL = prevWork ? inRect(sk.mouseX, sk.mouseY, labelBounds.left) : false;
          const textHoverR = nextWork ? inRect(sk.mouseX, sk.mouseY, labelBounds.right) : false;

          const targetL = prevWork && (dL < 22 || textHoverL) ? 1 : 0;
          const targetR = nextWork && (dR < 22 || textHoverR) ? 1 : 0;

          // 平滑過渡（只放大與變亮，不位移）
          hoverAmtL = sk.lerp(hoverAmtL, targetL, 0.15);
          hoverAmtR = sk.lerp(hoverAmtR, targetR, 0.15);

          // 游標形態（球或文字任一 hover）
          sk.canvas.style.cursor =
            (prevWork && (dL < 22 || textHoverL)) || (nextWork && (dR < 22 || textHoverR))
              ? 'pointer' : 'default';

          // 導航球（放大＋變亮）
          const drawNavBall = (p, amt) => {
            const radius = sk.lerp(24, 30, amt);   // 半徑放大
            const alpha = sk.lerp(100, 220, amt); // 亮度提升
            sk.noStroke();
            sk.fill(255, alpha);
            sk.circle(p.x, p.y, radius);
          };

          // 中央球（脈動發光）
          const drawCenterBall = (p) => {
            sk.noStroke();
            const pulse = sk.map(Math.sin(sk.frameCount * 0.03), -1, 1, 0.6, 1);
            sk.drawingContext.shadowBlur = 90 * pulse;
            sk.drawingContext.shadowColor = `rgba(255,255,255,${0.85 * pulse})`;
            sk.fill(255);
            sk.circle(p.x, p.y, 40);
            sk.drawingContext.shadowBlur = 0;
          };

          // 先畫球，再畫標籤（標籤會用最新 ball 位置計算熱區）
          if (prevWork) drawNavBall(pos.left, hoverAmtL);
          drawCenterBall(pos.center);
          if (nextWork) drawNavBall(pos.right, hoverAmtR);

          if (prevWork) drawLabel('left', pos.left, pickTitle(prevWork), hoverAmtL);
          if (nextWork) drawLabel('right', pos.right, pickTitle(nextWork), hoverAmtR);
        };

        sk.mousePressed = () => {
          const dL = sk.dist(sk.mouseX, sk.mouseY, pos.left.x, pos.left.y);
          const dR = sk.dist(sk.mouseX, sk.mouseY, pos.right.x, pos.right.y);
          const onTextL = inRect(sk.mouseX, sk.mouseY, labelBounds.left);
          const onTextR = inRect(sk.mouseX, sk.mouseY, labelBounds.right);

          if (prevWork && (dL < 22 || onTextL)) go(prevWork.slug);
          else if (nextWork && (dR < 22 || onTextR)) go(nextWork.slug);
        };
      });

      cleanup = () => {
        try { p5Instance?.remove(); } catch { }
      };
    })();

    return () => cleanup?.();
  }, [lang, prevWork?.title, prevWork?.slug, nextWork?.title, nextWork?.slug, router]);

  return (
    <div
      ref={canvasHostRef}
      className='absolute bottom-0 left-0 w-full h-full pointer-events-auto overflow-hidden'
    />
  );
}
