import { gsap } from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

// Only register plugin on client-side
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useGsap() {
  return {
    gsap,
    ScrollTrigger
  };
}

