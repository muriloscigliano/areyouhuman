import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Custom easing function - Material Design curve (0.4, 0.0, 0.2, 1)
// Implements cubic-bezier without needing CustomEase plugin
export const telosEase = (t) => {
  const p1 = 0.4, p2 = 0.0, p3 = 0.2, p4 = 1.0;
  const cx = 3 * p1;
  const bx = 3 * (p3 - p1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p2;
  const by = 3 * (p4 - p2) - cy;
  const ay = 1 - cy - by;
  
  const sampleCurveX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t) => ((ay * t + by) * t + cy) * t;
  
  let t2 = t;
  for (let i = 0; i < 8; i++) {
    const x = sampleCurveX(t2) - t;
    if (Math.abs(x) < 0.001) break;
    const d = (3 * ax * t2 + 2 * bx) * t2 + cx;
    if (Math.abs(d) < 0.000001) break;
    t2 -= x / d;
  }
  
  return sampleCurveY(t2);
};

export function useGsap() {
  return {
    gsap,
    ScrollTrigger,
    telosEase
  };
}

