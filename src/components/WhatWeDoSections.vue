<template>
  <section class="what-we-do-sections">
    <section
      v-for="(section, index) in sections"
      :key="index"
      class="what-we-do-section"
      :class="[`what-we-do-section--${section.variant}`]"
      :data-name="section.sectionName"
      :data-index="index"
      ref="sectionRefs"
    >
      <div class="section-inner">
        <!-- Title-only variant -->
        <ul v-if="section.variant === 'title-only'" class="section-title-only">
          <li v-for="(word, wordIndex) in splitTitle(section.title)" :key="wordIndex">
            <span
              v-for="(letter, letterIndex) in word"
              :key="letterIndex"
              class="letter"
            >
              <span>{{ letter === ' ' ? '\u00A0' : letter }}</span>
              <span>{{ letter === ' ' ? '\u00A0' : letter }}</span>
            </span>
          </li>
        </ul>

        <!-- Regular variant -->
        <template v-else>
          <div class="what-we-do-header">
            <p class="section-label">{{ section.label }}</p>
            <h2 :class="['section-title', { 'section-title--italic': section.italic }]">
              {{ section.title }}
            </h2>
          </div>
          <div class="what-we-do-content">
            <p class="section-description" v-html="section.description"></p>
          </div>
        </template>
      </div>
    </section>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useGsap } from '../composables/useGsap.js';

const { gsap, loadScrollTrigger } = useGsap();

const sections = [
  {
    sectionName: 'What We Do Section',
    label: '01 Discovery',
    title: 'The AI studio for human advantage.',
    description: `<span class="bold">Are You Human</span> is the <span class="bold">AI studio for leaders</span> who want to win with AI. Without losing what makes them irreplaceable. We design, integrate, and deploy <span class="bold">human-first AI</span> systems using the worlds best third-party technologies, chosen for impact, not hype.`,
    variant: 'default',
    italic: false
  },
  {
    sectionName: 'What We Do Section',
    label: '02 Strategy',
    title: 'The smarter AI becomes, the more valuable your humanity.',
    description: `We believe AI should <span class="bold">amplify human strengths</span>, not automate them away.<br>Every system we build is crafted to enhance what makes you irreplaceable.`,
    variant: 'dark',
    italic: false
  },
  {
    sectionName: 'What We Do Section',
    label: '03 Design',
    title: 'Designing with the brain in mind.',
    description: `We apply <span class="bold">cognitive psychology</span> to ensure every <span class="bold">AI interaction enhances</span>, not overwhelms, human intelligence.`,
    variant: 'darker',
    italic: false
  },
  {
    sectionName: 'What We Do Section',
    label: '',
    title: 'The Human Advantage Framework',
    description: '',
    variant: 'title-only',
    italic: false
  }
];

const sectionRefs = ref([]);
let scrollTriggers = [];
let titleAnimation = null;

const splitTitle = (title) => {
  // Keep "The Human" together on one line, then split rest
  // "The Human Advantage Framework" -> ["The Human", "Advantage", "Framework"]
  const parts = title.split(' ');
  const result = [];
  
  // Combine "The" and "Human" if they exist
  if (parts[0] === 'The' && parts[1] === 'Human') {
    result.push('The Human');
    result.push(...parts.slice(2));
  } else {
    result.push(...parts);
  }
  
  // Split each word/phrase into letters, preserving spaces
  return result.map(word => {
    // Split into characters, keeping spaces
    return word.split('').map(char => char === ' ' ? ' ' : char);
  });
};

