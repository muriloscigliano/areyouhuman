<template>
  <section
    v-if="showIntro"
    class="intro"
    :class="{ 'intro--dark': isDarkMode, 'intro--transitioning': isTransitioning }"
    @mousedown="startHold"
    @mouseup="endHold"
    @mouseleave="endHold"
    @touchstart.prevent="startHold"
    @touchend="endHold"
    @touchcancel="endHold"
  >
    <!-- No embedded starfield - using global one from index.astro -->
    <!-- Background is transparent so global starfield shows through -->

    <!-- Main Content Area - Title + Instruction Text in center -->
    <div
      ref="introContentRef"
      class="intro-content"
    >
      <!-- Main Heading with animated characters -->
      <h1 ref="headingRef" class="intro-heading">
        <span
          v-for="(char, index) in titleChars"
          :key="`${titleKey}-${index}`"
          :ref="el => { if (el) charRefs[index] = el }"
          class="heading-char"
          :class="{ 'heading-space': char === ' ' }"
        >{{ char === ' ' ? '\u00A0' : char }}</span>
      </h1>

      <!-- Hold Text (below title) -->
      <p ref="holdTextRef" class="hold-text">
        <span
          v-for="(char, index) in holdTextChars"
          :key="`hold-${holdTextKey}-${index}`"
          :ref="el => { if (el) holdTextCharRefs[index] = el }"
          class="hold-text-char"
          :class="{ 'hold-text-space': char === ' ' }"
        >{{ char === ' ' ? '\u00A0' : char }}</span>
      </p>
    </div>

    <!-- Icon at bottom with progress ring -->
    <div ref="holdIconRef" class="hold-icon-container" :class="{ 'hold-icon-container--active': isHolding }">
      <!-- Progress Ring SVG -->
      <svg class="progress-ring" viewBox="0 0 100 100">
        <!-- Background circle -->
        <circle
          class="progress-ring-bg"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke-width="2"
        />
        <!-- Progress circle -->
        <circle
          class="progress-ring-progress"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke-width="3"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="progressOffset"
        />
      </svg>
      <!-- Icon inside the ring - Solar scanner-outline icon (human verification) -->
      <div class="hold-icon">
        <svg viewBox="0 0 24 24" fill="none">
          <!-- Solar scanner-outline icon from Iconify -->
          <path fill="currentColor" d="M14 2.75c1.907 0 3.262.002 4.29.14c1.005.135 1.585.389 2.008.812c.487.487.7.865.817 1.538c.132.759.135 1.84.135 3.76a.75.75 0 0 0 1.5 0v-.096c0-1.8 0-3.018-.158-3.922c-.175-1.005-.549-1.656-1.233-2.34c-.749-.75-1.698-1.081-2.87-1.239c-1.14-.153-2.595-.153-4.433-.153H14a.75.75 0 0 0 0 1.5M2 14.25a.75.75 0 0 1 .75.75c0 1.92.003 3.001.135 3.76c.118.673.33 1.051.817 1.538c.423.423 1.003.677 2.009.812c1.028.138 2.382.14 4.289.14a.75.75 0 0 1 0 1.5h-.056c-1.838 0-3.294 0-4.433-.153c-1.172-.158-2.121-.49-2.87-1.238c-.684-.685-1.058-1.336-1.233-2.341c-.158-.904-.158-2.123-.158-3.922V15a.75.75 0 0 1 .75-.75m20 0a.75.75 0 0 1 .75.75v.096c0 1.8 0 3.018-.158 3.922c-.175 1.005-.549 1.656-1.233 2.34c-.749.75-1.698 1.081-2.87 1.239c-1.14.153-2.595.153-4.433.153H14a.75.75 0 0 1 0-1.5c1.907 0 3.262-.002 4.29-.14c1.005-.135 1.585-.389 2.008-.812c.487-.487.7-.865.817-1.538c.132-.759.135-1.84.135-3.76a.75.75 0 0 1 .75-.75m-12.056-13H10a.75.75 0 0 1 0 1.5c-1.907 0-3.261.002-4.29.14c-1.005.135-1.585.389-2.008.812c-.487.487-.7.865-.817 1.538c-.132.759-.135 1.84-.135 3.76a.75.75 0 1 1-1.5 0v-.096c0-1.8 0-3.018.158-3.922c.175-1.005.549-1.656 1.233-2.34c.749-.75 1.698-1.081 2.87-1.239c1.14-.153 2.595-.153 4.433-.153M2 11.25a.75.75 0 0 0 0 1.5h20a.75.75 0 0 0 0-1.5z"/>
        </svg>
      </div>
    </div>

    <!-- WebGL Portal Transition - works WITH starfield -->
    <WebGLPortalTransition
      ref="webglRef"
      :active="showTransition"
      @complete="onTransitionComplete"
    />

    <!-- Sound Toggle Button - Modern equalizer bars -->
    <button
      class="sound-toggle"
      :class="{
        'sound-toggle--muted': isMuted,
        'sound-toggle--playing': isPlaying
      }"
      @click.stop="toggleSound"
      aria-label="Toggle sound"
    >
      <div class="eq-bars">
        <span class="eq-bar"></span>
        <span class="eq-bar"></span>
        <span class="eq-bar"></span>
        <span class="eq-bar"></span>
        <span class="eq-bar"></span>
      </div>
    </button>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, defineAsyncComponent, watch } from 'vue';
