<template>
  <section
    v-if="showIntro"
    class="intro"
  >
    <!-- Animated Gradient Background -->
    <!-- <AnimatedGradientBackground /> -->

    <!-- Main Intro Content -->
    <div
      ref="introContentRef"
      class="intro-content"
    >
      <h1 ref="headingRef" class="intro-heading">
        <span
          v-for="(char, index) in titleChars"
          :key="`${titleKey}-${index}`"
          :ref="el => { if (el) charRefs[index] = el }"
          class="heading-char"
          :class="{ 'heading-space': char === ' ' }"
        >{{ char === ' ' ? '\u00A0' : char }}</span>
      </h1>

      <div ref="sliderRef" class="slider">
       <div ref="trackRef" class="track">
        <div
          ref="knobRef"
          class="knob"
          tabindex="0"
          role="slider"
          :aria-valuenow="dragProgress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Drag to enter"
          @keydown="handleKeydown"
        />
        <div
          ref="fillRef"
          class="fill"
        />
        <div class="track-content">
          <div ref="indicatorsRef" class="track-indicators">
            <span class="indicator">></span>
            <span class="indicator">></span>
            <span class="indicator">></span>
          </div>
          <p ref="proveTextRef" class="prove-text">Prove your humanity</p>
        </div>
      </div>
    </div>

    <p ref="hintRef" class="intro-subtitle">
      <span
        v-for="(char, index) in hintChars"
        :key="`hint-${index}`"
        :ref="el => { if (el) hintCharRefs[index] = el }"
        class="subtitle-char"
        :class="{ 'subtitle-space': char === ' ' }"
      >{{ char === ' ' ? '\u00A0' : char }}</span>
    </p>
    </div>

    <WebGLPortalTransition
      :active="showTransition"
      @complete="onTransitionComplete"
    />
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, defineAsyncComponent } from 'vue';
import { gsap } from 'gsap';
import Draggable from 'gsap/Draggable';

// Lazy load WebGL transition component (contains Three.js)
const WebGLPortalTransition = defineAsyncComponent(() =>
  import('./WebGLPortalTransition.vue')
);
// import AnimatedGradientBackground from './AnimatedGradientBackground.vue';

// Only register plugin on client-side
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable);
}

const emit = defineEmits(['complete']);

const introContentRef = ref(null);
const headingRef = ref(null);
const sliderRef = ref(null);
const trackRef = ref(null);
const knobRef = ref(null);
const fillRef = ref(null);
const hintRef = ref(null);
const proveTextRef = ref(null);
const indicatorsRef = ref(null);

const dragProgress = ref(0);
const isTransitioning = ref(false);
const showTransition = ref(false);
const prefersReducedMotion = ref(false);
const showIntro = ref(true);

// Title animation - starts with "Machines calculate."
const titleChars = ref('Machines calculate.'.split(''));
const charRefs = ref([]);
const titleKey = ref(Date.now()); // Unique key to force Vue to recreate elements

// Hint text animation
const hintChars = ref("Drag to show you're more than code.".split(''));
const hintCharRefs = ref([]);

let draggable = null;
let pulseAnimation = null;
let flashAnimations = [];
let isBouncingBack = false;
const scrambleIntervals = new Map();


const textThresholds = [
  { progress: 0, text: 'Drag to show you\'re more than code.' },
  { progress: 20, text: 'Data moves. But does it feel?' },
  { progress: 40, text: 'Signal... or intention?' },
  { progress: 60, text: 'I sense awareness.' },
  { progress: 95, text: 'Welcome, Human.' }
];

