import { gsap } from 'gsap';

let ScrollTrigger = null;
let scrollTriggerPromise = null;

// Lazy load ScrollTrigger only when needed
async function loadScrollTrigger() {
  if (ScrollTrigger) {
    return ScrollTrigger;
  }

  if (scrollTriggerPromise) {
    return scrollTriggerPromise;
  }

  scrollTriggerPromise = import('gsap/ScrollTrigger').then((module) => {
    ScrollTrigger = module.default;
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
    return ScrollTrigger;
  });

  return scrollTriggerPromise;
}

export function useGsap() {
  return {
    gsap,
    ScrollTrigger: null, // Will be null until loaded
    loadScrollTrigger
  };
}

