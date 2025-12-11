<template>
  <section ref="heroSectionRef" class="hero-section" data-name="Hero Section">
    <header class="hero-header" data-name="Header">
      <button
        ref="logoRef"
        class="logo"
        @mouseenter="handleLogoHover"
        aria-label="Are You Human - Home"
        type="button"
      >
        <span
          v-for="(char, index) in logoChars"
          :key="`logo-${index}`"
          :ref="el => { if (el) logoCharRefs[index] = el as HTMLElement }"
          class="logo-char"
          :class="{ 'logo-space': char === ' ' }"
          aria-hidden="true"
        >{{ char === ' ' ? '\u00A0' : char }}</span>
      </button>
      <nav class="nav" ref="navRef" aria-label="Main navigation">
        <a
          v-for="(item, index) in navItems"
          :key="index"
          :ref="el => { if (el) navItemRefs[index] = el as HTMLElement }"
          :href="navTargets[item]"
          class="nav-item"
          @mouseenter="handleNavHover(index)"
          @click="handleNavClick(index)"
        >{{ item }}</a>
      </nav>
    </header>

    <div class="hero-content">
      <h1 class="hero-title">
        <span ref="stayTitleRef" class="title-fixed">
          <span
            v-for="(char, index) in stayChars"
            :key="`stay-${index}`"
            :ref="el => { if (el) stayCharRefs[index] = el as HTMLElement }"
            class="title-char"
            :class="{ 'title-space': char === ' ' }"
          >{{ char === ' ' ? '\u00A0' : char }}</span>
        </span>
        <span ref="dynamicTitleRef" class="title-dynamic">
          <span
            v-for="(char, index) in dynamicTitleChars"
            :key="`title-${titleKey}-${index}`"
            :ref="el => { if (el) titleCharRefs[index] = el as HTMLElement }"
            class="title-char"
            :class="{ 'title-space': char === ' ' }"
          >{{ char === ' ' ? '\u00A0' : char }}</span>
        </span>
      </h1>
    </div>

    <!-- Magnetic Button -->
    <div ref="ctaRef" class="hero-cta">
      <div class="btn-magnetic">
        <button
          class="btn-magnetic__click"
          data-magnetic-strength="80"
          data-magnetic-strength-inner="40"
          @click="handleCtaClick"
          @mouseenter="playHover"
          type="button"
          aria-label="Talk to an Expert - Open contact form"
        >
          <div class="btn-magnetic__fill" aria-hidden="true"></div>
          <div data-magnetic-inner-target class="btn-magnetic__content">
            <svg class="btn-magnetic__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 16L19.75 18.25L22 19L19.75 19.75L19 22L18.25 19.75L16 19L18.25 18.25L19 16Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 2L5.5 3.5L7 4L5.5 4.5L5 6L4.5 4.5L3 4L4.5 3.5L5 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="btn-magnetic__text">
              <span class="btn-magnetic__text-p">Talk to an Expert</span>
              <span class="btn-magnetic__text-p is--duplicate" aria-hidden="true">Talk to an Expert</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <p ref="taglineRef" class="hero-tagline">
      <span
        v-for="(char, index) in taglineChars"
        :key="`tagline-${index}`"
        :ref="el => { if (el) taglineCharRefs[index] = el as HTMLElement }"
        class="tagline-char"
        :class="{ 'tagline-space': char === ' ' }"
        aria-hidden="true"
      >{{ char === ' ' ? '\u00A0' : char }}</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { gsap } from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import { useContactModal } from '../composables/useContactModal';
import { useSound } from '../composables/useSound';

// ScrollTrigger for exit animation (lazy loaded)
let ScrollTrigger: typeof ScrollTriggerType | null = null;
let heroExitTrigger: ScrollTriggerType | null = null;

// Element refs
const heroSectionRef = ref<HTMLElement | null>(null);
const logoRef = ref<HTMLElement | null>(null);
const navRef = ref<HTMLElement | null>(null);
const stayTitleRef = ref<HTMLElement | null>(null);
const dynamicTitleRef = ref<HTMLElement | null>(null);
const taglineRef = ref<HTMLElement | null>(null);
const ctaRef = ref<HTMLElement | null>(null);