function checkPreferences() {
  if (typeof window !== 'undefined') {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

// Scramble text effect utility
const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function scrambleText(element, finalText, duration = 800, onComplete) {
  if (!element) return;

  // Clear any existing interval for this element
  if (scrambleIntervals.has(element)) {
    clearInterval(scrambleIntervals.get(element));
    scrambleIntervals.delete(element);
  }

  const originalText = finalText;
  const textLength = originalText.length;
  
  // Handle single character case (for individual character elements)
  if (textLength === 1) {
    const char = originalText[0];
    // If it's a space or punctuation, just set it directly
    if (char === ' ' || char === '.' || char === ',' || char === '?' || char === '!' || char === "'") {
      element.textContent = char;
      if (onComplete) onComplete();
      return;
    }
    
    // For single characters, do a quick scramble reveal
    let frame = 0;
    const totalFrames = Math.max(5, duration / 30); // At least 5 frames
    
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

  // Handle multi-character text
  let frame = 0;
  const totalFrames = Math.ceil(duration / 30); // ~30fps, ensure we finish

  const interval = setInterval(() => {
    const progress = Math.min(frame / totalFrames, 1.0);
    let scrambledText = '';

    for (let i = 0; i < textLength; i++) {
      if (originalText[i] === ' ') {
        scrambledText += ' ';
      } else if (originalText[i] === '.' || originalText[i] === ',' || originalText[i] === '?' || originalText[i] === '!' || originalText[i] === "'") {
        // Keep punctuation as is once revealed
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
      // Ensure final text is set correctly
      element.textContent = originalText;
      if (onComplete) onComplete();
    }
  }, 30);
  
  scrambleIntervals.set(element, interval);
}

function updateTitleWithScramble(newText, onComplete) {
  if (!headingRef.value || isTransitioning.value) return;

  // Clear any existing intervals
  charRefs.value.forEach((charEl) => {
    if (charEl && scrambleIntervals.has(charEl)) {
      clearInterval(scrambleIntervals.get(charEl));
      scrambleIntervals.delete(charEl);
    }
  });

  // Kill any existing GSAP animations
  gsap.killTweensOf(charRefs.value);

  // Animate OUT old title: left to right with huge blur
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

        // After animation, swap the text
        titleChars.value = newText.split('');
        titleKey.value = Date.now();
        charRefs.value = [];

        // Start fade in animation
        showNewTitle(newText, onComplete);
      }
    });
  } else {
    // No old chars, just show new
    titleChars.value = newText.split('');
    titleKey.value = Date.now();
    charRefs.value = [];
    showNewTitle(newText, onComplete);
  }
}