import { gsap } from 'gsap';

// Lazy load WebGL transition only
const WebGLPortalTransition = defineAsyncComponent(() =>
  import('./WebGLPortalTransition.vue')
);

// =============================================================================
// CONSTANTS
// =============================================================================

const HOLD_DURATION = 2500; // 2.5 seconds to complete
const BASE_STAR_COUNT = 400;
const MAX_STAR_COUNT = 800; // Increase particles during hold

// Progress ring calculations
const circumference = 2 * Math.PI * 45; // radius = 45

// Text thresholds for hold progress
const holdTextThresholds = [
  { progress: 0, text: 'Hold to prove you\'re more than code' },
  { progress: 0.15, text: 'Processing biometric intent...' },
  { progress: 0.35, text: 'Detecting consciousness patterns...' },
  { progress: 0.55, text: 'Human signature identified.' },
  { progress: 0.80, text: 'Welcome aboard, Human.' }
];

// =============================================================================
// EMITS
// =============================================================================

const emit = defineEmits(['complete']);

// =============================================================================
// REFS - DOM
// =============================================================================

const introContentRef = ref(null);
const headingRef = ref(null);
const holdTextRef = ref(null);
const holdIconRef = ref(null);
const webglRef = ref(null);

// =============================================================================
// REFS - STATE
// =============================================================================

const showIntro = ref(true);
const showTransition = ref(false);
const isTransitioning = ref(false);
const isHolding = ref(false);
const holdProgress = ref(0);
const isDarkMode = ref(false);
const prefersReducedMotion = ref(false);
const canHold = ref(false); // Only allow holding after "Hold to prove..." appears

// =============================================================================
// STARFIELD CONTROL - Dispatch events to global starfield
// =============================================================================

function updateGlobalStarfield() {
  if (typeof window === 'undefined') return;

  // Calculate speed: 1 = normal, up to 21 at max progress
  const speed = 1 + holdProgress.value * 20;
  const starCount = Math.floor(BASE_STAR_COUNT + (MAX_STAR_COUNT - BASE_STAR_COUNT) * holdProgress.value);

  window.dispatchEvent(new CustomEvent('starfield-speed', {
    detail: {
      speed: speed,
      isDark: isDarkMode.value,
      starCount: starCount
    }
  }));
}

// Watch hold progress and update starfield
watch(holdProgress, () => {
  updateGlobalStarfield();
});

watch(isDarkMode, () => {
  updateGlobalStarfield();
});

// Progress ring offset (for SVG stroke-dashoffset)
const progressOffset = computed(() => {
  return circumference * (1 - holdProgress.value);
});

// Title animation
const titleChars = ref('Machines calculate.'.split(''));
const charRefs = ref([]);
const titleKey = ref(Date.now());