// Character refs for animations
const logoCharRefs = ref<(HTMLElement | null)[]>([]);
const navItemRefs = ref<(HTMLElement | null)[]>([]);
const stayCharRefs = ref<(HTMLElement | null)[]>([]);
const titleCharRefs = ref<(HTMLElement | null)[]>([]);
const taglineCharRefs = ref<(HTMLElement | null)[]>([]);

// Static data
const logoChars = 'Are You Human?'.split('');
const navItems = ['Services', 'Framework', 'About'] as const;
const stayChars = 'Stay'.split('');
const taglineChars = 'The AI studio that helps leaders win with AI. Without losing what makes them irreplaceable'.split('');
const titleTexts = ['Human', 'Ahead'] as const;
const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Reactive state
const dynamicTitleChars = ref('Human'.split(''));
const titleKey = ref(0);

// Animation state
const scrambleIntervals = new Map<HTMLElement, ReturnType<typeof setInterval>>();
let titleCycleInterval: ReturnType<typeof setInterval> | null = null;
let isTitleTransitioning = false;
let currentTitleIndex = 0;

// Magnetic effect cleanup
const magneticCleanup: (() => void)[] = [];

// Composables
const { open: openModal } = useContactModal();
const { playHover, playClick } = useSound();

// Nav targets mapping - page URLs for Barba.js transitions
const navTargets: Record<typeof navItems[number], string> = {
  'Services': '/services',
  'Framework': '/framework',
  'About': '/about'
};

