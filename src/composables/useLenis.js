import { gsap } from 'gsap';

let lenis = null;
let isInitialized = false;
let Lenis = null;
let ScrollTrigger = null;

export function useLenis() {
  const initLenis = async () => {
    if (typeof window === 'undefined' || isInitialized) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

    if (isMobile) {
      console.log('Lenis disabled on mobile');
      isInitialized = true;
      return;
    }

    // Lazy load Lenis and ScrollTrigger
    if (!Lenis) {
      const [lenisModule, scrollTriggerModule] = await Promise.all([
        import('lenis'),
        // @ts-ignore
        import('gsap/ScrollTrigger.js')
      ]);
      Lenis = lenisModule.default;
      ScrollTrigger = scrollTriggerModule.default;
      gsap.registerPlugin(ScrollTrigger);
    }

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Connect Lenis to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Use GSAP ticker instead of requestAnimationFrame (more reliable with ScrollTrigger)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

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

