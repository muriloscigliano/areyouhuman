<template>
  <section ref="heroSectionRef" class="hero-section" data-name="Hero Section">
    <!-- Using global starfield from index.astro - no embedded starfield needed -->

    <!-- Noise overlay for film grain effect -->
    <!-- <div class="noise-overlay"></div> -->

    <header class="hero-header" data-name="Header">
      <p 
        ref="logoRef"
        class="logo"
        @mouseenter="handleLogoHover"
      >
        <span
          v-for="(char, index) in logoChars"
          :key="`logo-${logoKey}-${index}`"
          :ref="el => { if (el) logoCharRefs[index] = el as HTMLElement }"
          class="logo-char"
          :class="{ 'logo-space': char === ' ' }"
        >{{ char === ' ' ? '\u00A0' : char }}</span>
      </p>
      <nav class="nav" ref="navRef">
        <p 
          v-for="(item, index) in navItems"
          :key="index"
          :ref="el => { if (el) navItemRefs[index] = el as HTMLElement }"
          class="nav-item"
        >{{ item }}</p>
      </nav>
    </header>
    
    <div class="hero-content">
      <h1 class="hero-title">
        <span 
          ref="stayTitleRef"
          class="title-fixed"
        >
          <span
            v-for="(char, index) in stayChars"
            :key="`stay-${stayKey}-${index}`"
            :ref="el => { if (el) stayCharRefs[index] = el as HTMLElement }"
            class="title-char"
            :class="{ 'title-space': char === ' ' }"
          >{{ char === ' ' ? '\u00A0' : char }}</span>
        </span>
        <span 
          ref="dynamicTitleRef"
          class="title-dynamic"
        >
          <span
            v-for="(char, index) in dynamicTitleChars"
            :key="`${titleKey}-${index}`"
            :ref="el => { if (el) titleCharRefs[index] = el as HTMLElement }"
            class="title-char"
            :class="{ 'title-space': char === ' ' }"
          >{{ char === ' ' ? '\u00A0' : char }}</span>
        </span>
      </h1>
      <div class="hero-buttons">
        <button class="btn-secondary" @click="openModal">
          <span ref="btnSecondaryTextRef" class="btn-text">
            <span
              v-for="(char, index) in btnSecondaryChars"
              :key="`btn-secondary-${btnSecondaryKey}-${index}`"
              :ref="el => { if (el) btnSecondaryCharRefs[index] = el as HTMLElement }"
              class="btn-char"
              :class="{ 'btn-space': char === ' ' }"
            >{{ char === ' ' ? '\u00A0' : char }}</span>
          </span>
        </button>
      </div>
    </div>
    
    <p 
      ref="taglineRef"
      class="hero-tagline"
    >
      <span
        v-for="(char, index) in taglineChars"
        :key="`tagline-${taglineKey}-${index}`"
        :ref="el => { if (el) taglineCharRefs[index] = el as HTMLElement }"
        class="tagline-char"
        :class="{ 'tagline-space': char === ' ' }"
      >{{ char === ' ' ? '\u00A0' : char }}</span>
    </p>

  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import { useContactModal } from '../composables/useContactModal';

// ScrollTrigger for exit animation
let ScrollTrigger: any = null;
let heroExitTrigger: any = null;

// No embedded starfield - using global one from index.astro

const heroSectionRef = ref<HTMLElement | null>(null);
const logoRef = ref<HTMLElement | null>(null);
const logoChars = ref('Are You Human?'.split(''));
const logoCharRefs = ref<(HTMLElement | null)[]>([]);
const logoKey = ref(Date.now());

const navRef = ref<HTMLElement | null>(null);
const navItems = ['Services', 'Solutions', 'Framework', 'Contact'];
const navItemRefs = ref<(HTMLElement | null)[]>([]);

const stayTitleRef = ref<HTMLElement | null>(null);
const stayChars = ref('Stay'.split(''));
const stayCharRefs = ref<(HTMLElement | null)[]>([]);
const stayKey = ref(Date.now());

const dynamicTitleRef = ref<HTMLElement | null>(null);
const dynamicTitleChars = ref('Human'.split(''));
const titleCharRefs = ref<(HTMLElement | null)[]>([]);
const titleKey = ref(Date.now());

const taglineRef = ref<HTMLElement | null>(null);
const taglineChars = ref('The AI studio that helps leaders win with AI. Without losing what makes them irreplaceable'.split(''));
const taglineCharRefs = ref<(HTMLElement | null)[]>([]);
const taglineKey = ref(Date.now());

