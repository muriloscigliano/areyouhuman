<template>
  <canvas
    ref="canvasRef"
    class="starfield-canvas"
    :class="{ 'starfield-canvas--dark': isDarkMode }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

// =============================================================================
// TYPES
// =============================================================================

interface Star {
  x: number;
  y: number;
  z: number;
}

interface Props {
  progress?: number;
  isDarkMode?: boolean;
  active?: boolean;
  starCount?: number;
  slowdownMode?: boolean; // When true, stars slow down as if arriving at destination
  heroMode?: boolean; // When true, renders slowly for hero background
}

// =============================================================================
// PROPS & EMITS
// =============================================================================

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  isDarkMode: false,
  active: true,
  starCount: 400,
  slowdownMode: false,
  heroMode: false,
});

const emit = defineEmits<{
  (e: 'ready'): void;
}>();

// =============================================================================
// REFS & CONSTANTS
// =============================================================================

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let stars: Star[] = [];

let width = 0;
let height = 0;
let centerX = 0;
let centerY = 0;

// Star field parameters
const MAX_Z = 2;
const MAX_R = 1.5; // Max radius when close
const BASE_SPEED = 0.005;

// =============================================================================
// STAR CREATION - Simple like the reference
// =============================================================================

function createStar(randomZ = true): Star {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    z: randomZ ? Math.random() * MAX_Z : MAX_Z,
  };
}

function initStars() {
  stars = [];
  for (let i = 0; i < props.starCount; i++) {
    stars.push(createStar());
  }
}

// =============================================================================
// RENDERING - Matching reference code style
// =============================================================================

function render() {
  if (!ctx || !canvasRef.value || !props.active) {
    animationId = requestAnimationFrame(render);
    return;
  }

  // Calculate speed based on mode
  let speedMultiplier: number;

  if (props.heroMode) {
    // Hero mode: very slow ambient movement
    speedMultiplier = 0.3;
  } else if (props.slowdownMode) {
    // Slowdown mode: stars decelerate as if arriving at destination
    // Inverse of progress - faster at start, slower as we complete
    const slowdownFactor = 1 - props.progress * 0.9; // Goes from 1.0 to 0.1
    speedMultiplier = (1 + props.progress * 20) * slowdownFactor;
  } else {
    // Normal hyperspace mode: faster during hold
    speedMultiplier = 1 + props.progress * 20;
  }

  const zSpeed = BASE_SPEED * speedMultiplier;

  // Background fade - creates trail effect
  // Dark mode: dark bg, Light mode: light bg
  const isDark = props.isDarkMode;
  const bgAlpha = 0.15 + props.progress * 0.1; // More trail during hyperspace

  ctx.fillStyle = isDark
    ? `rgba(10, 10, 10, ${bgAlpha})`
    : `rgba(255, 253, 252, ${bgAlpha})`;
  ctx.fillRect(0, 0, width, height);

  // Star color based on mode
  const starColor = isDark
    ? 'rgba(255, 255, 255, 0.8)'
    : 'rgba(0, 0, 0, 0.6)';

  // Render each star
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];

    // Move star toward camera (decrease z)
    star.z -= zSpeed;

    // Reset star if it passes the camera
    if (star.z <= 0.01) {
      star.x = Math.random() * width;
      star.y = Math.random() * height;
      star.z = MAX_Z;
      continue;
    }

    // Project 3D to 2D (perspective projection)
    const xCoord = star.x - centerX;
    const yCoord = star.y - centerY;
    const screenX = (xCoord / star.z) + centerX;
    const screenY = (yCoord / star.z) + centerY;

    // Check bounds - reset if out of view
    if (screenX < 0 || screenX > width || screenY < 0 || screenY > height) {
      star.x = Math.random() * width;
      star.y = Math.random() * height;
      star.z = MAX_Z;
      continue;
    }

    // Calculate radius based on z-depth (closer = bigger)
    const baseRadius = (MAX_Z - star.z) / MAX_Z * MAX_R;
    const radius = Math.max(0.3, baseRadius * (1 + props.progress * 0.5));

    // Draw the star as a simple filled circle
    ctx.beginPath();
    ctx.fillStyle = starColor;
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    ctx.fill();

    // During hyperspace, add streak/trail effect
    if (props.progress > 0.1) {
      const trailLength = props.progress * 30;
      const prevX = (xCoord / (star.z + zSpeed * trailLength)) + centerX;
      const prevY = (yCoord / (star.z + zSpeed * trailLength)) + centerY;

      const gradient = ctx.createLinearGradient(prevX, prevY, screenX, screenY);
      const trailAlpha = props.progress * 0.5;

      gradient.addColorStop(0, isDark
        ? `rgba(255, 255, 255, 0)`
        : `rgba(0, 0, 0, 0)`);
      gradient.addColorStop(1, isDark
        ? `rgba(255, 255, 255, ${trailAlpha})`
        : `rgba(0, 0, 0, ${trailAlpha})`);

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = radius * 0.8;
      ctx.lineCap = 'round';
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(screenX, screenY);
      ctx.stroke();
    }
  }

  animationId = requestAnimationFrame(render);
}

// =============================================================================
// LIFECYCLE
// =============================================================================

function handleResize() {
  if (!canvasRef.value) return;

  width = window.innerWidth;
  height = window.innerHeight;
  centerX = width / 2;
  centerY = height / 2;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasRef.value.width = width * dpr;
  canvasRef.value.height = height * dpr;
  canvasRef.value.style.width = `${width}px`;
  canvasRef.value.style.height = `${height}px`;

  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  // Reinitialize stars with new dimensions
  initStars();
}

onMounted(() => {
  if (!canvasRef.value) return;

  ctx = canvasRef.value.getContext('2d', {
    alpha: true,
    desynchronized: true,
  });

  if (!ctx) return;

  handleResize();
  window.addEventListener('resize', handleResize);

  // Start animation loop
  animationId = requestAnimationFrame(render);
  emit('ready');
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('resize', handleResize);
});

// Watch for starCount changes
watch(() => props.starCount, (newCount, oldCount) => {
  if (!oldCount) {
    initStars();
    return;
  }

  const diff = newCount - oldCount;
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      stars.push(createStar(true));
    }
  } else if (diff < 0) {
    stars.splice(newCount);
  }
});
</script>

<style scoped>
.starfield-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
