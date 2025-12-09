<template>
  <div
    ref="transitionRef"
    class="webgl-transition"
    :class="{ 'webgl-transition--active': isActive }"
  >
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Vector2
} from 'three';
import { gsap } from 'gsap';

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['complete']);

const transitionRef = ref(null);
const canvasRef = ref(null);
const isActive = ref(false);

let scene = null;
let camera = null;
let renderer = null;
let material = null;
let mesh = null;
let animationId = null;
let gsapTween = null;

// Animation config
const ANIMATION_CONFIG = {
  duration: 1.8,
  ease: 'power2.inOut',
};

// Vertex shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader - Expanding portal with glowing edge
// The outside area is TRANSPARENT so starfield shows through
// Only renders the glowing edge ring, rest is transparent
const fragmentShader = `
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform float uTime;

  varying vec2 vUv;

  // Noise for organic edges
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 center = vec2(0.5, 0.5);

    // Adjust for aspect ratio
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uvAspect = (vUv - center) * aspect;

    // Distance from center
    float dist = length(uvAspect);

    // Max distance to corner
    float maxDist = length(vec2(0.5, 0.5) * aspect) * 1.3;

    // Expanding radius
    float radius = uProgress * maxDist;

    // Edge softness for smooth transition
    float edgeSoftness = 0.08 + uProgress * 0.15;

    // Add organic noise to the edge
    float noiseVal = noise(vUv * 12.0 + uTime * 0.3) * 0.06;
    float edgeDist = dist - radius + noiseVal;

    // Edge glow effect - white glow at the expanding edge
    float glowDist = abs(edgeDist);
    float glow = smoothstep(edgeSoftness * 2.5, 0.0, glowDist);
    glow *= (1.0 - uProgress * 0.7) * 0.8; // Fade out glow as transition progresses

    // Ripple effect at edge
    float ripple = sin((dist - radius) * 40.0 - uTime * 4.0) * 0.5 + 0.5;
    ripple *= smoothstep(edgeSoftness * 3.0, 0.0, glowDist);
    ripple *= (1.0 - uProgress) * 0.4;

    // Combined edge intensity
    float edgeIntensity = glow + ripple;

    // Only render the glowing edge - everything else is transparent
    // This lets the starfield show through everywhere except the edge glow
    if (edgeIntensity < 0.01) {
      discard;
    }

    // White/light glow color
    vec3 glowColor = vec3(1.0, 1.0, 1.0);

    gl_FragColor = vec4(glowColor, edgeIntensity);
  }
`;

function initThree() {
  if (typeof window === 'undefined') return;
  if (!canvasRef.value) return;
  if (renderer) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  try {
    scene = new Scene();
    camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    renderer = new WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: true, // Enable transparency!
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });

    const gl = renderer.getContext();
    if (!gl) {
      console.error('WebGL context not available');
      renderer = null;
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background

    material = new ShaderMaterial({
      uniforms: {
        uProgress: { value: 0.0 },
        uResolution: { value: new Vector2(width, height) },
        uTime: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false
    });

    const geometry = new PlaneGeometry(2, 2);
    mesh = new Mesh(geometry, material);
    scene.add(mesh);

    renderer.render(scene, camera);
  } catch (error) {
    console.error('Error initializing WebGL:', error);
  }
}

let startTime = 0;

function animate() {
  if (!renderer || !scene || !camera || !material) return;

  try {
    material.uniforms.uTime.value = (Date.now() - startTime) * 0.001;
    renderer.render(scene, camera);
  } catch (error) {
    console.error('Error rendering:', error);
    emit('complete');
    return;
  }

  animationId = requestAnimationFrame(animate);
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (gsapTween) {
    gsapTween.kill();
    gsapTween = null;
  }
}

async function start() {
  if (isActive.value) return;

  isActive.value = true;
  startTime = Date.now();

  if (!renderer) {
    initThree();
  }

  if (!renderer || !material) {
    isActive.value = false;
    emit('complete');
    return;
  }

  // Reset progress
  material.uniforms.uProgress.value = 0;

  // Start render loop
  animate();

  // Small delay to ensure canvas is visible
  await new Promise(resolve => setTimeout(resolve, 30));

  // Animate the transition
  gsapTween = gsap.to(material.uniforms.uProgress, {
    value: 1,
    duration: ANIMATION_CONFIG.duration,
    ease: ANIMATION_CONFIG.ease,
    onComplete: () => {
      stopAnimation();
      setTimeout(() => {
        emit('complete');
      }, 50);
    }
  });
}

function handleResize() {
  if (!renderer || !camera) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (material) {
    material.uniforms.uResolution.value.set(width, height);
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);

  if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
    console.error('WebGL not supported in this browser');
    return;
  }

  setTimeout(() => {
    if (canvasRef.value) {
      initThree();
    }
  }, 100);
});

watch(() => props.active, (newVal) => {
  if (newVal && !isActive.value) {
    start();
  }
});

onUnmounted(() => {
  stopAnimation();
  window.removeEventListener('resize', handleResize);

  if (renderer) {
    renderer.dispose();
  }
  if (material) {
    material.dispose();
  }
  if (mesh) {
    mesh.geometry.dispose();
  }
});

defineExpose({
  start
});
</script>

<style scoped>
.webgl-transition {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  pointer-events: none;
  opacity: 0;
  overflow: hidden;
  transition: opacity 0s;
}

.webgl-transition--active {
  opacity: 1;
  pointer-events: none; /* Allow clicking through to landing page */
  transition: opacity 0s;
}

.webgl-transition canvas {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