const btnSecondaryTextRef = ref<HTMLElement | null>(null);
const btnSecondaryChars = ref('Talk to an Expert'.split(''));
const btnSecondaryCharRefs = ref<(HTMLElement | null)[]>([]);
const btnSecondaryKey = ref(Date.now());

const { open: openModal } = useContactModal();

const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const scrambleIntervals = new Map<HTMLElement, NodeJS.Timeout>();

let titleCycleInterval: NodeJS.Timeout | null = null;
let isTitleTransitioning = false;
const titleTexts = ['Human', 'Ahead'];
let currentTitleIndex = 0;

function scrambleText(element: HTMLElement, finalText: string, duration: number = 800, onComplete?: () => void) {
  if (!element) return;

  if (scrambleIntervals.has(element)) {
    clearInterval(scrambleIntervals.get(element)!);
    scrambleIntervals.delete(element);
  }

  const originalText = finalText;
  const textLength = originalText.length;
  
  if (textLength === 1) {
    const char = originalText[0];
    if (char === ' ' || char === '.' || char === ',' || char === '?' || char === '!' || char === "'") {
      element.textContent = char;
      if (onComplete) onComplete();
      return;
    }
    
    let frame = 0;
    const totalFrames = Math.max(5, duration / 30);
    
    const interval = setInterval(() => {
      if (frame < totalFrames - 1) {
        element.textContent = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      } else {
        element.textContent = originalText;
        clearInterval(interval);
        scrambleIntervals.delete(element);
        if (onComplete) onComplete();
      }
      frame++;
    }, 30);
    
    scrambleIntervals.set(element, interval);
    return;
  }

  let frame = 0;
  const totalFrames = Math.ceil(duration / 30);

  const interval = setInterval(() => {
    const progress = Math.min(frame / totalFrames, 1.0);
    let scrambledText = '';

    for (let i = 0; i < textLength; i++) {
      if (originalText[i] === ' ') {
        scrambledText += ' ';
      } else if (originalText[i] === '.' || originalText[i] === ',' || originalText[i] === '?' || originalText[i] === '!' || originalText[i] === "'") {
        if (progress > i / textLength) {
          scrambledText += originalText[i];
        } else {
          scrambledText += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        }
      } else if (progress > i / textLength) {
        scrambledText += originalText[i];
      } else {
        scrambledText += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      }
    }

    element.textContent = scrambledText;
    frame++;

    if (frame >= totalFrames) {
      clearInterval(interval);
      scrambleIntervals.delete(element);
      element.textContent = originalText;
      if (onComplete) onComplete();
    }
  }, 30);
  
  scrambleIntervals.set(element, interval);
}

function animateLogo() {
  if (!logoRef.value) return;

  nextTick(() => {
    const processChars = (retryCount = 0) => {
      const allReady = logoChars.value.every((char, index) => {
        return logoCharRefs.value[index] !== undefined && logoCharRefs.value[index] !== null;
      });

      if (allReady || retryCount >= 5) {
        gsap.set(logoCharRefs.value, {
          opacity: 0,
          filter: 'blur(10px)'
        });

        gsap.to(logoCharRefs.value, {
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.6,
          ease: 'power2.out',
          stagger: {
            each: 0.02,
            from: 'start'
          }
        });

        logoCharRefs.value.forEach((charEl, index) => {
          if (charEl && index < logoChars.value.length) {
            const char = logoChars.value[index];
            if (char !== ' ') {
              scrambleText(charEl, char, 600);
            } else {
              charEl.textContent = '\u00A0';
            }
          }
        });
      } else {
        setTimeout(() => processChars(retryCount + 1), 50);
      }
    };

    processChars();
  });
}

function handleLogoHover() {
  logoCharRefs.value.forEach((charEl, index) => {
    if (charEl && index < logoChars.value.length) {
      const char = logoChars.value[index];
      if (char !== ' ') {
        scrambleText(charEl, char, 400);
      }
    }
  });
}