// Hold text animation
const holdTextChars = ref('Hold to prove you\'re more than code'.split(''));
const holdTextCharRefs = ref([]);
const holdTextKey = ref(Date.now());
let currentHoldTextIndex = 0;

// Animation tracking
let holdStartTime = null;
let holdAnimationId = null;
let pulseAnimation = null;
const scrambleIntervals = new Map();

// =============================================================================
// SOUND SYSTEM
// =============================================================================

const isMuted = ref(false);
const isPlaying = ref(false);
const accelerateSound = ref(null);
const decelerateSound = ref(null);

// Initialize audio elements
function initAudio() {
  if (typeof window === 'undefined') return;

  // Create audio elements
  accelerateSound.value = new Audio('/audio/accelerate-sound.mp3');
  decelerateSound.value = new Audio('/audio/desaccelarete-sound.mp3');

  // Set properties
  accelerateSound.value.loop = true;
  accelerateSound.value.volume = 0.5;
  decelerateSound.value.volume = 0.6;

  // Preload
  accelerateSound.value.preload = 'auto';
  decelerateSound.value.preload = 'auto';
}

function playAccelerateSound() {
  if (isMuted.value || !accelerateSound.value) return;

  // Reset and play
  accelerateSound.value.currentTime = 0;
  accelerateSound.value.play().catch(() => {
    // Ignore autoplay errors
  });
  isPlaying.value = true;
}

function stopAccelerateSound() {
  if (!accelerateSound.value) return;

  isPlaying.value = false;

  // Fade out
  const fadeOut = () => {
    if (accelerateSound.value.volume > 0.05) {
      accelerateSound.value.volume -= 0.05;
      requestAnimationFrame(fadeOut);
    } else {
      accelerateSound.value.pause();
      accelerateSound.value.volume = 0.5; // Reset volume
    }
  };
  fadeOut();
}

function playDecelerateSound() {
  if (isMuted.value || !decelerateSound.value) return;

  // Stop accelerate sound first
  if (accelerateSound.value) {
    accelerateSound.value.pause();
    accelerateSound.value.volume = 0.5;
  }

  // Play decelerate
  decelerateSound.value.currentTime = 0;
  decelerateSound.value.play().catch(() => {
    // Ignore autoplay errors
  });
  isPlaying.value = true;

  // Stop playing state when decelerate ends
  decelerateSound.value.onended = () => {
    isPlaying.value = false;
  };
}

function toggleSound(e) {
  e.stopPropagation();
  isMuted.value = !isMuted.value;

  // If muting, stop all sounds
  if (isMuted.value) {
    if (accelerateSound.value) {
      accelerateSound.value.pause();
    }
    if (decelerateSound.value) {
      decelerateSound.value.pause();
    }
  }
}

// =============================================================================
// HOLD INTERACTION
// =============================================================================

function startHold(e) {
  // Only allow holding after the instruction text appears
  if (!canHold.value || isTransitioning.value || isHolding.value) return;

  // Prevent text selection during hold
  e.preventDefault();

  isHolding.value = true;
  holdStartTime = performance.now();

  // Kill pulse animation
  if (pulseAnimation) {
    pulseAnimation.kill();
    pulseAnimation = null;
  }

  // Play accelerate sound (spaceship speeding up)
  playAccelerateSound();

  // Start hold animation loop
  animateHold();
}

function animateHold() {
  if (!isHolding.value || isTransitioning.value) return;

  const elapsed = performance.now() - holdStartTime;
  const progress = Math.min(1, elapsed / HOLD_DURATION);

  holdProgress.value = progress;

  // Dark mode transition removed - now happens when WebGL portal starts
  // Starfield stays in light mode (white bg, black stars) during entire hold

  // Update dynamic text based on progress
  updateHoldText(progress);

  // Check for completion
  if (progress >= 1) {
    completeHold();
    return;
  }

  holdAnimationId = requestAnimationFrame(animateHold);
}

