<template>
  <canvas ref="canvas" class="page-transition-canvas"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import gsap from 'gsap';
import html2canvas from 'html2canvas';

const canvas = ref<HTMLCanvasElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let material: THREE.ShaderMaterial | null = null;
let animationId: number | null = null;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture1;
  uniform float uProgress;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 p = vUv * uResolution;
    vec2 sphereCenter = center * uResolution;

    float maxRadius = length(uResolution) * 1.5;
    float bubbleRadius = uProgress * maxRadius;

    float dist = length(sphereCenter - p);

    // Lens distortion calculation
    vec2 distortionDirection = normalize(p - sphereCenter);
    float focusFactor = 0.3;
    float focusRadius = bubbleRadius * focusFactor;
    float focusStrength = bubbleRadius / 1800.0;
    float focusSdf = length(sphereCenter - p) - focusRadius;
    float sphereSdf = length(sphereCenter - p) - bubbleRadius;
    float inside = smoothstep(0.0, 1.0, -sphereSdf / (bubbleRadius * 0.001 + 0.001));

    float magnifierFactor = focusSdf / (bubbleRadius - focusRadius + 0.001);
    float mFactor = clamp(magnifierFactor * inside, 0.0, 1.0);
    mFactor = pow(mFactor, 4.0);

    float distortionFactor = mFactor * focusStrength;

    // Glass chromatic aberration - RGB split
    float chromaStrength = mFactor * 0.025;

    vec2 uvRed = vUv - distortionDirection / uResolution * (distortionFactor + chromaStrength * 0.8) * uResolution.x;
    vec2 uvGreen = vUv - distortionDirection / uResolution * distortionFactor * uResolution.x;
    vec2 uvBlue = vUv - distortionDirection / uResolution * (distortionFactor - chromaStrength * 0.8) * uResolution.x;

    // Clamp UVs
    uvRed = clamp(uvRed, 0.001, 0.999);
    uvGreen = clamp(uvGreen, 0.001, 0.999);
    uvBlue = clamp(uvBlue, 0.001, 0.999);

    // Sample with chromatic aberration
    float r = texture2D(uTexture1, uvRed).r;
    float g = texture2D(uTexture1, uvGreen).g;
    float b = texture2D(uTexture1, uvBlue).b;

    // Inside the bubble = black (new page will show through)
    // Outside = old page with distortion
    float alpha = 1.0 - inside;

    // Edge glow
    float edgeDist = abs(dist - bubbleRadius);
    float edgeGlow = smoothstep(bubbleRadius * 0.08, 0.0, edgeDist) * inside;

    vec3 color = vec3(r, g, b);
    color += vec3(0.15, 0.18, 0.22) * edgeGlow * 0.5;

    gl_FragColor = vec4(color, alpha + edgeGlow * 0.3);
  }
`;

const initWebGL = () => {
  if (!canvas.value) return;

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture1: { value: null },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
};

const capturePageAsTexture = async (): Promise<THREE.Texture> => {
  const captureCanvas = await html2canvas(document.body, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#000000',
    scale: 1,
    logging: false,
    width: window.innerWidth,
    height: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    ignoreElements: (element) => {
      // Ignore the transition canvas itself
      return element.classList.contains('page-transition-canvas');
    },
  });

  const texture = new THREE.CanvasTexture(captureCanvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

const handleResize = () => {
  if (renderer && material) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  }
};

const startRenderLoop = () => {
  const render = () => {
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
    animationId = requestAnimationFrame(render);
  };
  render();
};

const stopRenderLoop = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};

// Handle link clicks for page transitions
const handleLinkClick = async (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const link = target.closest('a');

  if (!link) return;

  const href = link.getAttribute('href');
  if (!href) return;

  // Only handle internal navigation links
  if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;

  // Skip if it's the current page
  const currentPath = window.location.pathname;
  const targetPath = href.startsWith('/') ? href : `/${href}`;
  if (currentPath === targetPath) return;

  // Skip if modifier keys are pressed
  if (e.metaKey || e.ctrlKey || e.shiftKey) return;

  // Prevent default navigation
  e.preventDefault();

  // If going to home, set the intro completed flag
  if (targetPath === '/' || targetPath === '') {
    sessionStorage.setItem('introCompleted', 'true');
  }

  if (!material || !canvas.value) {
    // Fallback to normal navigation if WebGL isn't ready
    window.location.href = href;
    return;
  }

  // Capture current page
  const texture = await capturePageAsTexture();
  material.uniforms.uTexture1.value = texture;
  material.uniforms.uProgress.value = 0;

  // Show canvas and start rendering
  canvas.value.style.opacity = '1';
  canvas.value.style.pointerEvents = 'auto';
  startRenderLoop();

  // Store the texture data in sessionStorage for the next page
  try {
    const dataURL = (await html2canvas(document.body, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#000000',
      scale: 0.5, // Lower resolution for storage
      logging: false,
      width: window.innerWidth,
      height: window.innerHeight,
      ignoreElements: (element) => element.classList.contains('page-transition-canvas'),
    })).toDataURL('image/jpeg', 0.7);

    sessionStorage.setItem('pageTransitionTexture', dataURL);
    sessionStorage.setItem('pageTransitionActive', 'true');
  } catch (err) {
    console.warn('Failed to store transition texture:', err);
  }

  // Navigate to the new page
  window.location.href = href;
};

// Check if we're coming from a transition and should animate in
const checkIncomingTransition = async () => {
  const isTransitionActive = sessionStorage.getItem('pageTransitionActive') === 'true';
  const textureData = sessionStorage.getItem('pageTransitionTexture');

  // Clear the flags
  sessionStorage.removeItem('pageTransitionActive');
  sessionStorage.removeItem('pageTransitionTexture');

  if (!isTransitionActive || !textureData || !material || !canvas.value) return;

  // Load the texture from the previous page
  const img = new Image();
  img.onload = () => {
    const texture = new THREE.Texture(img);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    material!.uniforms.uTexture1.value = texture;
    material!.uniforms.uProgress.value = 0;

    // Show canvas and start rendering
    canvas.value!.style.opacity = '1';
    canvas.value!.style.pointerEvents = 'auto';
    startRenderLoop();

    // Animate the transition
    gsap.to(material!.uniforms.uProgress, {
      value: 1,
      duration: 1.8,
      ease: 'expo.inOut',
      onComplete: () => {
        // Fade out canvas
        gsap.to(canvas.value, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
          onComplete: () => {
            if (canvas.value) {
              canvas.value.style.pointerEvents = 'none';
            }
            stopRenderLoop();

            // Clean up texture
            if (material && material.uniforms.uTexture1.value) {
              material.uniforms.uTexture1.value.dispose();
              material.uniforms.uTexture1.value = null;
            }
          },
        });
      },
    });
  };

  img.src = textureData;
};

onMounted(() => {
  initWebGL();

  // Add click listener for all links
  document.addEventListener('click', handleLinkClick);

  // Check for incoming transition after a brief delay to ensure page is rendered
  setTimeout(checkIncomingTransition, 100);

  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  document.removeEventListener('click', handleLinkClick);
  window.removeEventListener('resize', handleResize);
  stopRenderLoop();
  if (renderer) {
    renderer.dispose();
  }
});
</script>

<style scoped>
.page-transition-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  pointer-events: none;
  opacity: 0;
}
</style>
