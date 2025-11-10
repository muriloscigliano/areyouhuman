import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;
let isInitialized = false;

export function useLenis() {
  const initLenis = () => {
    if (typeof window === 'undefined' || isInitialized) return;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    if (isMobile) {
      console.log('Lenis disabled on mobile');
      isInitialized = true;
      return;
    }

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time) {
      if (lenis) {
        lenis.raf(time);
      }
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.lagSmoothing(0);

    isInitialized = true;
    console.log('Lenis initialized with ScrollTrigger sync');
  };

  const destroyLenis = () => {
    if (lenis) {
      lenis.destroy();
      lenis = null;
      console.log('Lenis destroyed');
    }
  };

  const scrollTo = (target, options = {}) => {
    if (lenis) {
      lenis.scrollTo(target, options);
    }
  };

  return {
    initLenis,
    destroyLenis,
    scrollTo,
    getLenis: () => lenis
  };
}

