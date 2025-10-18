'use client';
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';


export default function WorkPage() {
  const router = useRouter();

  const worksRef = useRef(null);
  const p5CanvasRef = useRef(null);


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

        const url1 = '/zh/works/exhibition-space', url2 = '/zh/works/public-art';
        let planets = [];


        const sketch = (p) => {
          const getW = () => window.innerWidth;
          const getH = () => window.innerHeight;

          // 可調參數
          const HOLE_R = 200;
          const ELLIPSE_TILT_1 = 0.55;
          const ELLIPSE_TILT_2 = -0.35;
          const ELLIPSE_ANGLE_1 = -330;
          const ELLIPSE_ANGLE_2 = -20;

          p.setup = () => {
            p.createCanvas(getW(), getH()), p.WEBGL;
            p.noStroke();
            p.frameRate(120);

            p.loadImage(
              'http://localhost:4001/members/02.jpg',
              (img) => {
                img1 = img;
                checkReady();
              },
              (err) => console.error('img1 error', err)
            );

            p.loadImage(
              'http://localhost:4001/members/03.jpg',
              (img) => {
                img2 = img;
                checkReady();
              },
              (err) => console.error('img2 error', err)
            );
          };

          p.windowResized = () => p.resizeCanvas(getW(), getH());

          const checkReady = () => {
            if (img1 && img2) {
              worksRef.current.style.opacity = 1;
              isReady = true;
              console.log('✅ all images ready');
            }
          };

          // 橢圓軌道的 3D→2D 投影（X 軸傾斜）
          const orbit2D = (cx, cy, r, theta, tiltX, angleDeg) => {
            const angle = p.radians(angleDeg);
            const x0 = r * Math.cos(theta);
            const z0 = r * Math.sin(theta);

            // 傾斜軸方向反轉，使近處 z 為正
            const y = -z0 * Math.sin(tiltX);
            const z = -z0 * Math.cos(tiltX);

            // 橢圓平面旋轉
            const x = x0 * Math.cos(angle) - y * Math.sin(angle);
            const y2 = x0 * Math.sin(angle) + y * Math.cos(angle);

            const zMax = r * Math.cos(tiltX) || 1e-6;
            const zNorm = p.constrain(z / zMax, -1, 1);

            return { x: cx + x, y: cy + y2, z, zNorm };
          };


          // 黑洞漸層
          const drawBlackHole = (cx, cy, holeR, scale = 1.0) => {
            const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

            p.push();           // 保護座標系
            p.translate(cx, cy);
            p.scale(scale);     // 放大縮小整個黑洞
            p.translate(-cx, -cy);

            for (let i = 0; i <= 220; i++) {
              const t = i / 220;
              const alpha = t < 0.5 ? 255 : 255 * (1 - ease(t));
              p.fill(0, alpha);
              p.ellipse(cx, cy, holeR * 2 * t);
            }

            p.pop();            // 還原變換
          };


          // 軌道繪製（上半透明、下半實）
          const drawOrbit = (cx, cy, r, tilt, angle) => {
            p.push();
            p.noFill();
            p.translate(cx, cy);
            p.rotate(p.radians(angle));

            const orbitW = 2 * r;
            const orbitH = 2 * r * Math.abs(Math.sin(tilt));
            const steps = 240;

            for (let i = 0; i < steps; i++) {
              const a1 = p.map(i, 0, steps, 0, p.TWO_PI);
              const a2 = p.map(i + 1, 0, steps, 0, p.TWO_PI);
              const x1 = (orbitW / 2) * Math.cos(a1);
              const y1 = (orbitH / 2) * Math.sin(a1);
              const x2 = (orbitW / 2) * Math.cos(a2);
              const y2 = (orbitH / 2) * Math.sin(a2);

              const t = Math.sin(a1);
              const eased = 0.5 - 0.5 * Math.cos(Math.PI * (t + 1) / 2);
              const alpha = p.lerp(40, 255, eased);
              p.stroke(180, alpha);
              p.line(x1, y1, x2, y2);
            }
            p.pop();
          };


          // 平面光暈球
          const drawImageGlow = (img, x, y, baseR, zNorm, id) => {
            if (!img || !img.width || !isFinite(x) || !isFinite(y) || !isFinite(baseR) || !isFinite(zNorm)) return;

            const ctx = p.drawingContext;

            // --- hover 偵測（只針對這顆） ---
            const distToMouse = p.dist(p.mouseX, p.mouseY, x, y);
            const isHover = distToMouse < baseR * 1.2;

            // --- cursor 狀態（只在這顆上變 pointer） ---
            if (isHover) p.cursor('pointer');

            // 初始化該顆球的緩動狀態
            if (!hoverState.has(id)) hoverState.set(id, { hoverAmt: 0 });
            const state = hoverState.get(id);

            // 若該顆被 hover → 漸進至 1；否則漸回 0
            const target = isHover ? 1 : 0;
            state.hoverAmt = p.lerp(state.hoverAmt, target, 0.15);
            const tHover = state.hoverAmt;

            // --- 依深度與 hover 變化調整 ---
            const r = p.lerp(baseR * 0.8, baseR * 1.15, (zNorm + 1) / 2);
            const light = p.lerp(255, 160, (zNorm + 1) / 2);

            const targetRadius = 100; // 所有 hover 最終半徑
            const hoverScale = p.lerp(1.0, targetRadius / baseR, tHover);
            const hoverGlow = p.lerp(1.0, 1.4, tHover);
            const brightness = p.lerp(1.0, 1.18, tHover);

            // --- 背後光暈 ---
            const glowR = r * 2.6 * hoverGlow;
            const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
            g.addColorStop(0.0, `rgba(${light},${light},${light},${p.lerp(0.25, 0.45, tHover)})`);
            g.addColorStop(0.3, `rgba(${light},${light},${light},${p.lerp(0.18, 0.35, tHover)})`);
            g.addColorStop(0.6, `rgba(${light},${light},${light},${p.lerp(0.08, 0.18, tHover)})`);
            g.addColorStop(1.0, `rgba(${light},${light},${light},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, glowR, 0, Math.PI * 2);
            ctx.fill();

            // --- 圓形遮罩圖片 ---
            p.push();
            p.imageMode(p.CENTER);
            p.translate(x, y);
            const scale = p.lerp(0.9, 1.1, (zNorm + 1) / 2) * hoverScale;
            const d = r * 2 * scale;

            p.drawingContext.save();
            p.drawingContext.beginPath();
            p.drawingContext.arc(0, 0, d / 2, 0, Math.PI * 2);
            p.drawingContext.clip();

            ctx.filter = `brightness(${brightness})`;
            p.image(img, 0, 0, d * 1.02, d * 1.02);
            ctx.filter = 'none';

            p.drawingContext.restore();
            p.pop();
          };


          const updateParticles = (cx, cy, baseScale, holeR) => {
            // --- 隨機生成新粒子 ---
            if (p.random() < 0.2) { // 控制發射頻率
              // 在黑洞範圍內取一個隨機起點（均勻分佈）
              const angle0 = p.random(p.TWO_PI);
              const radius0 = Math.sqrt(p.random()) * (holeR * baseScale * 0.8); // sqrt 讓分佈均勻於面積
              const startX = cx + radius0 * Math.cos(angle0);
              const startY = cy + radius0 * Math.sin(angle0);

              // 出射方向：朝圓心外放
              const dir = p.createVector(startX - cx, startY - cy).normalize();
              const speed = p.random(0.6, 1.6) * baseScale;

              particles.push({
                x: startX,
                y: startY,
                vx: dir.x * speed,
                vy: dir.y * speed,
                life: p.random(60, 120),
                r: p.random(2, 4) * baseScale,
                alpha: 255,
              });
            }

            // --- 更新與繪製粒子 ---
            for (let i = particles.length - 1; i >= 0; i--) {
              const pt = particles[i];
              pt.x += pt.vx;
              pt.y += pt.vy;
              pt.life -= 1;
              pt.alpha = p.map(pt.life, 0, 120, 0, 255);

              // 微微閃爍
              const flicker = p.noise(pt.x * 0.05, pt.y * 0.05, p.frameCount * 0.05);
              const brightness = p.map(flicker, 0, 1, 180, 255);

              p.noStroke();
              p.fill(brightness, brightness, brightness, pt.alpha);
              p.ellipse(pt.x, pt.y, pt.r);

              if (pt.life <= 0) particles.splice(i, 1);
            }
          };




          p.draw = () => {
            if (!isReady) { return; }
            p.cursor('default');
            p.background(38, 38, 38);

            const w = getW(), h = getH();
            const baseScale = Math.min(w, h) / 900;
            const t = p.millis() / 1000;
            const cx = w / 2;
            const cy = h / 2 + 40 * baseScale;

            // 上下漂浮
            const tilt1Dynamic = ELLIPSE_TILT_1 + Math.sin(t / 2) * 0.05; // 傾斜上下
            const tilt2Dynamic = ELLIPSE_TILT_2 + Math.sin(t / 2 + Math.PI / 3) * 0.05;
            const angle1Dynamic = ELLIPSE_ANGLE_1 + Math.sin(t / 3) * 4;   // 水平擺動（度）
            const angle2Dynamic = ELLIPSE_ANGLE_2 + Math.sin(t / 3 + Math.PI / 4) * 4;

            const a1 = t * 0.4;
            const a2 = t * 0.3;
            planets = [
              {
                id: 'planet1',
                img: img1,
                pos: orbit2D(cx, cy, 360 * baseScale, a1, tilt1Dynamic, ELLIPSE_ANGLE_1),
                r: 40 * baseScale,
                url: url1,
              },
              {
                id: 'planet2',
                img: img2,
                pos: orbit2D(cx, cy, 520 * baseScale, a2, -tilt2Dynamic, ELLIPSE_ANGLE_2),
                r: 54 * baseScale,
                url: url2,
              }
            ];

            // 依 zNorm 排序（遠的先畫）
            planets.sort((a, b) => a.pos.zNorm - b.pos.zNorm);

            // --- 根據深度畫 ---
            p.strokeWeight(2);

            // Orbit 1
            drawOrbit(cx, cy, 360 * baseScale, -tilt1Dynamic, ELLIPSE_ANGLE_1);
            drawOrbit(cx, cy, 360 * baseScale, tilt1Dynamic, angle1Dynamic);
            // Orbit 2
            drawOrbit(cx, cy, 520 * baseScale, -tilt2Dynamic, ELLIPSE_ANGLE_2);
            drawOrbit(cx, cy, 520 * baseScale, tilt2Dynamic, angle2Dynamic);

            // 先畫遠的
            drawImageGlow(planets[0].img, planets[0].pos.x, planets[0].pos.y, planets[0].r, planets[0].pos.zNorm, planets[0].id);

            // 黑洞
            const pulse = (Math.sin(t * 0.8) + 1) / 2;
            const easePulse = 0.5 - 0.5 * Math.cos(Math.PI * pulse);
            const holeScale = p.lerp(0.9, 1.1, easePulse);

            drawBlackHole(cx, cy, HOLE_R * baseScale, holeScale);
            updateParticles(cx, cy, baseScale, HOLE_R);


            // 再畫近的
            drawImageGlow(planets[1].img, planets[1].pos.x, planets[1].pos.y, planets[1].r, planets[1].pos.zNorm, planets[1].id);

          };

          p.mousePressed = () => {
            if (!isReady || !planets.length) return;
            for (const planet of planets) {
              const d = p.dist(p.mouseX, p.mouseY, planet.pos.x, planet.pos.y);
              if (d < planet.r * 1.2) {
                try {
                  // 先淡出畫面
                  if (worksRef.current) {
                    worksRef.current.style.opacity = 0;
                  }

                  // 稍晚再移除畫布（避免瞬間中斷動畫）
                  setTimeout(() => {
                    try {
                      p.remove();
                      router.push(planet.url);
                    } catch { }
                  }, 600);
                } catch { }
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

  }, []);


  return (
    <div ref={worksRef} className='relative w-full h-lvh bg-neutral-800 overflow-hidden transition-all ease-in-out duration-500' style={{ opacity: 0, }}>
      {/* 左上角文字區塊 */}
      <div className='absolute left-[8%] top-[14%] text-white select-none z-[5]'>
        <div className='text-4xl mb-1'>作品類別</div>
        <div className='text-lg text-neutral-400'>Our Works</div>
      </div>

      {/* 掛載 p5 畫布的容器 */}
      <div ref={p5CanvasRef} className='absolute inset-0 transition-all ease-in-out duration-600' />

    </div>
  );
}