function showNewTitle(newText, onComplete) {
  if (isTransitioning.value) return;

  // Wait for Vue to create new elements
  nextTick(() => {
    if (isTransitioning.value) return;

    setTimeout(() => {
      if (isTransitioning.value) return;

      const chars = newText.split('');

      // Wait for all character refs to be ready
      const processChars = (retryCount = 0) => {
        if (isTransitioning.value) return;
        const allReady = chars.every((char, index) => {
          return charRefs.value[index] !== undefined && charRefs.value[index] !== null;
        });

        if (allReady || retryCount >= 5) {
          // Set initial state: off-screen left with huge blur
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

          // Animate IN: left to right with huge blur clearing
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

function skipIntro() {
  startTransition();
}

function initAnimations() {
  if (prefersReducedMotion.value) {
    gsap.set([headingRef.value, sliderRef.value], { opacity: 1 });
    if (trackRef.value) {
      gsap.set(trackRef.value, { scaleX: 1 });
    }
    if (knobRef.value) {
      gsap.set(knobRef.value, { 
        opacity: 1, 
        scale: 1, 
        rotation: 0,
        y: 0,
        filter: 'blur(0px)',
        visibility: 'visible' 
      });
    }
    gsap.set(charRefs.value, { opacity: 1, filter: 'blur(0px)' });
    setTimeout(() => skipIntro(), 500);
    return;
  }

  if (!headingRef.value || !sliderRef.value || !trackRef.value) {
    console.warn('Animation elements not ready');
    return;
  }

  const tl = gsap.timeline();

  // Set heading container to opacity 0 initially
  if (headingRef.value) {
    tl.set(headingRef.value, {
      opacity: 0
    });
  }

  // Set all track content to opacity 0 initially (at the very start)
  if (knobRef.value && indicatorsRef.value && proveTextRef.value) {
    tl.set([knobRef.value, indicatorsRef.value, proveTextRef.value], {
      opacity: 0
    });
    tl.set(knobRef.value, {
      scale: 0,
      rotation: -180,
      y: 20,
      filter: 'blur(10px)',
      visibility: 'hidden'
    });
  }

  // Animate heading container opacity first
  if (headingRef.value) {
    tl.to(headingRef.value, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  }

  // Step 1: Animate "Machines calculate." with blur effect from left to right
  // Wait for charRefs to be populated
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
          // Step 2: After "Machines calculate." appears, wait then transition to "Humans feel."
          setTimeout(() => {
            if (isTransitioning.value) return;
            updateTitleWithScramble('Humans feel.', () => {
              // Step 3: After "Humans feel.", transition to "Are you human?" AND animate slider 0.6s later
              setTimeout(() => {
                if (isTransitioning.value) return;
                updateTitleWithScramble('Are you human?');
                // Animate slider 0.6s after "Are you human?" starts
                setTimeout(() => {
                  if (isTransitioning.value) return;
                  animateSlider();
                }, 1200);
              }, 300);
            });
          }, 300);
        }
      });
    }
  });
}

function animateSlider() {
  if (!sliderRef.value || !knobRef.value) return;

  const tl = gsap.timeline();

  // Set initial state
  tl.set(sliderRef.value, {
    opacity: 0,
    scale: 0.5,
    y: 100,
    filter: 'blur(200px)',
  })
  .set(knobRef.value, {
    visibility: 'visible'
  })
  // Animate slider in
  .to(sliderRef.value, {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 2,
    ease: 'power4.inOut'
  })
  .to(knobRef.value, {
    scale: 1,
    opacity: 1,
    rotation: 0,
    y: 0,
    filter: 'blur(0px)',
    duration: 0.7,
    ease: 'back.out(2.5)',
    force3D: true,
    onComplete: () => {
      if (knobRef.value) {
        gsap.set(knobRef.value, {
          opacity: 1,
          scale: 1,
          rotation: 0,
          y: 0,
          filter: 'blur(0px)',
          visibility: 'visible'
        });
      }
    }
  }, '-=0.5')
  .to(indicatorsRef.value, {
    opacity: 1,
    duration: 0.4,
    ease: 'power2.out'
  }, '-=0.2')
  .to(proveTextRef.value, {
    opacity: 1,
    duration: 0.4,
    ease: 'power2.out',
    onComplete: () => {
      if (proveTextRef.value) {
        scrambleText(proveTextRef.value, 'Prove your humanity', 600);
      }
    }
  }, '-=0.1');

  // Animate hint text at the same time as slider
  if (hintRef.value && hintCharRefs.value.length > 0) {
    tl.set(hintRef.value, { opacity: 1 }, 0)
    .set(hintCharRefs.value, {
      opacity: 0,
      y: 20,
      filter: 'blur(15px)'
    }, 0)
    .to(hintCharRefs.value, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.8,
      ease: 'power3.out',
      stagger: {
        each: 0.03,
        from: 'start'
      }
    }, 0.5); // Start 0.5s into the timeline
  }
}

function initDraggable() {
  if (!knobRef.value || !sliderRef.value || prefersReducedMotion.value) return;

  const trackWidth = sliderRef.value.offsetWidth;
  const knobWidth = knobRef.value.offsetWidth;
  const trackPadding = 6;
  const knobOffset = 3; // Offset to align knob better
  const maxX = trackWidth - knobWidth - (trackPadding * 2);

  draggable = Draggable.create(knobRef.value, {
    type: 'x',
    bounds: {
      minX: trackPadding - knobOffset,
      maxX: maxX + trackPadding - knobOffset
    },
    onDrag: updateDragProgress,
    onDragEnd: handleDragEnd,
    inertia: true,
    throwProps: true
  })[0];

  // Set knob position - ensure it's visible and properly positioned
  // Check if animation already completed, if not wait for it
  const currentOpacity = gsap.getProperty(knobRef.value, 'opacity') || 0;
  const currentScale = gsap.getProperty(knobRef.value, 'scale') || 0;
  
  gsap.set(knobRef.value, { 
    x: trackPadding - 3,
    visibility: 'visible'
  });
  
  // Only set scale/opacity if they're still at initial values (animation hasn't run yet)
  if (currentOpacity === 0 || currentScale === 0) {
    gsap.set(knobRef.value, {
      scale: 1,
      opacity: 1,
      rotation: 0,
      y: 0,
      filter: 'blur(0px)'
    });
  }
  
  if (fillRef.value) {
    fillRef.value.style.width = '0px';
    fillRef.value.style.opacity = '0';
  }
  
  // Add subtle pulse animation to knob
  pulseAnimation = gsap.to(knobRef.value, {
    scale: 1.02,
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
  
  // Add subtle staggered flash animation to arrows and prove text
  if (indicatorsRef.value && proveTextRef.value) {
    const indicators = indicatorsRef.value.querySelectorAll('.indicator');
    
    // Clear any existing flash animations
    flashAnimations.forEach(anim => anim.kill());
    flashAnimations = [];
    
    // Flash animation for indicators (staggered)
    indicators.forEach((indicator, index) => {
      const anim = gsap.to(indicator, {
        opacity: 0.4,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.2
      });
      flashAnimations.push(anim);
    });
    
    // Flash animation for prove text (slightly delayed)
    const proveAnim = gsap.to(proveTextRef.value, {
      opacity: 0.6,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.3
    });
    flashAnimations.push(proveAnim);
  }

  window.addEventListener('resize', handleResize);
}

function handleResize() {
  if (!draggable || !sliderRef.value || !knobRef.value) return;
  
  const trackWidth = sliderRef.value.offsetWidth;
  const knobWidth = knobRef.value.offsetWidth;
  const trackPadding = 6;
  const knobOffset = 3;
  const maxX = trackWidth - knobWidth - (trackPadding * 2);
  
  draggable.applyBounds({
    minX: trackPadding - knobOffset,
    maxX: maxX + trackPadding - knobOffset
  });
  
  const currentX = draggable.x - (trackPadding - knobOffset);
  dragProgress.value = Math.min(100, (currentX / maxX) * 100);
}

function updateDragProgress() {
  if (!draggable || !sliderRef.value || !knobRef.value) return;
  
  // Stop pulse animation when dragging
  if (pulseAnimation) {
    pulseAnimation.kill();
    pulseAnimation = null;
  }
  
  const trackWidth = sliderRef.value.offsetWidth;
  const knobWidth = knobRef.value.offsetWidth;
  const trackPadding = 6;
  const knobOffset = 3;
  const maxX = trackWidth - knobWidth - (trackPadding * 2);
  const currentX = draggable.x - (trackPadding - knobOffset);
  const progress = Math.min(100, Math.max(0, (currentX / maxX) * 100));
  
  dragProgress.value = progress;
  
  // Fade out "Prove your humanity" and arrows when dragging starts
  if (proveTextRef.value) {
    if (progress > 0) {
      // Stop flash animations when dragging
      flashAnimations.forEach(anim => anim.kill());
      flashAnimations = [];
      
      gsap.to(proveTextRef.value, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    } else {
      gsap.to(proveTextRef.value, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      // Restart flash animations when back at start
      if (indicatorsRef.value && proveTextRef.value && flashAnimations.length === 0) {
        const indicators = indicatorsRef.value.querySelectorAll('.indicator');
        
        indicators.forEach((indicator, index) => {
          const anim = gsap.to(indicator, {
            opacity: 0.4,
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: index * 0.2
          });
          flashAnimations.push(anim);
        });
        
        const proveAnim = gsap.to(proveTextRef.value, {
          opacity: 0.6,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.3
        });
        flashAnimations.push(proveAnim);
      }
    }
  }
  
  if (indicatorsRef.value) {
    if (progress > 0) {
      gsap.to(indicatorsRef.value, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    } else {
      gsap.to(indicatorsRef.value, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }
  
  if (fillRef.value && !isBouncingBack) {
    const fillWidth = currentX + knobWidth / 2;
    
    if (progress > 0) {
      // Show fill when dragging starts
      gsap.to(fillRef.value, {
        opacity: 1,
        duration: 0.2,
        ease: 'power2.out'
      });
      
      // Use GSAP for smooth animation
      gsap.to(fillRef.value, {
        width: `${fillWidth}px`,
        duration: 0.15,
        ease: 'power2.out'
      });
    } else {
      // Hide fill when at start
      gsap.to(fillRef.value, {
        opacity: 0,
        width: '0px',
        duration: 0.2,
        ease: 'power2.out'
      });
    }
  }
  
  // Add subtle scale effect to knob during drag
  if (knobRef.value) {
    const scale = 1 + (progress / 100) * 0.05; // Slight scale increase as progress increases
    gsap.to(knobRef.value, {
      scale: scale,
      duration: 0.1,
      ease: 'power2.out'
    });
  }
  
  updateDynamicText(progress);
}

let currentTextIndex = 0;

function updateDynamicText(progress) {
  // Find the appropriate text threshold
  let targetIndex = -1;
  for (let i = textThresholds.length - 1; i >= 0; i--) {
    if (progress >= textThresholds[i].progress) {
      targetIndex = i;
      break;
    }
  }
  
  // Only update if text actually changed and we found a valid threshold
  if (targetIndex !== -1 && currentTextIndex !== targetIndex) {
    currentTextIndex = targetIndex;
    const newText = textThresholds[targetIndex].text;

    // Update the characters array
    hintChars.value = newText.split('');

    // Wait for DOM update, then animate each character with scramble effect
    setTimeout(() => {
      // Animate characters appearing from bottom with blur
      gsap.set(hintCharRefs.value, {
        opacity: 0,
        y: 10,
        filter: 'blur(10px)'
      });

      gsap.to(hintCharRefs.value, {
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

      // Apply scramble effect to each character individually
      // Clear any existing intervals first
      hintCharRefs.value.forEach((charEl) => {
        if (charEl && scrambleIntervals.has(charEl)) {
          clearInterval(scrambleIntervals.get(charEl));
          scrambleIntervals.delete(charEl);
        }
      });

      // Then apply scramble to each character
      hintCharRefs.value.forEach((charEl, index) => {
        if (charEl && index < newText.length) {
          const char = newText[index];
          if (char !== ' ') {
            scrambleText(charEl, char, 400);
          } else {
            // Set non-breaking space for proper spacing
            charEl.textContent = '\u00A0';
          }
        }
      });
    }, 10);
  }
}

function handleDragEnd() {
  // Restart pulse animation if not completed
  if (dragProgress.value < 95 && knobRef.value && !pulseAnimation) {
    pulseAnimation = gsap.to(knobRef.value, {
      scale: 1.02,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  if (dragProgress.value >= 95) {
    // Small delay to let any final animations settle before starting transition
    setTimeout(() => {
      startTransition();
    }, 100);
  } else if (dragProgress.value > 0) {
    const trackPadding = 6;
    const knobOffset = 3;
    
    // Set flag to prevent fill updates during bounce-back
    isBouncingBack = true;
    
    // Animate fill back to 0
    if (fillRef.value) {
      gsap.to(fillRef.value, {
        width: '0px',
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
    
    gsap.to(knobRef.value, {
      x: trackPadding - knobOffset,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        updateDragProgress();
      },
      onComplete: () => {
        isBouncingBack = false;
        dragProgress.value = 0;
        if (fillRef.value) {
          fillRef.value.style.width = '0px';
          fillRef.value.style.opacity = '0';
        }
        // Fade in "Prove your humanity" and arrows when coming back
        if (proveTextRef.value) {
          gsap.to(proveTextRef.value, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
        if (indicatorsRef.value) {
          gsap.to(indicatorsRef.value, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
        
        // Restart flash animations after fade in completes
        setTimeout(() => {
          if (indicatorsRef.value && proveTextRef.value && flashAnimations.length === 0) {
            const indicators = indicatorsRef.value.querySelectorAll('.indicator');
            
            indicators.forEach((indicator, index) => {
              const anim = gsap.to(indicator, {
                opacity: 0.4,
                duration: 0.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: index * 0.2
              });
              flashAnimations.push(anim);
            });
            
            const proveAnim = gsap.to(proveTextRef.value, {
              opacity: 0.6,
              duration: 1.2,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              delay: 0.3
            });
            flashAnimations.push(proveAnim);
          }
        }, 300);
      }
    });
  }
}

function handleKeydown(e) {
  if (!sliderRef.value || !knobRef.value) return;
  
  const trackWidth = sliderRef.value.offsetWidth;
  const knobWidth = knobRef.value.offsetWidth;
  const trackPadding = 6;
  const knobOffset = 3;
  const maxX = trackWidth - knobWidth - (trackPadding * 2);
  const step = maxX / 20;
  
  let currentX = draggable ? draggable.x - (trackPadding - knobOffset) : 0;
  let newX = currentX;
  
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    newX = Math.min(maxX, currentX + step);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    newX = Math.max(0, currentX - step);
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (dragProgress.value >= 95) {
      startTransition();
    } else {
      gsap.to(knobRef.value, {
        x: maxX * 0.95 + trackPadding - knobOffset,
        duration: 0.5,
        ease: 'power2.out',
        onUpdate: () => {
          updateDragProgress();
        },
        onComplete: () => {
          startTransition();
        }
      });
    }
    return;
  }
  
  if (draggable) {
    draggable.update();
    gsap.to(knobRef.value, {
      x: newX + trackPadding - knobOffset,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        updateDragProgress();
      }
    });
  }
}

function startTransition() {
  if (isTransitioning.value) return;

  isTransitioning.value = true;

  console.log('🚀 startTransition called');

  // Stop specific animations and intervals - but NOT the intro-content fade out
  // Kill animations on specific elements that might still be running
  if (headingRef.value) gsap.killTweensOf(headingRef.value);
  charRefs.value.forEach(el => { if (el) gsap.killTweensOf(el); });
  if (sliderRef.value) gsap.killTweensOf(sliderRef.value);
  if (knobRef.value) gsap.killTweensOf(knobRef.value);
  if (fillRef.value) gsap.killTweensOf(fillRef.value);
  if (hintRef.value) gsap.killTweensOf(hintRef.value);
  hintCharRefs.value.forEach(el => { if (el) gsap.killTweensOf(el); });
  if (proveTextRef.value) gsap.killTweensOf(proveTextRef.value);
  if (indicatorsRef.value) gsap.killTweensOf(indicatorsRef.value);

  flashAnimations.forEach(anim => anim.kill());
  flashAnimations = [];
  if (pulseAnimation) {
    pulseAnimation.kill();
    pulseAnimation = null;
  }
  scrambleIntervals.forEach((interval) => clearInterval(interval));
  scrambleIntervals.clear();

  // Now fade out the entire intro content using the ref
  if (introContentRef.value) {
    gsap.to(introContentRef.value, {
      opacity: 0,
      scale: 0.95,
      filter: 'blur(20px)',
      duration: 0.8,
      ease: 'power2.in',
      onComplete: () => {
        console.log('Fade out complete');
      }
    });
  }

  // Start the WebGL transition immediately
  showTransition.value = true;

  // Dispatch event for HeroSection to start animations 0.3s before transition completes
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('transition-start'));
  }

  console.log('Transition started, WebGL canvas should be visible');
}

function onTransitionComplete() {
  console.log('WebGL transition complete, cleaning up intro');

  // Now we can safely hide the intro and show the landing page
  showIntro.value = false;
  emit('complete');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('intro-complete'));
  }
}

onMounted(() => {
  checkPreferences();
  
  // Wait for DOM to be fully ready
  nextTick(() => {
    setTimeout(() => {
      if (!trackRef.value) {
        console.error('trackRef not found');
        return;
      }
      initAnimations();
      setTimeout(() => {
        initDraggable();
      }, 1000);
    }, 100);
  });
});

onUnmounted(() => {
  if (draggable) {
    draggable.kill();
  }
  // Clear all scramble intervals
  scrambleIntervals.forEach((interval) => {
    clearInterval(interval);
  });
  scrambleIntervals.clear();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.intro {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fffdfc;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
}

/* Main Intro Content */
.intro-content {
  text-align: center;
  width: 800px;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
}

.intro-heading {
  font-family: 'PP Neue Machina', sans-serif;
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  opacity: 0;
  color: #000;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin: 0px;
  text-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
  height: 70px;
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

.subtitle-char {
  display: inline-block;
  will-change: transform, filter, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
}

.subtitle-space {
  width: 0.3em;
  min-width: 0.3em;
  display: inline-block;
}

.slider {
  position: relative;
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
  opacity: 0;
  filter: blur(200px);
  will-change: filter, opacity;
}

.track {
  position: relative;
  width: 100%;
  height: 76px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid #fff;
  border-radius: 48px;
  margin-bottom: 0;
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.1),
    2.444px 2.278px 10.52px 0px inset rgba(255, 255, 255, 0.2),
    1.515px 1.412px 5.26px 0px inset rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  padding: 6px;
  gap: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center center;
}

.track::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 48px;
  pointer-events: none;
  opacity: 0.6;
}

.track:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow:
    0 12px 40px 0 rgba(0, 0, 0, 0.12),
    2.444px 2.278px 10.52px 0px inset rgba(255, 255, 255, 0.25),
    1.515px 1.412px 5.26px 0px inset rgba(255, 255, 255, 0.18);
}

.track-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding-left: 6px;
  padding-right: 36px;
  pointer-events: none;
  position: relative;
}

.track-indicators {
  display: flex;
  align-items: center;
  gap: 0;
  height: 20px;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.indicator {
  display: inline-block;
  color: #000;
  font-family: 'PP Supply Mono', monospace;
  font-size: 32px;
  line-height: 0.965;
  font-weight: 400;
  opacity: 1;
  margin-top: -5px;
}

.prove-text {
  color: #000;
  font-family: 'PP Supply Mono', monospace;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 400;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.3s ease;
  white-space: nowrap;
  margin-left: 10px !important;
  margin: 0px;
}

.fill {
  position: absolute;
  top: 6px;
  left: 6px;
  height: calc(100% - 12px);
  background: linear-gradient(
    90deg,
    rgba(198, 97, 29, 0.25) 0%,
    rgba(198, 97, 29, 0.3) 50%,
    rgba(198, 97, 29, 0.25) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 48px;
  transition: width 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  box-shadow:
    0 4px 16px 0 rgba(198, 97, 29, 0.15),
    1.858px 1.732px 6px 0px inset rgba(255, 255, 255, 0.2),
    0 0 20px 0 rgba(198, 97, 29, 0.1);
  pointer-events: none;
  z-index: 1;
  max-width: calc(100% - 24px);
  overflow: hidden;
  opacity: 0;
  width: 0px;
}

.fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 3s infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.knob {
  position: relative;
  width: 56px;
  height: 56px;
  background: linear-gradient(
    135deg,
    rgba(198, 97, 29, 0.3) 0%,
    rgba(198, 97, 29, 0.25) 50%,
    rgba(198, 97, 29, 0.3) 100%
  );
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  border-radius: 48px;
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 20px 0 rgba(198, 97, 29, 0.2),
    0 2px 8px 0 rgba(0, 0, 0, 0.1),
    1.858px 1.732px 6px 0px inset rgba(255, 255, 255, 0.25),
    0 0 0 0 rgba(198, 97, 29, 0.3);
  flex-shrink: 0;
  will-change: transform, box-shadow, opacity, filter;
  opacity: 0;
  transform: scale(0) rotate(-180deg) translateY(20px);
  visibility: hidden;
  filter: blur(10px);
}

.knob::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 60%
  );
  pointer-events: none;
  opacity: 0.8;
}

.knob::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  background: #000;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M9 5l7 7-7 7'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M2 5l7 7-7 7'/%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M9 5l7 7-7 7'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M2 5l7 7-7 7'/%3E%3C/svg%3E");
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-position: center;
  z-index: 2;
  margin-left: 8px;
}

.knob:hover {
  transform: scale(1.08);
  background: linear-gradient(
    135deg,
    rgba(198, 97, 29, 0.35) 0%,
    rgba(198, 97, 29, 0.3) 50%,
    rgba(198, 97, 29, 0.35) 100%
  );
  border-color: rgba(255, 255, 255, 0.7);
  box-shadow:
    0 6px 30px 0 rgba(198, 97, 29, 0.3),
    0 4px 12px 0 rgba(0, 0, 0, 0.15),
    1.858px 1.732px 6px 0px inset rgba(255, 255, 255, 0.3),
    0 0 0 2px rgba(198, 97, 29, 0.2);
}

.knob:active {
  cursor: grabbing;
  transform: scale(0.96);
  box-shadow:
    0 2px 10px 0 rgba(198, 97, 29, 0.25),
    0 1px 4px 0 rgba(0, 0, 0, 0.2),
    1.858px 1.732px 6px 0px inset rgba(255, 255, 255, 0.2),
    0 0 0 1px rgba(198, 97, 29, 0.3);
}

.knob:focus {
  outline: none;
  box-shadow:
    1.858px 1.732px 6px 0px inset rgba(255, 255, 255, 0.15),
    0 0 0 2px rgba(0, 0, 0, 0.2);
}

.intro-subtitle {
  position: fixed;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'PP Supply Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 400;
  color: #000;
  opacity: 0;
  text-align: center;
  width: 100%;
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.3s ease;
  padding: 0 2rem;
}

@media (max-width: 768px) {
  .intro-heading {
    margin-bottom: 4rem;
    font-size: clamp(2.5rem, 10vw, 4rem);
  }

  .track {
    height: 60px;
  }

  .knob {
    width: 52px;
    height: 52px;
  }

  .knob::before {
    width: 20px;
    height: 20px;
  }

  .intro-subtitle {
    font-size: 1rem;
    bottom: 32px;
    padding: 0 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .intro-heading,
  .slider,
  .fill,
  .knob,
  .dynamic-text,
  .heading-char,
  .subtitle-char {
    transition: none;
    animation: none;
  }
}
</style>

