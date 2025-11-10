import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);

// Create custom Telos drawer ease - premium overshoot animation
// The 1.56 on y1 creates a slight overshoot that snaps into place beautifully
CustomEase.create("telos-drawer", "0.34, 1.56, 0.64, 1");

export function useGsap() {
  return {
    gsap,
    ScrollTrigger,
    CustomEase
  };
}