// Scramble text animation
function scrambleText(element: HTMLElement, finalText: string, duration = 800, onComplete?: () => void) {
  if (!element) return;

  // Clear existing interval
  const existing = scrambleIntervals.get(element);
  if (existing) {
    clearInterval(existing);
    scrambleIntervals.delete(element);
  }

  const textLength = finalText.length;
  const specialChars = [' ', '.', ',', '?', '!', "'"];

  // Single character optimization
  if (textLength === 1) {
    if (specialChars.includes(finalText[0])) {
      element.textContent = finalText;
      onComplete?.();
      return;
    }

    let frame = 0;
    const totalFrames = Math.max(5, duration / 30);

    const interval = setInterval(() => {
      if (frame < totalFrames - 1) {
        element.textContent = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      } else {
        element.textContent = finalText;
        clearInterval(interval);
        scrambleIntervals.delete(element);
        onComplete?.();
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
      const char = finalText[i];
      if (char === ' ') {
        scrambledText += ' ';
      } else if (specialChars.includes(char) || progress > i / textLength) {
        scrambledText += char;
      } else {
        scrambledText += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      }
    }

    element.textContent = scrambledText;
    frame++;

    if (frame >= totalFrames) {
      clearInterval(interval);
      scrambleIntervals.delete(element);
      element.textContent = finalText;
      onComplete?.();
    }
  }, 30);

  scrambleIntervals.set(element, interval);
}

// Generic character animation helper
function animateCharsIn(
  chars: string[],
  charRefs: (HTMLElement | null)[],
  options: { blur?: number; x?: number; y?: number; duration?: number; scramble?: boolean } = {}
) {
  const { blur = 60, x = -100, y = 0, duration = 1.0, scramble = false } = options;

  const processChars = (retryCount = 0) => {
    const allReady = chars.every((_, index) => charRefs[index] != null);

    if (allReady || retryCount >= 5) {
      gsap.set(charRefs, {
        opacity: 0,
        x,
        y,
        filter: `blur(${blur}px)`,
        visibility: 'visible',
        display: 'inline-block'
      });

      gsap.to(charRefs, {
        opacity: 1,
        x: 0,
        y: 0,
        filter: 'blur(0px)',
        duration,
        ease: 'power3.out',
        stagger: { each: 0.06, from: 'start' }
      });

      if (scramble) {
        charRefs.forEach((el, index) => {
          if (el && chars[index] !== ' ') {
            scrambleText(el, chars[index], 600);
          } else if (el) {
            el.textContent = '\u00A0';
          }
        });
      }
    } else {
      setTimeout(() => processChars(retryCount + 1), 50);
    }
  };

  nextTick(() => processChars());
}

// Animation functions
function animateLogo() {
  if (!logoRef.value) return;
  animateCharsIn(logoChars, logoCharRefs.value, { blur: 10, x: 0, duration: 0.6, scramble: true });
}

function animateStay() {
  if (!stayTitleRef.value) return;
  animateCharsIn(stayChars, stayCharRefs.value);
}

function initTitleAnimation() {
  if (!dynamicTitleRef.value) return;
  animateCharsIn(dynamicTitleChars.value, titleCharRefs.value);
}

function animateTagline() {
  if (!taglineRef.value) return;
  animateCharsIn(taglineChars, taglineCharRefs.value, { blur: 10, x: 0, y: 10, duration: 0.5, scramble: true });
}

function animateNav() {
  if (!navRef.value || navItemRefs.value.length === 0) return;

  nextTick(() => {
    const processItems = (retryCount = 0) => {
      const allReady = navItems.every((_, index) => navItemRefs.value[index] != null);

      if (allReady || retryCount >= 5) {
        gsap.set(navItemRefs.value, { opacity: 0, x: -100, filter: 'blur(60px)' });
        gsap.to(navItemRefs.value, {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 1.0,
          ease: 'power3.out',
          stagger: { each: 0.1, from: 'start' }
        });
      } else {
        setTimeout(() => processItems(retryCount + 1), 50);
      }
    };
    processItems();
  });
}

function animateCta() {
  if (!ctaRef.value) return;

  gsap.set(ctaRef.value, {
    opacity: 0,
    x: -50,
    y: 50,
    filter: 'blur(20px)',
    scale: 0.9
  });

  gsap.to(ctaRef.value, {
    opacity: 1,
    x: 0,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    duration: 1.2,
    delay: 0.3,
    ease: 'power3.out'
  });
}

// Event handlers
function handleLogoHover() {
  playHover();
  logoCharRefs.value.forEach((el, index) => {
    if (el && logoChars[index] !== ' ') {
      scrambleText(el, logoChars[index], 400);
    }
  });
}

function handleNavHover(index: number) {
  playHover();
  const el = navItemRefs.value[index];
  if (el) scrambleText(el, navItems[index], 400);
}

function handleNavClick(_index: number) {
  playClick();
  // Barba.js will intercept the anchor click and handle the transition
}

function handleCtaClick() {
  playClick();
  openModal();
}

// Title cycling
function updateTitleWithScramble(newText: string) {
  if (isTitleTransitioning || !dynamicTitleRef.value) return;

  isTitleTransitioning = true;

  // Clear existing scramble intervals
  titleCharRefs.value.forEach((el) => {
    if (el && scrambleIntervals.has(el)) {
      clearInterval(scrambleIntervals.get(el)!);
      scrambleIntervals.delete(el);
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
      stagger: { each: 0.06, from: 'start' },
      onComplete: () => {
        dynamicTitleChars.value = newText.split('');
        titleKey.value++;
        titleCharRefs.value = [];

        nextTick(() => {
          setTimeout(() => {
            animateCharsIn(dynamicTitleChars.value, titleCharRefs.value);
            setTimeout(() => { isTitleTransitioning = false; }, 1000);
          }, 50);
        });
      }
    });
  } else {
    dynamicTitleChars.value = newText.split('');
    titleKey.value++;
    titleCharRefs.value = [];
    isTitleTransitioning = false;
  }
}

function startTitleCycle() {
  titleCycleInterval = setInterval(() => {
    if (!isTitleTransitioning) {
      currentTitleIndex = (currentTitleIndex + 1) % titleTexts.length;
      updateTitleWithScramble(titleTexts[currentTitleIndex]);
    }
  }, 3000);
}

// Magnetic effect
function initMagneticEffect() {
  if (window.innerWidth <= 991) return;

  const magnets = document.querySelectorAll<HTMLElement>('[data-magnetic-strength]');

  magnets.forEach(m => {
    const resetOnEnter = () => {
      gsap.killTweensOf(m);
      gsap.set(m, { x: '0em', y: '0em', rotate: '0deg', clearProps: 'all' });
      const inner = m.querySelector('[data-magnetic-inner-target]');
      if (inner) {
        gsap.killTweensOf(inner);
        gsap.set(inner, { x: '0em', y: '0em', rotate: '0deg', clearProps: 'all' });
      }
    };

    const moveMagnet = (e: MouseEvent) => {
      const b = m.getBoundingClientRect();
      const strength = parseFloat(m.dataset.magneticStrength || '25');
      const innerStrength = parseFloat(m.dataset.magneticStrengthInner || String(strength));
      const offsetX = ((e.clientX - b.left) / m.offsetWidth - 0.5) * (strength / 16);
      const offsetY = ((e.clientY - b.top) / m.offsetHeight - 0.5) * (strength / 16);

      gsap.to(m, { x: `${offsetX}em`, y: `${offsetY}em`, rotate: '0.001deg', ease: 'power4.out', duration: 1.6 });

      const inner = m.querySelector('[data-magnetic-inner-target]');
      if (inner) {
        const innerOffsetX = ((e.clientX - b.left) / m.offsetWidth - 0.5) * (innerStrength / 16);
        const innerOffsetY = ((e.clientY - b.top) / m.offsetHeight - 0.5) * (innerStrength / 16);
        gsap.to(inner, { x: `${innerOffsetX}em`, y: `${innerOffsetY}em`, rotate: '0.001deg', ease: 'power4.out', duration: 2 });
      }
    };

    const resetMagnet = () => {
      gsap.to(m, { x: '0em', y: '0em', ease: 'elastic.out(1, 0.3)', duration: 1.6, clearProps: 'all' });
      const inner = m.querySelector('[data-magnetic-inner-target]');
      if (inner) {
        gsap.to(inner, { x: '0em', y: '0em', ease: 'elastic.out(1, 0.3)', duration: 2, clearProps: 'all' });
      }
    };

    m.addEventListener('mouseenter', resetOnEnter);
    m.addEventListener('mousemove', moveMagnet);
    m.addEventListener('mouseleave', resetMagnet);

    // Store cleanup function
    magneticCleanup.push(() => {
      m.removeEventListener('mouseenter', resetOnEnter);
      m.removeEventListener('mousemove', moveMagnet);
      m.removeEventListener('mouseleave', resetMagnet);
    });
  });
}

// Hero exit animation on scroll
async function initHeroExitAnimation() {
  if (!heroSectionRef.value) return;

  try {
    if (!ScrollTrigger) {
      const stModule = await import('gsap/ScrollTrigger.js');
      ScrollTrigger = stModule.default;
      gsap.registerPlugin(ScrollTrigger as unknown as object);
    }

    const heroContent = heroSectionRef.value.querySelector('.hero-content');
    const heroHeader = heroSectionRef.value.querySelector('.hero-header');
    const heroTagline = heroSectionRef.value.querySelector('.hero-tagline');
    const starfieldContainer = document.getElementById('starfield-container');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroSectionRef.value,
        start: 'top top',
        end: '+=60%',
        scrub: 1.5,
        invalidateOnRefresh: true,
      }
    });

    if (heroContent) {
      tl.to(heroContent, { scale: 0.92, filter: 'blur(10px)', opacity: 0.2, ease: 'none' }, 0);
    }
    if (heroHeader) {
      tl.to(heroHeader, { filter: 'blur(6px)', opacity: 0, ease: 'none' }, 0);
    }
    if (heroTagline) {
      tl.to(heroTagline, { filter: 'blur(6px)', opacity: 0, ease: 'none' }, 0);
    }
    if (starfieldContainer) {
      tl.to(starfieldContainer, { opacity: 0.25, ease: 'none' }, 0);
    }

    heroExitTrigger = tl.scrollTrigger as ScrollTriggerType;
    setTimeout(() => ScrollTrigger?.refresh(), 100);
  } catch (error) {
    console.error('HeroSection: Failed to initialize exit animation', error);
  }
}

