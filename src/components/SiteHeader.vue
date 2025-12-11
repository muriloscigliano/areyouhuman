<template>
  <header class="site-header">
    <a
      ref="logoRef"
      href="/"
      class="logo"
      @mouseenter="handleLogoHover"
    >
      <span
        v-for="(char, index) in logoChars"
        :key="`logo-${index}`"
        :ref="el => { if (el) logoCharRefs[index] = el as HTMLElement }"
        class="logo-char"
        :class="{ 'logo-space': char === ' ' }"
      >{{ char === ' ' ? '\u00A0' : char }}</span>
    </a>
    <nav class="nav" ref="navRef">
      <a
        v-for="(item, index) in navItems"
        :key="index"
        :ref="el => { if (el) navItemRefs[index] = el as HTMLElement }"
        :href="navTargets[item]"
        class="nav-item"
        @mouseenter="handleNavHover(index)"
      >{{ item }}</a>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSound } from '../composables/useSound';

// Element refs
const logoRef = ref<HTMLElement | null>(null);
const navRef = ref<HTMLElement | null>(null);

// Character refs for animations
const logoCharRefs = ref<(HTMLElement | null)[]>([]);
const navItemRefs = ref<(HTMLElement | null)[]>([]);

// Static data
const logoChars = 'Are You Human?'.split('');
const navItems = ['Services', 'Framework', 'About'] as const;
const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Animation state
const scrambleIntervals = new Map<HTMLElement, ReturnType<typeof setInterval>>();

// Composables
const { playHover } = useSound();

// Nav targets mapping
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

// Lifecycle
onMounted(() => {
  // Make chars visible immediately on inner pages
  logoCharRefs.value.forEach(el => {
    if (el) el.style.opacity = '1';
  });
});

onUnmounted(() => {
  // Clear scramble intervals
  scrambleIntervals.forEach(clearInterval);
  scrambleIntervals.clear();
});
</script>

<style scoped>
.site-header {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-family: 'PP Neue Machina', sans-serif;
  font-weight: 800;
  font-size: clamp(20px, 2vw, 24px);
  line-height: 1;
  color: #fff !important;
  width: 130px;
  cursor: pointer;
  text-transform: uppercase;
  text-decoration: none !important;
}

.logo-char {
  display: inline-block;
  opacity: 1;
}

.logo-space {
  width: 0.3em;
  min-width: 0.3em;
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
  color: #fff !important;
  text-decoration: none !important;
  transition: opacity 0.2s ease;
}

.nav-item:hover {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .nav {
    font-size: 14px;
    gap: 12px;
  }
}
</style>