function updateTitleWithScramble(newText: string) {
  if (isTitleTransitioning || !dynamicTitleRef.value) return;
  
  isTitleTransitioning = true;
  
  titleCharRefs.value.forEach((charEl) => {
    if (charEl && scrambleIntervals.has(charEl)) {
      clearInterval(scrambleIntervals.get(charEl)!);
      scrambleIntervals.delete(charEl);
    }
  });

  gsap.killTweensOf(titleCharRefs.value);

  if (titleCharRefs.value.length > 0) {
    gsap.to(titleCharRefs.value, {
      opacity: 0,
      x: 100,
      filter: 'blur(60px)',
      duration: 0.6,
      ease: 'power3.out',
      stagger: {
        each: 0.06,
        from: 'start'
      },
      onComplete: () => {
        dynamicTitleChars.value = newText.split('');
        titleKey.value = Date.now();
        titleCharRefs.value = [];

        nextTick(() => {
          setTimeout(() => {
            const processChars = (retryCount = 0) => {
              const allReady = dynamicTitleChars.value.every((char, index) => {
                return titleCharRefs.value[index] !== undefined && titleCharRefs.value[index] !== null;
              });

              if (allReady || retryCount >= 5) {
                gsap.set(titleCharRefs.value.slice(0, newText.length), {
                  opacity: 0,
                  x: -100,
                  filter: 'blur(60px)',
                  visibility: 'visible',
                  display: 'inline-block'
                });

                gsap.to(titleCharRefs.value.slice(0, newText.length), {
                  opacity: 1,
                  x: 0,
                  filter: 'blur(0px)',
                  duration: 1.0,
                  ease: 'power3.out',
                  stagger: {
                    each: 0.06,
                    from: 'start'
                  },
                  onComplete: () => {
                    isTitleTransitioning = false;
                  }
                });
              } else {
                setTimeout(() => processChars(retryCount + 1), 50);
              }
            };

            processChars();
          }, 50);
        });
      }
    });
  } else {
    dynamicTitleChars.value = newText.split('');
    titleKey.value = Date.now();
    titleCharRefs.value = [];
    isTitleTransitioning = false;
  }
}

function animateStay() {
  if (!stayTitleRef.value) return;

  nextTick(() => {
    const processChars = (retryCount = 0) => {
      const allReady = stayChars.value.every((char, index) => {
        return stayCharRefs.value[index] !== undefined && stayCharRefs.value[index] !== null;
      });

      if (allReady || retryCount >= 5) {
        gsap.set(stayCharRefs.value.slice(0, stayChars.value.length), {
          opacity: 0,
          x: -100,
          filter: 'blur(60px)',
          visibility: 'visible',
          display: 'inline-block'
        });

        gsap.to(stayCharRefs.value.slice(0, stayChars.value.length), {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 1.0,
          ease: 'power3.out',
          stagger: {
            each: 0.06,
            from: 'start'
          }
        });
      } else {
        setTimeout(() => processChars(retryCount + 1), 50);
      }
    };

    processChars();
  });
}

function initTitleAnimation() {
  if (!dynamicTitleRef.value) return;

  nextTick(() => {
    const processChars = (retryCount = 0) => {
      const allReady = dynamicTitleChars.value.every((char, index) => {
        return titleCharRefs.value[index] !== undefined && titleCharRefs.value[index] !== null;
      });

      if (allReady || retryCount >= 5) {
        gsap.set(titleCharRefs.value.slice(0, dynamicTitleChars.value.length), {
          opacity: 0,
          x: -100,
          filter: 'blur(60px)',
          visibility: 'visible',
          display: 'inline-block'
        });

        gsap.to(titleCharRefs.value.slice(0, dynamicTitleChars.value.length), {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 1.0,
          ease: 'power3.out',
          stagger: {
            each: 0.06,
            from: 'start'
          }
        });
      } else {
        setTimeout(() => processChars(retryCount + 1), 50);
      }
    };

    processChars();
  });
}

function startTitleCycle() {
  const cycleDuration = 3000;
  
  titleCycleInterval = setInterval(() => {
    if (!isTitleTransitioning) {
      currentTitleIndex = (currentTitleIndex + 1) % titleTexts.length;
      updateTitleWithScramble(titleTexts[currentTitleIndex]);
    }
  }, cycleDuration);
}

function animateTagline() {
  if (!taglineRef.value) return;

  nextTick(() => {
    const processChars = (retryCount = 0) => {
      const allReady = taglineChars.value.every((char, index) => {
        return taglineCharRefs.value[index] !== undefined && taglineCharRefs.value[index] !== null;
      });

      if (allReady || retryCount >= 5) {
        gsap.set(taglineCharRefs.value, {
          opacity: 0,
          y: 10,
          filter: 'blur(10px)'
        });

        gsap.to(taglineCharRefs.value, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.5,
          ease: 'power2.out',
          stagger: {
            each: 0.02,
            from: 'start'
          }
        });

        taglineCharRefs.value.forEach((charEl, index) => {
          if (charEl && index < taglineChars.value.length) {
            const char = taglineChars.value[index];
            if (char !== ' ') {
              scrambleText(charEl, char, 400);
            } else {
              charEl.textContent = '\u00A0';
            }
          }
        });
      } else {
        setTimeout(() => processChars(retryCount + 1), 50);
      }
    };

    processChars();
  });
}


