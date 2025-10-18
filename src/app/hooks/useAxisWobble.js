'use client';
import { useRef, useEffect, useState } from 'react';
import createPerlinNoise from '@/app/functions/createPerlinNoise';

/**
 * Hook: useAxisWobble
 * 讓軸線角度隨 Perlin Noise 擺動
 * @param {number} baseDeg - 基礎角度
 * @param {number} amplitude - 最大擺動角度（±）
 * @param {number} speed - 擺動速度
 * @returns {number} 動態角度
 */
export default function useAxisWobble(baseDeg = -150, amplitude = 10, speed = 0.1) {
  const noise = useRef(createPerlinNoise());
  const [deg, setDeg] = useState(baseDeg);

  useEffect(() => {
    let t = Math.random() * 1000;
    let frame;

    const animate = () => {
      t += 0.005 * speed;
      const n = noise.current(t) * 0.5 + 0.5; // normalize 0~1
      const delta = (n - 0.5) * 2 * amplitude; // -amplitude ~ +amplitude
      setDeg(baseDeg + delta);
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [baseDeg, amplitude, speed]);

  return deg;
}