function endHold() {
  if (!isHolding.value || isTransitioning.value) return;

  isHolding.value = false;

  if (holdAnimationId) {
    cancelAnimationFrame(holdAnimationId);
    holdAnimationId = null;
  }

  // Stop accelerate sound
  stopAccelerateSound();

  // If not complete, animate back to start
  if (holdProgress.value < 1) {
    animateProgressReset();
  }
}

function animateProgressReset() {
  // Animate progress back to 0
  gsap.to(holdProgress, {
    value: 0,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => {
      // Reset text to initial
      currentHoldTextIndex = 0;
      updateHoldTextChars('Hold to prove you\'re more than code');

      // Restart pulse animation
      startPulseAnimation();
    }
  });
}

function completeHold() {
  isHolding.value = false;
  isTransitioning.value = true;

  // Play decelerate sound (spaceship slowing down / arriving)
  playDecelerateSound();

  // Kill all animations
  if (pulseAnimation) {
    pulseAnimation.kill();
    pulseAnimation = null;
  }
  if (holdAnimationId) {
    cancelAnimationFrame(holdAnimationId);
    holdAnimationId = null;
  }
  scrambleIntervals.forEach((interval) => clearInterval(interval));
  scrambleIntervals.clear();

  gsap.killTweensOf(charRefs.value);
  gsap.killTweensOf(holdTextCharRefs.value);
  gsap.killTweensOf(holdProgress);

  // Dispatch event for HeroSection to prepare
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('transition-start'));
  }

  // Prepare landing page FIRST (behind everything)
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.classList.remove('landing--hidden');
    mainContent.style.opacity = '1';
    mainContent.style.pointerEvents = 'auto';
  }

  // Start WebGL transition immediately - seamlessly with the starfield
  showTransition.value = true;

  // Switch to dark mode NOW - starfield goes from white bg/black stars to black bg/white stars
  isDarkMode.value = true;
  animateColorInversion();

  // Animate slowdown - stars decelerate as if arriving at destination
  // Use a dedicated animation object to control the starfield speed
  const slowdownAnim = { speed: 21 }; // Start at hyperspace speed
  gsap.to(slowdownAnim, {
    speed: 0.5, // Slow down to ambient speed
    duration: 2.5,
    ease: 'power2.out',
    onUpdate: () => {
      // Dispatch to global starfield
      window.dispatchEvent(new CustomEvent('starfield-speed', {
        detail: {
          speed: slowdownAnim.speed,
          isDark: true,
          starCount: 400
        }
      }));
    }
  });

  // Fade out content elements (text is already blurred from dark mode transition)
  const tl = gsap.timeline();

  if (introContentRef.value) {
    tl.to(introContentRef.value, {
      opacity: 0,
      scale: 0.9,
      duration: 1.0,
      ease: 'power2.in'
    }, 0);
  }

  if (holdIconRef.value) {
    tl.to(holdIconRef.value, {
      opacity: 0,
      y: 30,
      scale: 0.9,
      duration: 0.8,
      ease: 'power2.in'
    }, 0);
  }
}

// =============================================================================
// HOLD TEXT UPDATES
// =============================================================================

function updateHoldText(progress) {
  // DON'T update text once we're in dark mode - text is blurring out
  if (isDarkMode.value) return;

  // Find the appropriate text threshold
  let targetIndex = 0;
  for (let i = holdTextThresholds.length - 1; i >= 0; i--) {
    if (progress >= holdTextThresholds[i].progress) {
      targetIndex = i;
      break;
    }
  }

  // Only update if text changed
  if (targetIndex !== currentHoldTextIndex) {
    currentHoldTextIndex = targetIndex;
    const newText = holdTextThresholds[targetIndex].text;
    updateHoldTextChars(newText);
  }
}