function animateNav() {
  if (!navRef.value || navItemRefs.value.length === 0) return;

  nextTick(() => {
    const processItems = (retryCount = 0) => {
      const allReady = navItems.every((item, index) => {
        return navItemRefs.value[index] !== undefined && navItemRefs.value[index] !== null;
      });

      if (allReady || retryCount >= 5) {
        gsap.set(navItemRefs.value, {
          opacity: 0,
          x: -100,
          filter: 'blur(60px)'
        });

        gsap.to(navItemRefs.value, {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 1.0,
          ease: 'power3.out',
          stagger: {
            each: 0.1,
            from: 'start'
          }
        });
      } else {
        setTimeout(() => processItems(retryCount + 1), 50);
      }
    };

    processItems();
  });
}

function animateButtonText() {
  nextTick(() => {
    const processButtonChars = (charRefs: (HTMLElement | null)[], chars: string[], retryCount = 0) => {
      const allReady = chars.every((char, index) => {
        return charRefs[index] !== undefined && charRefs[index] !== null;
      });

      if (allReady || retryCount >= 5) {
        gsap.set(charRefs.slice(0, chars.length), {
          opacity: 0,
          y: 10,
          filter: 'blur(8px)'
        });

        gsap.to(charRefs.slice(0, chars.length), {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.5,
          ease: 'power2.out',
          stagger: {
            each: 0.02,
            from: 'start'
          }
        });

        charRefs.forEach((charEl, index) => {
          if (charEl && index < chars.length) {
            const char = chars[index];
            if (char !== ' ') {
              scrambleText(charEl, char, 400);
            } else {
              charEl.textContent = '\u00A0';
            }
          }
        });
      } else {
        setTimeout(() => processButtonChars(charRefs, chars, retryCount + 1), 50);
      }
    };

    processButtonChars(btnSecondaryCharRefs.value, btnSecondaryChars.value);
  });
}

function startAnimations() {
  animateLogo();
  animateNav();
  animateTagline();
  animateButtonText();
  animateStay();
  initTitleAnimation();

  setTimeout(() => {
    startTitleCycle();
  }, 1200);

  // Initialize hero exit animation after a short delay
  setTimeout(() => {
    initHeroExitAnimation();
  }, 500);
}

async function initHeroExitAnimation() {
  if (!heroSectionRef.value) return;

  try {
    // Load ScrollTrigger
    if (!ScrollTrigger) {
      const stModule = await import('gsap/ScrollTrigger.js');
      ScrollTrigger = stModule.default;
      gsap.registerPlugin(ScrollTrigger);
    }

    // Get elements to animate
    const heroContent = heroSectionRef.value.querySelector('.hero-content');
    const heroHeader = heroSectionRef.value.querySelector('.hero-header');
    const heroTagline = heroSectionRef.value.querySelector('.hero-tagline');
    const starfieldContainer = document.getElementById('starfield-container');

    // Create the exit animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroSectionRef.value,
        start: 'top top',
        end: '+=60%', // Animation completes over 60% of viewport scroll
        scrub: 1.5, // Smoother, more delayed follow (higher = smoother)
        invalidateOnRefresh: true,
      }
    });

    // Animate hero content: blur + scale down
    if (heroContent) {
      tl.to(heroContent, {
        scale: 0.92,
        filter: 'blur(10px)',
        opacity: 0.2,
        ease: 'none' // Linear for scroll-scrubbed animations
      }, 0);
    }

    // Animate header: blur + fade
    if (heroHeader) {
      tl.to(heroHeader, {
        filter: 'blur(6px)',
        opacity: 0,
        ease: 'none'
      }, 0);
    }

    // Animate tagline: blur + fade
    if (heroTagline) {
      tl.to(heroTagline, {
        filter: 'blur(6px)',
        opacity: 0,
        ease: 'none'
      }, 0);
    }

    // Fade the starfield slightly
    if (starfieldContainer) {
      tl.to(starfieldContainer, {
        opacity: 0.25,
        ease: 'none'
      }, 0);
    }

    // Store reference for cleanup
    heroExitTrigger = tl.scrollTrigger;

    // Refresh ScrollTrigger after setup
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

  } catch (error) {
    console.error('HeroSection: Failed to initialize exit animation', error);
  }
}

function handleTransitionComplete() {
  // Global starfield continues from intro - no need to show separate one
  startAnimations();
}

onMounted(() => {
  window.addEventListener('intro-complete', handleTransitionComplete);
});