// Start all animations
function startAnimations() {
  animateLogo();
  animateNav();
  animateTagline();
  animateCta();
  animateStay();
  initTitleAnimation();
  initMagneticEffect();

  setTimeout(startTitleCycle, 1200);
  setTimeout(initHeroExitAnimation, 500);
}

function handleTransitionComplete() {
  startAnimations();
}

// Lifecycle
onMounted(() => {
  window.addEventListener('intro-complete', handleTransitionComplete);
});

onUnmounted(() => {
  window.removeEventListener('intro-complete', handleTransitionComplete);

  // Clear title cycle
  if (titleCycleInterval) clearInterval(titleCycleInterval);

  // Kill hero exit trigger
  if (heroExitTrigger) {
    heroExitTrigger.kill();
    heroExitTrigger = null;
  }

  // Clear scramble intervals
  scrambleIntervals.forEach(clearInterval);
  scrambleIntervals.clear();

  // Clean up magnetic effect listeners
  magneticCleanup.forEach(cleanup => cleanup());
  magneticCleanup.length = 0;

  // Kill all GSAP tweens
  gsap.killTweensOf([
    logoCharRefs.value,
    navItemRefs.value,
    stayCharRefs.value,
    titleCharRefs.value,
    taglineCharRefs.value
  ]);
});
</script>