function updateHoldTextChars(newText) {
  // Kill any existing animations on hold text characters
  gsap.killTweensOf(holdTextCharRefs.value);

  // Clear existing scramble intervals
  holdTextCharRefs.value.forEach((charEl) => {
    if (charEl && scrambleIntervals.has(charEl)) {
      clearInterval(scrambleIntervals.get(charEl));
      scrambleIntervals.delete(charEl);
    }
  });

  // Update characters
  holdTextChars.value = newText.split('');
  holdTextKey.value = Date.now();

  // Wait for DOM update, then animate
  nextTick(() => {
    setTimeout(() => {
      if (!holdTextCharRefs.value.length) return;

      // Kill animations again after DOM update (new refs)
      gsap.killTweensOf(holdTextCharRefs.value);

      // Initial state - hidden
      gsap.set(holdTextCharRefs.value, {
        opacity: 0,
        y: 10,
        filter: 'blur(8px)'
      });

      // Animate in smoothly
      gsap.to(holdTextCharRefs.value, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.4,
        ease: 'power2.out',
        stagger: {
          each: 0.015,
          from: 'start'
        }
      });

      // Apply scramble effect
      holdTextCharRefs.value.forEach((charEl, index) => {
        if (charEl && index < newText.length) {
          const char = newText[index];
          if (char !== ' ') {
            scrambleText(charEl, char, 300);
          } else {
            charEl.textContent = '\u00A0';
          }
        }
      });
    }, 10);
  });
}

// =============================================================================
// COLOR INVERSION - Text disappears with blur, not color change
// =============================================================================

function animateColorInversion(reverse = false) {
  if (!introContentRef.value) return;

  if (!reverse) {
    // GOING DARK: Animate text to disappear with BLUR effect (not opacity)
    // Keep opacity at 1 but use extreme blur to make text invisible
    const tl = gsap.timeline();

    // Kill any existing animations on these elements
    gsap.killTweensOf(charRefs.value);
    gsap.killTweensOf(holdTextCharRefs.value);

    // Title chars - blur out heavily (opacity stays 1, blur makes invisible)
    // SLOWER: 1.0s -> 1.8s
    tl.to(charRefs.value, {
      filter: 'blur(60px)',
      scale: 0.9,
      y: -20,
      duration: 1.8,
      ease: 'power2.inOut',
      stagger: {
        each: 0.03,
        from: 'center'
      }
    }, 0);

    // Hold text chars - blur out
    // SLOWER: 0.8s -> 1.4s
    tl.to(holdTextCharRefs.value, {
      filter: 'blur(40px)',
      y: -15,
      scale: 0.95,
      duration: 1.4,
      ease: 'power2.inOut',
      stagger: {
        each: 0.015,
        from: 'center'
      }
    }, 0);

    // Icon - fade and blur slightly (this one can use opacity)
    // SLOWER: 0.6s -> 1.2s
    tl.to(holdIconRef.value, {
      opacity: 0.3,
      filter: 'blur(10px)',
      duration: 1.2,
      ease: 'power2.inOut'
    }, 0);

    // Change ring and icon colors to white
    // SLOWER: 0.6s -> 1.2s
    tl.to('.progress-ring-bg, .progress-ring-progress', {
      stroke: '#ffffff',
      duration: 1.2,
      ease: 'power2.inOut'
    }, 0);

    tl.to('.hold-icon', {
      color: '#ffffff',
      duration: 1.2,
      ease: 'power2.inOut'
    }, 0);
  } else {
    // GOING BACK TO LIGHT: Animate text back in
    const targetColor = '#000000';

    gsap.killTweensOf(charRefs.value);
    gsap.killTweensOf(holdTextCharRefs.value);

    gsap.to(charRefs.value, {
      filter: 'blur(0px)',
      scale: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      stagger: {
        each: 0.02,
        from: 'center'
      }
    });

    gsap.to(holdTextCharRefs.value, {
      filter: 'blur(0px)',
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: 'power2.out',
      stagger: {
        each: 0.01,
        from: 'center'
      }
    });

    gsap.to(holdIconRef.value, {
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.5,
      ease: 'power2.out'
    });

    gsap.to('.intro-heading, .hold-text, .hold-icon, .progress-ring-bg, .progress-ring-progress', {
      color: targetColor,
      stroke: targetColor,
      duration: 0.5,
      ease: 'power2.inOut'
    });
  }
}