onUnmounted(() => {
  window.removeEventListener('intro-complete', handleTransitionComplete);

  if (titleCycleInterval) {
    clearInterval(titleCycleInterval);
  }

  // Kill hero exit trigger
  if (heroExitTrigger) {
    heroExitTrigger.kill();
    heroExitTrigger = null;
  }

  scrambleIntervals.forEach((interval) => {
    clearInterval(interval);
  });
  scrambleIntervals.clear();
  gsap.killTweensOf([
    logoCharRefs.value,
    navItemRefs.value,
    stayCharRefs.value,
    titleCharRefs.value,
    taglineCharRefs.value,
    btnSecondaryCharRefs.value
  ]);
});
</script>

<style scoped>
.hero-section {
  background: transparent; /* Transparent so global starfield shows through */
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  padding: 72px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  position: relative;
}

/* Noise overlay for film grain effect */
.noise-overlay {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  z-index: 1;
  pointer-events: none;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  animation: noise-shift 0.5s steps(10) infinite;
}

@keyframes noise-shift {
  0% { transform: translate(0, 0); }
  10% { transform: translate(-2%, -2%); }
  20% { transform: translate(1%, 3%); }
  30% { transform: translate(-3%, 1%); }
  40% { transform: translate(3%, -1%); }
  50% { transform: translate(-1%, 2%); }
  60% { transform: translate(2%, -3%); }
  70% { transform: translate(-2%, 3%); }
  80% { transform: translate(1%, -2%); }
  90% { transform: translate(-1%, 1%); }
  100% { transform: translate(0, 0); }
}

.hero-header {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
  will-change: filter, opacity;
}

.logo {
  font-family: 'PP Neue Machina', sans-serif;
  font-weight: 800;
  font-size: clamp(20px, 2vw, 24px);
  line-height: 1;
  color: #fff;
  width: 130px;
  cursor: pointer;
  text-transform: uppercase;
}

.logo-char {
  display: inline-block;
  opacity: 0;
}

.logo-space {
  width: 0.3em;
  min-width: 0.3em;
  opacity: 0;
}

.nav {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: flex-end;
  font-family: 'PP Supply Mono', monospace;
  font-size: 20px;
  line-height: 1;
  color: #fff;
  white-space: nowrap;
}

.nav-item {
  cursor: pointer;
  opacity: 0;
}

.hero-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 36px;
  align-items: flex-start;
  justify-content: center;
  flex: 1;
  will-change: transform, filter, opacity;
  transform-origin: center center;
}

.hero-title {
  font-family: 'PP Neue Machina', sans-serif;
  font-weight: 800;
  font-size: clamp(48px, 10vw, 240px);
  line-height: 0.9;
  color: #fff;
  text-transform: uppercase;
  width: auto;
  max-width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.title-fixed {
  display: block;
  white-space: nowrap;
  width: 100%;
}

.title-dynamic {
  display: block;
  white-space: nowrap;
  width: 100%;
}

.title-char {
  display: inline-block;
  vertical-align: baseline;
  opacity: 0;
}

.title-space {
  width: 0.3em;
  min-width: 0.3em;
  display: inline-block;
  opacity: 0;
}

.hero-buttons {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.btn-secondary {
  font-family: 'PP Neue Machina', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.1;
  color: #fff;
  padding: 16px 18px;
  border-radius: 500px;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.btn-text {
  display: inline-block;
}

.btn-char {
  display: inline-block;
  opacity: 0;
}

.btn-space {
  width: 0.3em;
  min-width: 0.3em;
  opacity: 0;
}

.btn-primary {
  background: #c85508;
  border: 1px solid #fb6400;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #fff;
}


.hero-tagline {
  position: absolute;
  bottom: 72px;
  right: 72px;
  font-family: 'PP Supply Mono', monospace;
  font-size: 40px;
  line-height: 1.2;
  color: #fff;
  max-width: 1010px;
  text-align: right;
  z-index: 10;
  font-weight: 200;
  will-change: filter, opacity;
  /* Paragraph indent effect for right-aligned split text */
}

.tagline-char {
  display: inline-block;
  opacity: 0;
}

.tagline-space {
  width: 0.3em;
  min-width: 0.3em;
  opacity: 0;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 48px 24px;
    height: 100vh;
    min-height: 100vh;
  }
  
  .hero-title {
    font-size: 80px;
    width: auto;
    max-width: 100%;
  }
  
  .hero-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
  
  .hero-tagline {
    font-size: 20px;
    max-width: 100%;
    bottom: 48px;
    right: 24px;
    left: 24px;
    text-align: left;
    /* Paragraph indent effect for left-aligned split text on mobile */
    padding-right: 0;
    padding-left: 2em;
  }
  
  .nav {
    font-size: 14px;
    gap: 12px;
  }
}
</style>
