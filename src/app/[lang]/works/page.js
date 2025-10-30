'use client';
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Typewriter from '@/app/components/Typewriter';
import useLocale from '@/app/hooks/useLocale';

export default function WorkPage() {
  const router = useRouter();
  const { currentLocale, localeDict } = useLocale();
  const worksLocale = localeDict.pages.works || {};
  const categoryHeading = worksLocale.categoryHeading || '';
  const categorySubheading = worksLocale.categorySubheading || '';
  const orbitLabels = worksLocale.orbitLabels || {};
  const labelExhibition = orbitLabels.exhibitionSpace || 'Exhibition Space';
  const labelPublic = orbitLabels.publicArt || 'Public Art';

  const worksRef = useRef(null);
  const p5CanvasRef = useRef(null);
  const titleMainRef = useRef(null); // 「作品類別」
  const titleSubRef = useRef(null);  // 「Our Works」

  useEffect(() => {
    let p5Instance;

    if (typeof window === 'undefined' || !p5CanvasRef.current) return;

    const initSketch = async () => {
      try {
        const p5Module = await import('p5');
        const P5 = p5Module.default || p5Module;

        let img1, img2;
        let isReady = false;
        const hoverState = new Map();
        let particles = [];

        const lang = currentLocale || 'zh';
        const url1 = `/${lang}/works/exhibition-space`;
        const url2 = `/${lang}/works/public-art`;
        const imgSlug1 = '/types/exhibition-space_hero.jpg', imgSlug2 = '/types/public-art_hero.jpg';
        let planets = [];
        let frameHover = false;   // 本幀是否有任一行星被 hover
        let canvasEl = null;

        // 兩段動畫狀態
        let phase = 'idle'; // 'idle' | 'ingest' | 'expand'
        let clickStart = 0;
        let clicked = null; // { id, img, startX, startY, startR, url, label }
        let coverR0 = 0;    // expand 起始半徑
        let coverR = 0;     // 當前黑幕半徑

        const sketch = (p) => {
          const hostEl = p5CanvasRef.current; // 透過外層閉包可取到
          const getW = () => (hostEl?.clientWidth ?? window.innerWidth);
          const getH = () => (hostEl?.clientHeight ?? window.innerHeight);

          // 可調參數
          const HOLE_R = 200;
          const ELLIPSE_TILT_1 = 0.55;
          const ELLIPSE_TILT_2 = -0.35;
          const ELLIPSE_ANGLE_1 = -330;
          const ELLIPSE_ANGLE_2 = -20;

          // easing
          const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
          const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
          const clamp01 = (x) => Math.max(0, Math.min(1, x));

          p.setup = () => {
            p.createCanvas(getW(), getH());
            p.noStroke();
            p.frameRate(120);

            canvasEl = p._renderer && p._renderer.canvas ? p._renderer.canvas : null;

            // ——— 手機互動修正：允許滾動與觸控點擊 ———
            if (canvasEl) {
              canvasEl.style.touchAction = 'auto';
            }
            p.touchStarted = () => false;
            p.touchMoved = () => false;
            p.touchEnded = () => false;

            p.textFont('Noto Serif SC, serif');

            p.loadImage(
              imgSlug1,
              (img) => { img1 = img; checkReady(); },
              (err) => console.error('img1 error', err)
            );

            p.loadImage(
              imgSlug2,
              (img) => { img2 = img; checkReady(); },
              (err) => console.error('img2 error', err)
            );
          };

          p.windowResized = () => p.resizeCanvas(getW(), getH());

          const checkReady = () => {
            if (img1 && img2) {
              if (worksRef.current) worksRef.current.style.opacity = 1;
              isReady = true;
            }
          };

          // 橢圓軌道的 3D→2D 投影（X 軸傾斜）＋ stretch 讓手機時更長
          const orbit2D = (cx, cy, r, theta, tiltX, angleDeg, stretch = 1.0) => {
            const angle = p.radians(angleDeg);
            const x0 = r * Math.cos(theta) * stretch;
            const z0 = r * Math.sin(theta);

            const y = -z0 * Math.sin(tiltX);
            const z = -z0 * Math.cos(tiltX);

            const x = x0 * Math.cos(angle) - y * Math.sin(angle);
            const y2 = x0 * Math.sin(angle) + y * Math.cos(angle);

            const zMax = r * Math.cos(tiltX) || 1e-6;
            const zNorm = p.constrain(z / zMax, -1, 1);

            return { x: cx + x, y: cy + y2, z, zNorm };
          };

          // 在中心 #0a0a0a，往外 featherW 漸淡到透明的「暈邊黑圓」
          const drawFeatheredCover = (cx, cy, innerR, featherW) => {
            const ctx = p.drawingContext;
            const R0 = Math.max(0.0, innerR);
            const R1 = Math.max(R0 + Math.max(1.0, featherW), 1.0);

            const c = '10,10,10';
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R1);
            const hardStop = R0 / R1;
            g.addColorStop(0.0, `rgba(${c}, 1.0)`);
            g.addColorStop(Math.min(1, hardStop), `rgba(${c}, 1.0)`);
            g.addColorStop(1.0, `rgba(${c}, 0.0)`);

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, R1, 0, Math.PI * 2);
            ctx.fill();
          };

          // 黑洞漸層
          const drawBlackHole = (cx, cy, holeR, scale = 1.0) => {
            const ctx = p.drawingContext;

            p.push();
            p.translate(cx, cy);
            p.scale(scale);
            p.translate(-cx, -cy);

            const R = holeR * 1;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);

            const threshold = 0.5;
            const alphaAt = (t) => {
              if (t <= threshold) return 1;
              const u = (t - threshold) / (1 - threshold);
              return 0.5 * (1 + Math.cos(Math.PI * u));
            };

            const N = 16;
            for (let i = 0; i <= N; i++) {
              const t = i / N;
              const a = alphaAt(t);
              grad.addColorStop(t, `rgba(0,0,0,${a})`);
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();

            p.pop();
          };

          // 軌道（加入 stretch 與角度偏移）
          const drawOrbit = (cx, cy, r, tilt, angle, stretch = 1.0) => {
            p.push();
            p.noFill();
            p.translate(cx, cy);
            p.rotate(p.radians(angle));

            const orbitW = 2 * r * stretch;
            const orbitH = 2 * r * Math.abs(Math.sin(tilt));
            const steps = 240;

            for (let i = 0; i < steps; i++) {
              const a1 = p.map(i, 0, steps, 0, p.TWO_PI);
              const a2 = p.map(i + 1, 0, steps, 0, p.TWO_PI);
              const x1 = (orbitW / 2) * Math.cos(a1);
              const y1 = (orbitH / 2) * Math.sin(a1);
              const x2 = (orbitW / 2) * Math.cos(a2);
              const y2 = (orbitH / 2) * Math.sin(a2);

              const tt = Math.sin(a1);
              const eased = 0.5 - 0.5 * Math.cos(Math.PI * (tt + 1) / 2);
              const alpha = p.lerp(40, 255, eased);
              p.stroke(180, alpha);
              p.line(x1, y1, x2, y2);
            }
            p.pop();
          };

          // 平面光暈球 + 呼吸 + 環繞字
          const drawImageGlow = (img, x, y, baseR, zNorm, id, labelText, disableHover = false, fade = 1.0) => {
            if (!img || !img.width || !isFinite(x) || !isFinite(y) || !isFinite(baseR) || !isFinite(zNorm)) return;

            const ctx = p.drawingContext;
            const t = p.millis() * 0.001;
            const f = p.constrain(fade ?? 1, 0, 1);

            // 呼吸強弱
            const breatheNoise = p.noise(t * 0.6 + (id === 'planet1' ? 10 : 20));
            const breathe = p.map(breatheNoise, 0, 1, 0.2, 1.3);

            // 用「實際畫出的直徑（不含 hoverScale）」估算 hover 半徑
            const depthScale = p.lerp(0.9, 1.1, (zNorm + 1) / 2);
            const breatheScale = p.lerp(0.85, 1.15, breathe);
            const rBase = p.lerp(baseR * 0.8, baseR * 1.15, (zNorm + 1) / 2);
            let dNoHover = rBase * 2 * depthScale * breatheScale;
            const MAX_DIAMETER = 250;
            if (dNoHover > MAX_DIAMETER) dNoHover = MAX_DIAMETER;
            const effectiveR = dNoHover * 0.5;

            // 命中測試
            const distToMouse = p.dist(p.mouseX, p.mouseY, x, y);
            const isHover = !disableHover && distToMouse < effectiveR * 1.08;
            if (isHover && phase === 'idle') frameHover = true;

            // hover 動畫狀態
            if (!hoverState.has(id)) hoverState.set(id, { hoverAmt: 0 });
            const state = hoverState.get(id);
            const target = isHover ? 1 : 0;
            state.hoverAmt = p.lerp(state.hoverAmt, target, 0.15);
            const tHover = state.hoverAmt;

            const light = p.lerp(255, 160, (zNorm + 1) / 2);

            const targetRadius = 100;
            const hoverScale = p.lerp(1.0, targetRadius / baseR, tHover);
            const hoverGlow = p.lerp(1.0, 1.4, tHover);
            const brightness = p.lerp(1.0, 1.25, tHover);

            // 呼吸
            const breatheGlow = p.lerp(0.8, 1.5, breathe);
            const breatheBright = p.lerp(0.7, 1.4, breathe);

            const BASE_GLOW = 100;
            const glowScale = p.lerp(0.8, 1.2, (zNorm + 1) / 2);
            let glowR = BASE_GLOW * hoverGlow * breatheGlow * glowScale;
            const MAX_GLOW_RADIUS = 200;
            if (glowR > MAX_GLOW_RADIUS) glowR = MAX_GLOW_RADIUS;

            // 柔和光暈
            {
              const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
              const a0 = p.lerp(0.25, 0.45, tHover) * breatheBright * f;
              const a1 = p.lerp(0.18, 0.30, tHover) * breatheBright * f;
              const a2 = p.lerp(0.08, 0.16, tHover) * breatheBright * f;
              const a3 = p.lerp(0.02, 0.06, tHover) * breatheBright * f;

              g.addColorStop(0.0, `rgba(${light},${light},${light},${a0})`);
              g.addColorStop(0.25, `rgba(${light},${light},${light},${a1})`);
              g.addColorStop(0.55, `rgba(${light},${light},${light},${a2})`);
              g.addColorStop(0.85, `rgba(${light},${light},${light},${a3})`);
              g.addColorStop(1.0, `rgba(${light},${light},${light},0)`);
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.arc(x, y, glowR, 0, Math.PI * 2);
              ctx.fill();
            }

            // 星球影像
            p.push();
            p.imageMode(p.CENTER);
            p.translate(x, y);

            const scale = depthScale * hoverScale * breatheScale;
            let d = baseR * 2 * scale;
            if (d > MAX_DIAMETER) d = MAX_DIAMETER;

            p.drawingContext.save();
            p.drawingContext.beginPath();
            p.drawingContext.arc(0, 0, d / 2, 0, Math.PI * 2);
            p.drawingContext.clip();

            ctx.save();
            ctx.globalAlpha *= f;
            ctx.filter = `brightness(${brightness * breatheBright})`;
            p.image(img, 0, 0, d * 1.02, d * 1.02);
            ctx.filter = 'none';
            ctx.restore();

            p.drawingContext.restore();

            // 環繞文字
            const labelR = d * 0.9;
            const baseAngle = -p.HALF_PI;
            const arcSpan = p.PI / 4.5;
            const chars = labelText.split('');
            const rotSpeed = id === 'planet1' ? 0.2 : -0.2;
            const thetaOffset = (p.millis() * 0.001) * rotSpeed;

            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(14 * (d / (baseR * 2)));
            p.fill(255, 240 * f);
            p.noStroke();

            for (let i = 0; i < chars.length; i++) {
              const angle = baseAngle + p.map(i, 0, chars.length - 1, -arcSpan / 2, arcSpan / 2) + thetaOffset;
              const tx = Math.cos(angle) * labelR;
              const ty = Math.sin(angle) * labelR;
              p.push();
              p.translate(tx, ty);
              p.text(chars[i], 0, 0);
              p.pop();
            }

            p.pop();
          };

          // 粒子
          const updateParticles = (cx, cy, baseScale, holeR) => {
            const w = p.width, h = p.height;
            const margin = 50 * baseScale;
            const rate = 0.25;

            const centerKillR = Math.max(4, holeR * baseScale * 0.12);
            const fadeStartR = Math.max(centerKillR * 1.5, holeR * baseScale * 0.55);

            if (p.random() < rate) {
              const startX = p.random(margin, w - margin);
              const startY = p.random(margin, h - margin);
              const dir = p.createVector(cx - startX, cy - startY).normalize();
              const speed = p.random(0.8, 1.8) * baseScale;

              particles.push({
                x: startX,
                y: startY,
                vx: dir.x * speed,
                vy: dir.y * speed,
                life: p.random(220, 500),
                r: p.random(2, 4) * baseScale,
              });

              if (particles.length > 2000) particles.shift();
            }

            for (let i = particles.length - 1; i >= 0; i--) {
              const pt = particles[i];
              pt.x += pt.vx;
              pt.y += pt.vy;
              pt.life -= 1;

              const d = p.dist(pt.x, pt.y, cx, cy);

              if (d <= centerKillR || pt.life <= 0) {
                particles.splice(i, 1);
                continue;
              }

              let alpha = 255;
              if (d < fadeStartR) {
                const u = p.constrain((d - centerKillR) / (fadeStartR - centerKillR), 0, 1);
                alpha = 255 * (0.5 * (1 + Math.cos(Math.PI * (1 - u))));
              }

              const flicker = p.noise(pt.x * 0.05, pt.y * 0.05, p.frameCount * 0.05);
              const brightness = p.map(flicker, 0, 1, 180, 255);

              p.noStroke();
              p.fill(brightness, brightness, brightness, alpha);
              p.ellipse(pt.x, pt.y, pt.r);
            }
          };

          p.draw = () => {
            if (!isReady) return;
            const isMobileScreen = () => (p5CanvasRef.current?.clientWidth ?? window.innerWidth) < 640; // Tailwind 'sm' 未達
            const planetSizeBoost = isMobileScreen() ? 2.0 : 1.0; // 手機放大 35%

            frameHover = false;

            p.background(38, 38, 38);

            const w = getW(), h = getH();
            const baseScale = Math.min(w, h) / 900;
            const t = p.millis() / 1000;
            const cx = w / 2;
            const cy = h / 2 + 40 * baseScale;

            // ——— 手機：旋轉 90°，拉長 ———
            const isMobile = w < 768;
            const angleOffset = isMobile ? 90 : 0;
            const orbitStretch = isMobile ? 1.5 : 1.0;

            // 軌道動態
            const tilt1Dynamic = ELLIPSE_TILT_1 + Math.sin(t / 2) * 0.05;
            const tilt2Dynamic = ELLIPSE_TILT_2 + Math.sin(t / 2 + Math.PI / 3) * 0.05;
            const angle1Dynamic = ELLIPSE_ANGLE_1 + Math.sin(t / 3) * 4;
            const angle2Dynamic = ELLIPSE_ANGLE_2 + Math.sin(t / 3 + Math.PI / 4) * 4;

            const a1 = t * 0.4;
            const a2 = t * 0.3;
            planets = [
              {
                id: 'planet1',
                img: img1,
                pos: orbit2D(cx, cy, 360 * baseScale, a1, tilt1Dynamic, ELLIPSE_ANGLE_1 + angleOffset, orbitStretch),
                r: 40 * baseScale * planetSizeBoost,
                url: url1,
                label: labelExhibition,
              },
              {
                id: 'planet2',
                img: img2,
                pos: orbit2D(cx, cy, 520 * baseScale, a2, -tilt2Dynamic, ELLIPSE_ANGLE_2 + angleOffset, orbitStretch),
                r: 54 * baseScale * planetSizeBoost,
                url: url2,
                label: labelPublic,
              }
            ];

            // 深度排序
            planets.sort((a, b) => a.pos.zNorm - b.pos.zNorm);

            // 軌道
            p.strokeWeight(2);
            drawOrbit(cx, cy, 360 * baseScale, -tilt1Dynamic, ELLIPSE_ANGLE_1 + angleOffset, orbitStretch);
            drawOrbit(cx, cy, 360 * baseScale, tilt1Dynamic, angle1Dynamic + angleOffset, orbitStretch);
            drawOrbit(cx, cy, 520 * baseScale, -tilt2Dynamic, ELLIPSE_ANGLE_2 + angleOffset, orbitStretch);
            drawOrbit(cx, cy, 520 * baseScale, tilt2Dynamic, angle2Dynamic + angleOffset, orbitStretch);

            // 根據階段分支
            if (phase === 'idle') {
              // 遠 → 近
              drawImageGlow(
                planets[0].img, planets[0].pos.x, planets[0].pos.y, planets[0].r, planets[0].pos.zNorm, planets[0].id, planets[0].label
              );

              // 黑洞呼吸 + 粒子
              const pulse = (Math.sin(t * 0.8) + 1) / 2;
              const easePulse = 0.5 - 0.5 * Math.cos(Math.PI * pulse);
              const holeScale = p.lerp(0.9, 1.1, easePulse);
              drawBlackHole(cx, cy, HOLE_R * baseScale, holeScale);
              updateParticles(cx, cy, baseScale, HOLE_R);

              // 近
              drawImageGlow(
                planets[1].img, planets[1].pos.x, planets[1].pos.y, planets[1].r, planets[1].pos.zNorm, planets[1].id, planets[1].label
              );

              if (canvasEl) {
                canvasEl.style.cursor = frameHover ? 'pointer' : 'default';
              }

            } else if (phase === 'ingest') {
              // 未被點擊的星球
              const other = planets.find(pn => pn.id !== clicked.id);
              if (other) {
                drawImageGlow(other.img, other.pos.x, other.pos.y, other.r, other.pos.zNorm, other.id, other.label, /*disableHover*/ true, /*fade*/ 1.0);
              }

              // 黑洞維持呼吸 + 粒子
              const pulse = (Math.sin((p.millis() / 1000) * 0.8) + 1) / 2;
              const easePulse = 0.5 - 0.5 * Math.cos(Math.PI * pulse);
              const holeScale = p.lerp(0.9, 1.1, easePulse);
              drawBlackHole(cx, cy, HOLE_R * baseScale, holeScale);
              updateParticles(cx, cy, baseScale, HOLE_R);

              // 被點擊的星球吸入
              const dur = 800; // ms
              const tt = clamp01((p.millis() - clickStart) / dur);
              const e = easeInOutCubic(tt);

              const ix = p.lerp(clicked.startX, cx, e);
              const iy = p.lerp(clicked.startY, cy, e);
              const SHRINK = 0.18;
              const baseR = p.lerp(clicked.startR, clicked.startR * SHRINK, e);

              drawImageGlow(clicked.img, ix, iy, baseR, 0, clicked.id, clicked.label, true, 1 - e);

              if (tt >= 1) {
                phase = 'expand';
                clickStart = p.millis();
                coverR0 = HOLE_R * baseScale;
                coverR = coverR0;
                titleMainRef.current?.retype?.('', 50);
                titleSubRef.current?.retype?.('', 50);
              }

            } else if (phase === 'expand') {
              // 擴張黑幕覆蓋全畫面
              const maxR = Math.hypot(w, h);
              const dur = 700; // ms
              const tt = clamp01((p.millis() - clickStart) / dur);
              const e = easeOutCubic(tt);

              coverR = p.lerp(coverR0, maxR, e);

              // 底層黑洞
              drawBlackHole(cx, cy, HOLE_R * baseScale, 1.0);

              // 暈邊黑幕
              const FEATHER_MIN = 80 * baseScale;
              const FEATHER_MAX = Math.max(FEATHER_MIN, Math.min(maxR * 0.18, 220 * baseScale));
              const featherW = p.lerp(FEATHER_MIN, FEATHER_MAX, e);
              const innerR = Math.max(0, coverR - featherW);
              drawFeatheredCover(cx, cy, innerR, featherW);

              if (tt >= 1) {
                p.push();
                p.noStroke();
                p.fill('#0a0a0a');
                p.rect(0, 0, w, h);
                p.pop();

                try { p.remove(); } catch { }
                router.push(clicked.url);
              }
            }
          };

          p.mousePressed = () => {
            if (!isReady || !planets.length || phase !== 'idle') return;

            // 以深度排序後的逆序檢查（優先點到「前景」）
            for (let k = planets.length - 1; k >= 0; k--) {
              const planet = planets[k];
              const d = p.dist(p.mouseX, p.mouseY, planet.pos.x, planet.pos.y);
              if (d < planet.r * 1.2) {
                // 進入第一階段：吸入
                phase = 'ingest';
                clickStart = p.millis();
                clicked = {
                  id: planet.id,
                  img: planet.img,
                  startX: planet.pos.x,
                  startY: planet.pos.y,
                  startR: planet.r,
                  url: planet.url,
                  label: planet.label,
                };
                // 視覺層保持
                if (worksRef.current) worksRef.current.style.opacity = 1;
                break;
              }
            }
          };
        };

        if (p5CanvasRef.current) {
          p5Instance = new P5(sketch, p5CanvasRef.current);
        }
      } catch (err) {
        console.error('p5 init error', err);
      }
    };

    const timeout = setTimeout(initSketch, 200);

    return () => {
      clearTimeout(timeout);
      if (p5Instance) {
        try { p5Instance.remove(); } catch { }
      }
    };
  }, [currentLocale, labelExhibition, labelPublic, router]);

  useEffect(() => {
    titleMainRef.current?.reset?.();
    titleSubRef.current?.reset?.();
    titleMainRef.current?.start?.();
    titleSubRef.current?.start?.();
  }, [categoryHeading, categorySubheading]);

  return (
    <div
      ref={worksRef}
      className='relative w-full h-lvh bg-neutral-950 overflow-hidden transition-all ease-in-out duration-500'
      style={{ opacity: 0 }}
    >
      {/* Title */}
      <div className='fixed left-[8%] top-[14%] text-white select-none z-5 text-shadow-white text-shadow-[0_0_40px] pointer-events-none'>
        <div className='text-4xl mb-1 h-10'>
          <Typewriter ref={titleMainRef} speed={240} content={categoryHeading} />
        </div>
        <div className='text-lg text-neutral-400'>
          <Typewriter ref={titleSubRef} speed={200} content={categorySubheading} />
        </div>
      </div>

      {/* 掛載 p5 畫布的容器 */}
      <div ref={p5CanvasRef} className='absolute inset-0 w-[100lvw] h-[100lvh] transition-all ease-in-out duration-600 pointer-events-none' />
    </div>
  );
}