// =============================================================================
// TEXT SCRAMBLE EFFECT
// =============================================================================

const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function scrambleText(element, finalText, duration = 800, onComplete) {
  if (!element) return;

  // Clear existing interval
  if (scrambleIntervals.has(element)) {
    clearInterval(scrambleIntervals.get(element));
    scrambleIntervals.delete(element);
  }

  const originalText = finalText;
  const textLength = originalText.length;

  // Single character
  if (textLength === 1) {
    const char = originalText[0];
    if (char === ' ' || /[.,?!'"]/.test(char)) {
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

  // Multi-character
  let frame = 0;
  const totalFrames = Math.ceil(duration / 30);

  const interval = setInterval(() => {
    const progress = Math.min(frame / totalFrames, 1.0);
    let scrambledText = '';

    for (let i = 0; i < textLength; i++) {
      if (originalText[i] === ' ') {
        scrambledText += ' ';
      } else if (/[.,?!'"]/.test(originalText[i])) {
        scrambledText += progress > i / textLength ? originalText[i] : scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
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

// =============================================================================
// TITLE ANIMATIONS
// =============================================================================

function updateTitleWithScramble(newText, onComplete) {
  if (!headingRef.value || isTransitioning.value) return;

  // Clear existing intervals
  charRefs.value.forEach((charEl) => {
    if (charEl && scrambleIntervals.has(charEl)) {
      clearInterval(scrambleIntervals.get(charEl));
      scrambleIntervals.delete(charEl);
    }
  });

  gsap.killTweensOf(charRefs.value);

  // Animate OUT
  if (charRefs.value.length > 0) {
    gsap.to(charRefs.value, {
      opacity: 0,
      x: 100,
      filter: 'blur(60px)',
      duration: 0.6,
      ease: 'power3.in',
      stagger: {
        each: 0.04,
        from: 'start'
      },
      onComplete: () => {
        if (isTransitioning.value) return;

        titleChars.value = newText.split('');
        titleKey.value = Date.now();
        charRefs.value = [];

        showNewTitle(newText, onComplete);
      }
    });
  } else {
    titleChars.value = newText.split('');
    titleKey.value = Date.now();
    charRefs.value = [];
    showNewTitle(newText, onComplete);
  }
}

function showNewTitle(newText, onComplete) {
  if (isTransitioning.value) return;

  nextTick(() => {
    if (isTransitioning.value) return;

    setTimeout(() => {
      if (isTransitioning.value) return;

      const chars = newText.split('');

      const processChars = (retryCount = 0) => {
        if (isTransitioning.value) return;

        const allReady = chars.every((char, index) => {
          return charRefs.value[index] !== undefined && charRefs.value[index] !== null;
        });

        if (allReady || retryCount >= 5) {
          charRefs.value.forEach((charEl, index) => {
            if (charEl && index < chars.length) {
              gsap.set(charEl, {
                opacity: 0,
                x: -100,
                filter: 'blur(60px)',
                visibility: 'visible',
                display: 'inline-block'
              });
            }
          });

          gsap.to(charRefs.value.slice(0, chars.length), {
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
              if (onComplete) {
                setTimeout(onComplete, 400);
              }
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

// =============================================================================
// INITIAL ANIMATIONS
// =============================================================================

function checkPreferences() {
  if (typeof window !== 'undefined') {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

function initAnimations() {
  if (prefersReducedMotion.value) {
    gsap.set([headingRef.value, holdTextRef.value, holdIconRef.value], { opacity: 1 });
    gsap.set(charRefs.value, { opacity: 1, filter: 'blur(0px)' });
    canHold.value = true;
    setTimeout(() => completeHold(), 500);
    return;
  }

  if (!headingRef.value || !holdTextRef.value || !holdIconRef.value) {
    return;
  }

  const tl = gsap.timeline();

  // Set initial states
  tl.set(headingRef.value, { opacity: 0 });
  tl.set(holdTextRef.value, { opacity: 0, y: 30, filter: 'blur(20px)' });
  tl.set(holdIconRef.value, { opacity: 0, y: 30, filter: 'blur(20px)' });

  // Animate heading container
  tl.to(headingRef.value, {
    opacity: 1,
    duration: 0.3,
    ease: 'power2.out'
  });

  // Animate title characters
  nextTick(() => {
    if (charRefs.value.length > 0) {
      tl.set(charRefs.value, {
        opacity: 0,
        x: -100,
        filter: 'blur(60px)'
      });

      tl.to(charRefs.value, {
        opacity: 1,
        x: 0,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power3.out',
        stagger: {
          each: 0.06,
          from: 'start'
        },
        onComplete: () => {
          // Transition to "Humans feel."
          setTimeout(() => {
            if (isTransitioning.value) return;
            updateTitleWithScramble('Humans feel.', () => {
              // Transition to "Are you human?"
              setTimeout(() => {
                if (isTransitioning.value) return;
                updateTitleWithScramble('Are you human?');
                // Show hold instruction
                setTimeout(() => {
                  if (isTransitioning.value) return;
                  animateHoldInstruction();
                }, 1200);
              }, 300);
            });
          }, 300);
        }
      });
    }
  });
}

function animateHoldInstruction() {
  if (!holdTextRef.value || !holdIconRef.value) return;

  // Kill any existing animations
  gsap.killTweensOf(holdTextCharRefs.value);
  gsap.killTweensOf(holdTextRef.value);
  gsap.killTweensOf(holdIconRef.value);

  const tl = gsap.timeline({
    onComplete: () => {
      // NOW allow holding - after the instruction text is visible
      canHold.value = true;
      startPulseAnimation();
    }
  });

  // First, immediately set container visible and characters to starting state
  gsap.set(holdTextRef.value, {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)'
  });

  // Set characters to hidden state BEFORE animating
  if (holdTextCharRefs.value.length > 0) {
    // Immediate set to hidden
    gsap.set(holdTextCharRefs.value, {
      opacity: 0,
      y: 20,
      filter: 'blur(12px)'
    });

    // Then animate TO visible/clear
    tl.to(holdTextCharRefs.value, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.5,
      ease: 'power2.out',
      stagger: {
        each: 0.02,
        from: 'start'
      }
    }, 0);
  }

  // Animate icon at bottom
  tl.to(holdIconRef.value, {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.8,
    ease: 'power3.out'
  }, 0.2);
}

function startPulseAnimation() {
  const icon = holdIconRef.value?.querySelector('.hold-icon');
  if (!icon) return;

  pulseAnimation = gsap.to(icon, {
    scale: 1.1,
    duration: 1.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}

// =============================================================================
// TRANSITION COMPLETE
// =============================================================================

function onTransitionComplete() {
  showIntro.value = false;
  emit('complete');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('intro-complete'));
  }
}

// =============================================================================
// LIFECYCLE
// =============================================================================

onMounted(() => {
  checkPreferences();
  initAudio(); // Initialize audio elements

  nextTick(() => {
    setTimeout(() => {
      initAnimations();
    }, 100);
  });
});

onUnmounted(() => {
  if (holdAnimationId) {
    cancelAnimationFrame(holdAnimationId);
  }
  if (pulseAnimation) {
    pulseAnimation.kill();
  }
  scrambleIntervals.forEach((interval) => clearInterval(interval));
  scrambleIntervals.clear();
});
</script>

<style scoped>
.intro {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent; /* Transparent - starfield shows through */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10; /* Above starfield (z-index: 1) but below WebGL (z-index: 10000) */
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

.intro--dark {
  /* No change needed - starfield handles the dark mode */
}

.intro--transitioning {
  pointer-events: none;
}

/* Main Content - Title + Text in center */
.intro-content {
  text-align: center;
  width: 800px;
  max-width: 90%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  z-index: 10;
  position: relative;
}

.intro-heading {
  font-family: 'PP Neue Machina', sans-serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: #000;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin: 0;
  text-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
  min-height: 70px;
  /* No color transition - GSAP handles the blur/fade animation */
}

.heading-char {
  display: inline-block;
  will-change: transform, filter, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  opacity: 0;
}

.heading-space {
  width: 0.4em;
  min-width: 0.4em;
  display: inline-block;
}

/* Hold Text (below title) */
.hold-text {
  font-family: 'PP Supply Mono', monospace;
  font-size: clamp(14px, 2vw, 18px);
  font-weight: 400;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #000;
  margin: 0;
  /* No color transition - GSAP handles the blur/fade animation */
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  opacity: 0;
}

.hold-text-char {
  display: inline-block;
  will-change: transform, filter, opacity;
}

.hold-text-space {
  width: 0.3em;
  min-width: 0.3em;
}

/* Icon at bottom with progress ring */
.hold-icon-container {
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  opacity: 0;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hold-icon-container--active .hold-icon {
  transform: scale(0.9);
}

/* Progress Ring */
.progress-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  stroke: rgba(0, 0, 0, 0.15);
}

.progress-ring-progress {
  stroke: #000;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.1s ease-out;
}

/* Icon inside ring */
.hold-icon {
  width: 36px;
  height: 36px;
  color: #000;
  transition: transform 0.2s ease;
  z-index: 2;
}

/* Responsive */
@media (max-width: 768px) {
  .intro-heading {
    font-size: clamp(2rem, 10vw, 3rem);
  }

  .hold-text {
    font-size: 12px;
  }

  .hold-icon-container {
    bottom: 40px;
    width: 70px;
    height: 70px;
  }

  .hold-icon {
    width: 30px;
    height: 30px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .intro,
  .intro-heading,
  .hold-text,
  .heading-char,
  .hold-text-char,
  .hold-icon,
  .progress-ring-progress {
    transition: none;
    animation: none;
  }
}

/* Sound Toggle Button - Modern Equalizer */
.sound-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
}

.sound-toggle:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.08);
}

.sound-toggle:active {
  transform: scale(0.95);
}

/* Equalizer bars container */
.eq-bars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5px;
  height: 14px;
}

/* Individual bars - thinner and more rounded */
.eq-bar {
  width: 2px;
  background: #000;
  border-radius: 4px;
  transition: all 0.3s ease;
}

/* Default heights - sm md lg md sm pattern */
.eq-bar:nth-child(1) { height: 5px; }
.eq-bar:nth-child(2) { height: 9px; }
.eq-bar:nth-child(3) { height: 14px; }
.eq-bar:nth-child(4) { height: 9px; }
.eq-bar:nth-child(5) { height: 5px; }

/* Playing state - animate bars */
.sound-toggle--playing .eq-bar {
  animation: eqBounce 0.5s ease-in-out infinite;
}

.sound-toggle--playing .eq-bar:nth-child(1) {
  animation-delay: 0s;
}
.sound-toggle--playing .eq-bar:nth-child(2) {
  animation-delay: 0.1s;
}
.sound-toggle--playing .eq-bar:nth-child(3) {
  animation-delay: 0.2s;
}
.sound-toggle--playing .eq-bar:nth-child(4) {
  animation-delay: 0.1s;
}
.sound-toggle--playing .eq-bar:nth-child(5) {
  animation-delay: 0s;
}

@keyframes eqBounce {
  0%, 100% {
    transform: scaleY(0.35);
  }
  50% {
    transform: scaleY(1);
  }
}

/* Muted state - bars collapse to line */
.sound-toggle--muted .eq-bar {
  height: 2px !important;
  opacity: 0.35;
  animation: none;
}

/* Responsive */
@media (max-width: 768px) {
  .sound-toggle {
    bottom: 16px;
    right: 16px;
    width: 34px;
    height: 34px;
  }

  .eq-bars {
    gap: 2px;
    height: 12px;
  }

  .eq-bar {
    width: 1.5px;
  }

  .eq-bar:nth-child(1) { height: 4px; }
  .eq-bar:nth-child(2) { height: 7px; }
  .eq-bar:nth-child(3) { height: 12px; }
  .eq-bar:nth-child(4) { height: 7px; }
  .eq-bar:nth-child(5) { height: 4px; }
}
</style>