const initStickyCards = async () => {
  try {
    await nextTick();

    // Load ScrollTrigger before using it
    const ScrollTrigger = await loadScrollTrigger();
    if (!ScrollTrigger) {
      console.error('WhatWeDoSections: ScrollTrigger failed to load');
      return;
    }

    // Ensure ScrollTrigger is registered (it should already be registered in loadScrollTrigger, but double-check)
    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (e) {
      // Plugin might already be registered, that's okay
      console.log('WhatWeDoSections: ScrollTrigger already registered or registration skipped');
    }

    // Wait a bit for layout to settle and ensure ScrollTrigger is ready
    await new Promise(resolve => setTimeout(resolve, 300));

    // Ensure refs are populated - Vue might need a moment
    let sectionElements = sectionRefs.value;
    
    // If refs aren't ready, try querying DOM directly as fallback
    if (sectionElements.length === 0) {
      console.warn('WhatWeDoSections: Refs not ready, querying DOM directly...');
      const container = document.querySelector('.what-we-do-sections');
      if (container) {
        sectionElements = Array.from(container.querySelectorAll('.what-we-do-section'));
      }
    }
    
    if (!sectionElements || sectionElements.length === 0) {
      console.warn('WhatWeDoSections: No sections found');
      return;
    }
    
    console.log('WhatWeDoSections: Initializing sticky cards with', sectionElements.length, 'sections');
    
    sectionElements.forEach((section, index) => {
      if (index < sectionElements.length - 1 && section) {
        const sectionInner = section.querySelector('.section-inner');
        const nextSection = sectionElements[index + 1];

        if (sectionInner && nextSection) {
          console.log(`WhatWeDoSections: Setting up animation for section ${index}`);
          
          // Set initial state explicitly
          gsap.set(sectionInner, {
            y: '0%',
            z: 0,
            rotationX: 0,
          });

          // Main 3D transform animation
          const transformTrigger = gsap.fromTo(
            sectionInner,
            {
              y: '0%',
              z: 0,
              rotationX: 0,
            },
            {
              y: '-50%',
              z: -250,
              rotationX: 45,
              ease: 'none',
              scrollTrigger: {
                trigger: nextSection,
                start: 'top 85%',
                end: 'top -75%',
                scrub: true,
                pin: section,
                pinSpacing: false,
                invalidateOnRefresh: true,
              },
            }
          );

          // Overlay fade effect
          const opacityTrigger = gsap.to(sectionInner, {
            '--after-opacity': 1,
            ease: 'none',
            scrollTrigger: {
              trigger: nextSection,
              start: 'top 75%',
              end: 'top -25%',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });

          scrollTriggers.push(transformTrigger, opacityTrigger);
        } else {
          console.warn(`WhatWeDoSections: Missing elements for section ${index}:`, { sectionInner, nextSection });
        }
      }
    });
    
    // Refresh ScrollTrigger after all animations are set up
    // Delay longer to coordinate with other components
    setTimeout(() => {
      ScrollTrigger.refresh();
      console.log('WhatWeDoSections: ScrollTrigger refreshed');
    }, 600);
  } catch (error) {
    console.error('WhatWeDoSections: Error initializing sticky cards', error);
  }
};

const initTitleAnimation = async (retryCount = 0) => {
  const MAX_RETRIES = 5;
  
  if (titleAnimation) return; // Prevent duplicate initialization
  
  // Wait for intro animation to complete
  await new Promise((resolve) => {
    const checkIntroComplete = () => {
      const mainContent = document.getElementById('main-content');
      if (mainContent && !mainContent.classList.contains('landing--hidden')) {
        resolve();
      } else {
        window.addEventListener('intro-complete', () => {
          setTimeout(() => resolve(), 500);
        }, { once: true });
      }
    };
    checkIntroComplete();
  });
  
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Find the title-only section first
  const titleSection = document.querySelector('.what-we-do-section--title-only');
  if (!titleSection) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`WhatWeDoSections: Title section not found, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => initTitleAnimation(retryCount + 1), 500);
    } else {
      console.error('WhatWeDoSections: Title section not found after max retries');
    }
    return;
  }
  
  // Find ul element inside the section (matching StatementSection pattern)
  const ulElement = titleSection.querySelector('ul.section-title-only');
  if (!ulElement) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`WhatWeDoSections: UL element not found, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => initTitleAnimation(retryCount + 1), 500);
    } else {
      console.error('WhatWeDoSections: UL element not found after max retries');
    }
    return;
  }
  
  const letterElements = ulElement.querySelectorAll('.letter');
  if (letterElements.length === 0) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`WhatWeDoSections: Letter elements not found, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => initTitleAnimation(retryCount + 1), 500);
    } else {
      console.error('WhatWeDoSections: Letter elements not found after max retries');
    }
    return;
  }
  
  // Use same import pattern as StatementSection (with .js extension)
  const [{ gsap: gsapModule }, { default: ScrollTrigger }] = await Promise.all([
    import('gsap'),
    // @ts-ignore
    import('gsap/ScrollTrigger.js')
  ]);
  
  gsapModule.registerPlugin(ScrollTrigger);
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('WhatWeDoSections: Creating title animation with', letterElements.length, 'letters');
  
  // Set initial state
  gsapModule.set(letterElements, {
    yPercent: 0
  });
  
  titleAnimation = gsapModule.to(letterElements, {
    yPercent: 100,
    ease: 'power1.inOut',
    scrollTrigger: {
      trigger: ulElement,
      start: '33.33% bottom',
      end: '100% 80%',
      scrub: 1,
      invalidateOnRefresh: true,
    },
    stagger: {
      each: 0.05,
      from: 'random'
    }
  });
  
  setTimeout(() => {
    ScrollTrigger.refresh();
    console.log('WhatWeDoSections: Title animation created and ScrollTrigger refreshed');
  }, 100);
};

onMounted(async () => {
  // Ensure ScrollTrigger is ready
  if (typeof window !== 'undefined') {
    await nextTick();

    // Wait longer for DOM and other components to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Initialize title animation - wait for title section to render
    if (!titleAnimation) {
      setTimeout(() => {
        initTitleAnimation();
      }, 500);
    }

    // Verify sections exist before initializing
    if (sectionRefs.value && sectionRefs.value.length > 0) {
      initStickyCards();
    } else {
      console.warn('WhatWeDoSections: Sections not ready, retrying...');
      setTimeout(() => {
        initStickyCards();
      }, 800);
    }
  }
});

onUnmounted(() => {
  scrollTriggers.forEach(trigger => {
    if (trigger && trigger.scrollTrigger) {
      trigger.scrollTrigger.kill();
    }
    if (trigger) {
      trigger.kill();
    }
  });
  scrollTriggers = [];

  if (titleAnimation && titleAnimation.scrollTrigger) {
    titleAnimation.scrollTrigger.kill();
    titleAnimation.kill();
  }
});
</script>

<style scoped>
.what-we-do-sections {
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding: 0;
  margin-top: 0;
  margin-bottom: 0;
  background-color: #0f0f0f;
}

.what-we-do-section {
  position: sticky;
  top: 0;
  width: 100%;
  max-width: 100%;
  height: 125svh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.section-inner {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 72px;
  display: flex;
  flex-direction: column;
  gap: 80px;
  align-items: center;
  justify-content: center;
  transform-origin: 50% 100%;
  will-change: transform;
  transform-style: preserve-3d;
}

.what-we-do-section--default .section-inner {
  background: #000;
}

.what-we-do-section--dark .section-inner {
  background: #0f0f0f;
}

.what-we-do-section--darker .section-inner {
  background: #131313; /* #161616; */
}

.what-we-do-section--title-only {
  height: 1117px;
}

.what-we-do-section--title-only .section-inner {
  background: #000;
  padding: 72px;
  gap: 0;
}

.section-title-only {
  display: flex;
  flex-direction: column;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 0;
  position: relative;
  z-index: 1;
  width: 1288px;
  max-width: 100%;
}

.section-title-only li {
  font-family: 'PP Neue Machina', sans-serif;
  font-weight: 800;
  font-size: clamp(40px, 10vw, 240px);
  line-height: 0.95;
  color: #fff;
  text-transform: uppercase;
  overflow: hidden;
  display: flex;
  position: relative;
}

.section-title-only .letter {
  position: relative;
  display: inline-block;
}

.section-title-only .letter span:last-child {
  position: absolute;
  bottom: 100%;
  left: 0;
}

.section-inner::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  opacity: var(--after-opacity, 0);
  will-change: opacity;
  pointer-events: none;
  z-index: 2;
}

.what-we-do-header {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  color: #fff;
}

.section-label {
  font-family: 'PP Neue Machina', sans-serif;
  font-weight: 800;
  font-size: 24px;
  line-height: 1;
  white-space: nowrap;
}

.section-title {
  font-family: 'PP Neue Machina', sans-serif;
  font-weight: 800;
  font-size: 96px;
  line-height: 0.9;
  text-transform: uppercase;
  width: 1177px;
  margin: 0;
}

.section-title--italic {
  font-style: italic;
  font-size: 60px;
  line-height: 1.1;
}

.what-we-do-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 48px;
  align-items: flex-end;
  justify-content: center;
}

.section-description {
  font-family: 'PP Supply Mono', monospace;
  font-weight: 200;
  font-size: 28px;
  line-height: 1.2;
  color: #fff;
  width: 1177px;
}

.section-description :deep(span[style*="font-weight: 400"]),
.section-description :deep(.bold) {
  font-weight: 400;
}

@media (max-width: 768px) {
  .section-inner {
    padding: 48px 24px;
    gap: 48px;
  }

  .what-we-do-section {
    min-height: auto;
  }

  .what-we-do-header {
    flex-direction: column;
    gap: 24px;
  }

  .section-title {
    font-size: 48px;
    width: 100%;
  }

  .section-title--italic {
    font-size: 36px;
  }

  .section-description {
    font-size: 18px;
    width: 100%;
  }

  .section-title-only {
    font-size: clamp(60px, 15vw, 160px);
  }

  .section-title-only li {
    font-size: clamp(60px, 15vw, 160px);
  }

  .what-we-do-section--title-only {
    height: auto;
    min-height: 100vh;
  }
}
</style>