<style scoped>
.hero-section {
  background: transparent;
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
  background: none;
  border: none;
  padding: 0;
  text-align: left;
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
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
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

.title-fixed,
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

/* CTA Button */
.hero-cta {
  position: absolute;
  bottom: 72px;
  right: 72px;
  z-index: 10;
  opacity: 0;
}

.btn-magnetic {
  font-size: 18px;
  position: relative;
}

.btn-magnetic__click {
  cursor: pointer;
  border-radius: 4em;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  border: 1px solid #fff;
  background: transparent;
}

.btn-magnetic__fill {
  background-color: #fff;
  width: 100%;
  height: 100%;
  position: absolute;
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform 0.4s cubic-bezier(0.625, 0.05, 0, 1);
}

.btn-magnetic__click:hover .btn-magnetic__fill {
  transform: scaleY(1);
}

.btn-magnetic__content {
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 1.2em 2.4em;
  gap: 0.7em;
  display: flex;
  position: relative;
}

.btn-magnetic__icon {
  color: #fff;
  flex-shrink: 0;
  transition: color 0.6s cubic-bezier(0.625, 0.05, 0, 1);
}

.btn-magnetic__click:hover .btn-magnetic__icon {
  color: #000;
}

.btn-magnetic__text {
  position: relative;
  overflow: hidden;
}

.btn-magnetic__text-p {
  color: #fff;
  text-align: center;
  margin: 0;
  font-family: 'PP Neue Machina', sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.5;
  position: relative;
  white-space: nowrap;
  transition: all 0.6s cubic-bezier(0.625, 0.05, 0, 1);
  transform: translateY(0%) rotate(0.001deg);
}

.btn-magnetic__text-p.is--duplicate {
  position: absolute;
  top: 100%;
  left: 0;
  color: #000;
}

.btn-magnetic__click:hover .btn-magnetic__text-p {
  transform: translateY(-100%) rotate(0.001deg);
}

.hero-tagline {
  position: absolute;
  bottom: 72px;
  left: 72px;
  font-family: 'PP Supply Mono', monospace;
  font-size: 40px;
  line-height: 1.2;
  color: #fff;
  max-width: 1010px;
  text-align: left;
  z-index: 10;
  font-weight: 200;
  will-change: filter, opacity;
  text-wrap: balance;
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

  .hero-cta {
    bottom: auto;
    left: 24px;
    right: 24px;
    top: auto;
    position: relative;
    margin-top: 24px;
  }

  .btn-magnetic {
    font-size: 16px;
  }

  .btn-magnetic__content {
    padding: 1em 2em;
  }

  .hero-tagline {
    font-size: 20px;
    max-width: 100%;
    bottom: 48px;
    right: 24px;
    left: 24px;
    text-align: left;
    padding-right: 0;
    padding-left: 2em;
  }

  .nav {
    font-size: 14px;
    gap: 12px;
  }
}
</style>
