<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';

const thinkingMessages = [
  'Thinking...',
  'Processing...',
  'Analyzing...',
  'Crafting response...',
  'Connecting dots...',
  'Almost there...'
];

const textRef = ref<HTMLElement | null>(null);
let scrambleInterval: NodeJS.Timeout | null = null;
let changeInterval: NodeJS.Timeout | null = null;
let currentIndex = 0;

// Scramble text function with smooth animation (slower)
const scrambleText = (target: HTMLElement, finalText: string, duration: number = 1.5) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  const finalLength = finalText.length;
  let progress = 0;
  const steps = 40; // More steps for smoother animation
  const stepDuration = duration * 1000 / steps;
  
  // Clear any existing scramble
  if (scrambleInterval) {
    clearInterval(scrambleInterval);
  }
  
  const updateText = () => {
    if (progress >= 1) {
      target.textContent = finalText;
      if (scrambleInterval) {
        clearInterval(scrambleInterval);
        scrambleInterval = null;
      }
      return;
    }
    
    let scrambled = '';
    const revealedChars = Math.floor(progress * finalLength);
    
    for (let i = 0; i < finalLength; i++) {
      if (i < revealedChars) {
        // Show correct character
        scrambled += finalText[i];
      } else {
        // Show random character
        scrambled += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    target.textContent = scrambled;
    progress += 1 / steps;
  };
  
  scrambleInterval = setInterval(updateText, stepDuration);
  updateText(); // Initial call
};

// Pick random message (avoid immediate repeats)
const getRandomMessage = () => {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * thinkingMessages.length);
  } while (newIndex === currentIndex && thinkingMessages.length > 1);
  currentIndex = newIndex;
  return thinkingMessages[currentIndex];
};

const startAnimation = () => {
  if (!textRef.value) return;
  
  // Initial message with scramble (slower)
  const initialMessage = getRandomMessage();
  scrambleText(textRef.value, initialMessage, 1.5);
  
  // Change message every 3-4 seconds with scramble (slower)
  if (changeInterval) {
    clearInterval(changeInterval);
  }
  
  changeInterval = setInterval(() => {
    if (!textRef.value) return;
    const newMessage = getRandomMessage();
    scrambleText(textRef.value, newMessage, 1.2);
  }, 3500);
};

onMounted(() => {
  startAnimation();
});

onUnmounted(() => {
  if (scrambleInterval) {
    clearInterval(scrambleInterval);
  }
  if (changeInterval) {
    clearInterval(changeInterval);
  }
});
</script>

<template>
  <p ref="textRef" class="thinking-text">Thinking...</p>
</template>

<style scoped>
.thinking-text {
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: #acacac;
  letter-spacing: 0.48px;
  margin: 0;
  padding: 0;
  min-height: 1.4em;
  display: inline-block;
}
</style>

