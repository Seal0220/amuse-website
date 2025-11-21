'use client';

import React, {
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import useWindowWidth from '@/app/hooks/useWindowWidth';

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const strSeed = (s) => {
  let h = 2166136261;
  for (let i = 0; i < (s || '').length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h);
};

const CANVAS_PADDING = 60;

export default function Planet({ work, index = 0, onClick }) {
  const { isBelowSize } = useWindowWidth();
  const canvasParentRef = useRef(null);

  const hoverRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => setIsLoaded(true), []);

  const seed = strSeed(work.slug || `${index}`);
  const random = mulberry32(seed);

  const base =
    isBelowSize('sm') ? 180
      : isBelowSize('md') ? 220
        : isBelowSize('lg') ? 260
          : isBelowSize('xl') ? 300
            : 340;

  const planet = useMemo(() => {
    const size = base + Math.floor(random() * 40) - 20;
    const diskRadius = size * 0.45;

    let displayTitle = work.slug;
    try {
      const t = JSON.parse(work.title || '{}');
      displayTitle = t['zh-tw'] || t.zh || t.en || work.slug;
    } catch {
      displayTitle = work.title || work.slug;
    }

    return {
      size,
      diskRadius,
      displayTitle,
      year: work.year,
    };
  }, [work, index, base]);

  const handleClick = useCallback(() => {
      onClick?.(work.slug);
  }, [onClick, work.slug]);

  // 命中測試：滑鼠是否在球內
  const isPointInDisk = useCallback(
    (clientX, clientY) => {
      const el = canvasParentRef.current;
      if (!el) return false;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distanceSq = dx * dx + dy * dy;

      const baseSize = planet.size + CANVAS_PADDING;
      const scaleFactor = baseSize > 0 ? rect.width / baseSize : 1;
      const radius = planet.diskRadius * scaleFactor;

      return distanceSq <= radius * radius;
    },
    [planet.size, planet.diskRadius],
  );

  const handleMouseMove = useCallback(
    (e) => {
      const inside = isPointInDisk(e.clientX, e.clientY);
      hoverRef.current = inside;
      setIsHovered((prev) => (prev === inside ? prev : inside));
    },
    [isPointInDisk],
  );

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = false;
    setIsHovered(false);
  }, []);

  const handleMouseUp = useCallback(
    (e) => {
      if (isPointInDisk(e.clientX, e.clientY)) {
        handleClick();
      }
    },
    [isPointInDisk, handleClick],
  );

  useEffect(() => {
    let p5Instance = null;
    let cancelled = false;
    const padding = CANVAS_PADDING;
    let planetTexture = null;
    const orbitBalls = [], numBalls = 3;
    let orbitTiltEase = 0;

    const init = async () => {
      if (!canvasParentRef.current) return;
      const P5 = (await import('p5')).default;

      const sketch = (p) => {
        // 初始化 orbitBalls 資料
        for (let i = 0; i < numBalls; i++) {
          orbitBalls.push({
            phase: random() * p.TWO_PI,
            speed: 0.2 + random() * 0.6,
            size: 7 + random() * 10,
            radiusScale: 0.9 + random() * 0.2,
          });
        }

        // 角度在 [30,60] ∪ [120,150] 的 helper
        const randomAngleDeg = () => {
          const r = random();
          const span = 30;
          if (r < 0.5) {
            const t = random();
            return 30 + t * span;
          } else {
            const t = random();
            return 120 + t * span;
          }
        };

        // 只算一次，這顆星球固定的傾角
        const angleXDeg = randomAngleDeg();
        const angleYDeg = randomAngleDeg();

        const createSquareTexture = (img, size) => {
          const pg = p.createGraphics(size, size);
          pg.background(0, 0);

          const imgAspect = img.width / img.height;
          let drawW, drawH, drawX, drawY;

          if (imgAspect > 1) {
            // 寬圖：以高為基準
            drawH = size;
            drawW = size * imgAspect;
            drawY = 0;
            drawX = (size - drawW) / 2;
          } else {
            // 窄圖：以寬為基準
            drawW = size;
            drawH = size / imgAspect;
            drawX = 0;
            drawY = (size - drawH) / 2;
          }

          pg.image(img, drawX, drawY, drawW, drawH);
          return pg;
        };

        // 中央主球（貼圖 + 邊）
        const drawDisk = (radius, detail) => {
          p.push();
          p.noStroke();
          p.textureMode(p.NORMAL);

          if (planetTexture) {
            p.texture(planetTexture);
          } else {
            p.fill(120);
          }

          p.beginShape(p.TRIANGLE_FAN);
          p.vertex(0, 0, 0, 0.5, 0.5);
          for (let i = 0; i <= detail; i++) {
            const a = (i / detail) * p.TWO_PI;
            const x = p.cos(a) * radius;
            const y = p.sin(a) * radius;
            const u = 0.5 + p.cos(a) * 0.5;
            const v = 0.5 + p.sin(a) * 0.5;
            p.vertex(x, y, 0, u, v);
          }
          p.endShape();
          p.pop();

          // 邊線
          p.push();
          p.noFill();
          p.stroke(200, 90);
          p.beginShape();
          for (let i = 0; i <= detail; i++) {
            const a = (i / detail) * p.TWO_PI;
            const x = p.cos(a) * radius;
            const y = p.sin(a) * radius;
            p.vertex(x, y, 0);
          }
          p.endShape(p.CLOSE);
          p.pop();
        };

        // 環
        const drawRing = (radius, detail) => {
          p.beginShape();
          for (let i = 0; i <= detail; i++) {
            const a = (i / detail) * p.TWO_PI;
            const x = p.cos(a) * radius;
            const y = p.sin(a) * radius;
            p.vertex(x, y, 0);
          }
          p.endShape(p.CLOSE);
        };

        // 環上的小球
        const drawOrbitBalls = (radius, t) => {
          p.noFill();
          p.stroke(255);

          for (const ball of orbitBalls) {
            const a = t * ball.speed + ball.phase;
            const r = radius * ball.radiusScale;

            const x = p.cos(a) * r;
            const y = p.sin(a) * r;

            p.push();
            p.translate(x, y, 0);
            p.strokeWeight(ball.size);
            p.point(0, 0);
            p.pop();
          }
        };

        p.setup = () => {
          p.createCanvas(
            planet.size + padding,
            planet.size + padding,
            p.WEBGL,
          );
          p.frameRate(60);

          if (work.images[0]) {
            p.loadImage(
              work.images[0],
              (img) => {
                const textureSize = planet.size * 2 || 500;
                planetTexture = createSquareTexture(img, textureSize);
              },
              (err) => console.error('planetImage error', err)
            );
          }
        };

        p.draw = () => {
          p.clear();

          // 主球
          drawDisk(planet.diskRadius, 120);

          // hover 傾角 easing
          const isHovering = hoverRef.current;
          const target = isHovering ? 1 : 0;
          orbitTiltEase = p.lerp(orbitTiltEase, target, 0.12);

          const maxTiltRad = p.radians(20);
          const tiltOffset = maxTiltRad * orbitTiltEase;

          // 微微左右傾
          const t = p.millis() * 0.001;
          const swayX = p.radians(8) * Math.sin(t * 0.5);
          const swayY = p.radians(6) * Math.sin(t * 0.7 + 1.3);

          // 環 + 小球
          p.push();
          p.rotateX(p.radians(angleXDeg) + swayX + tiltOffset);
          p.rotateY(p.radians(angleYDeg) + swayY + tiltOffset);

          p.noFill();
          p.stroke(255);

          p.strokeWeight(1);
          drawRing(planet.size * 0.51, 120);

          p.strokeWeight(2);
          drawRing(planet.size * 0.54, 120);

          p.strokeWeight(1);
          drawRing(planet.size * 0.57, 120);

          // 小球沿著中間那條環跑
          drawOrbitBalls(planet.size * 0.54, t);

          p.pop();
        };

      };

      if (!cancelled) {
        p5Instance = new P5(sketch, canvasParentRef.current);
      }
    };

    if (typeof window !== 'undefined') {
      init();
    }

    return () => {
      cancelled = true;
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, [planet.size, planet.diskRadius]);

  const outerSize = planet.size + CANVAS_PADDING;

  return (
    <div
      className={
        'relative select-none transition-all ease-in-out duration-500 ' +
        (isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90')
      }
      style={{ width: outerSize, height: outerSize }}
    >
      <div
        ref={canvasParentRef}
        className={
          'w-full h-full transition-transform duration-300 ease-out ' +
          (isHovered ? 'cursor-pointer scale-110' : 'cursor-default scale-100')
        }
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
      />

      <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 text-center text-white/90 pointer-events-none">
        <div className="text-sm font-medium tracking-wide">
          {planet.displayTitle}
        </div>
        <div className="text-xs text-white/60">
          {planet.year}
        </div>
      </div>
    </div>
  );
}
