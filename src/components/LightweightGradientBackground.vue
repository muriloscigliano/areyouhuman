<template>
  <div class="gradient-background"></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

let animationId = null;

onMounted(() => {
  // CSS-based gradient animation - no JavaScript libraries needed!
  // Animation is handled by CSS @keyframes
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<style scoped>
.gradient-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: -1;
  overflow: hidden;

  /* Multi-layer animated gradient */
  background:
    linear-gradient(135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(245, 176, 0, 0.15) 25%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(74, 51, 191, 0.15) 75%,
      rgba(245, 61, 0, 0.15) 100%
    );

  /* Animated background size for flowing effect */
  background-size: 200% 200%;
  animation: gradientFlow 20s ease infinite;

  /* Add subtle noise texture for depth */
  background-blend-mode: overlay;
}

/* Smooth flowing animation */
@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Add after-effect for more complexity */
.gradient-background::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(circle at 20% 50%, rgba(245, 176, 0, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(74, 51, 191, 0.1) 0%, transparent 50%);
  animation: rotateGradient 30s linear infinite;
  pointer-events: none;
}

@keyframes rotateGradient {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .gradient-background {
    animation: none;
  }

  .gradient-background::after {
    animation: none;
  }
}
</style>
