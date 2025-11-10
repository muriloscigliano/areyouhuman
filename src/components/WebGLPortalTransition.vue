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
import * as THREE from 'three';
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

// ============================================
// ANIMATION CONFIGURATION - Matching the slider effect
// ============================================
const ANIMATION_CONFIG = {
  duration: 2.5,        // Duration in seconds - matches the slider timing
  ease: 'power2.inOut', // Smooth acceleration and deceleration like the slider
};

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uTexture1Size;
  uniform vec2 uTexture2Size;
  varying vec2 vUv;
  
  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }
  
  vec2 getDistortedUv(vec2 uv, vec2 direction, float factor) {
    vec2 scaledDirection = direction;
    scaledDirection.y *= 2.0;
    return uv - scaledDirection * factor;
  }
  
  struct LensDistortion {
    vec2 distortedUV;
    float inside;
  };
  
  LensDistortion getLensDistortion(
    vec2 p,
    vec2 uv,
    vec2 sphereCenter,
    float sphereRadius,
    float focusFactor
  ) {
    vec2 distortionDirection = normalize(p - sphereCenter);
    float focusRadius = sphereRadius * focusFactor;
    float focusStrength = sphereRadius / 3000.0;
    float focusSdf = length(sphereCenter - p) - focusRadius;
    float sphereSdf = length(sphereCenter - p) - sphereRadius;
    float inside = smoothstep(0.0, 1.0, -sphereSdf / (sphereRadius * 0.001));
    
    float magnifierFactor = focusSdf / (sphereRadius - focusRadius);
    float mFactor = clamp(magnifierFactor * inside, 0.0, 1.0);
    mFactor = pow(mFactor, 5.0);
    
    float distortionFactor = mFactor * focusStrength;
    
    vec2 distortedUV = getDistortedUv(uv, distortionDirection, distortionFactor);
    
    return LensDistortion(distortedUV, inside);
  }
  
  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 p = vUv * uResolution;
    
    vec2 uv1 = getCoverUV(vUv, uTexture1Size);
    vec2 uv2 = getCoverUV(vUv, uTexture2Size);
    
    float maxRadius = length(uResolution) * 1.5;
    float bubbleRadius = uProgress * maxRadius;
    vec2 sphereCenter = center * uResolution;
    float focusFactor = 0.25;
    
    float dist = length(sphereCenter - p);
    float mask = step(bubbleRadius, dist);
    
    vec4 currentImg = texture2D(uTexture1, uv1);
    
    LensDistortion distortion = getLensDistortion(
      p, uv2, sphereCenter, bubbleRadius, focusFactor
    );
    
    vec4 newImg = texture2D(uTexture2, distortion.distortedUV);
    
    float finalMask = max(mask, 1.0 - distortion.inside);
    vec4 color = mix(newImg, currentImg, finalMask);
    
    gl_FragColor = color;
  }
`;

async function captureIntroScreen() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    const introSection = document.querySelector('.intro');
    if (!introSection) {
      return createFallbackCanvas('#ffefe5');
    }

    // Save original scroll position
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const canvas = document.createElement('canvas');
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const html2canvas = window.html2canvas;
    if (html2canvas && typeof html2canvas === 'function') {
      try {
        const capturedCanvas = await html2canvas(introSection, {
          width: width,
          height: height,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffefe5',
          scale: window.devicePixelRatio || 1,
          windowWidth: width,
          windowHeight: height,
          onclone: (clonedDoc) => {
            // Ensure cloned document has same dimensions
            clonedDoc.body.style.width = width + 'px';
            clonedDoc.body.style.height = height + 'px';
          }
        });

        ctx.drawImage(capturedCanvas, 0, 0, width, height);

        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
      } catch (e) {
        console.warn('html2canvas failed for intro, using fallback:', e);
        ctx.fillStyle = '#ffefe5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        window.scrollTo(scrollX, scrollY);
      }
    } else {
      ctx.fillStyle = '#ffefe5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return canvas;
  } catch (e) {
    console.warn('Could not capture intro screen:', e);
    return createFallbackCanvas('#ffefe5');
  }
}

async function captureLandingPage() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      return createFallbackCanvas('#0a0a0f');
    }

    // Save original scroll position
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const originalOpacity = mainContent.style.opacity;
    const originalPointerEvents = mainContent.style.pointerEvents;
    const originalVisibility = mainContent.style.visibility;
    const originalDisplay = mainContent.style.display;
    const originalPosition = mainContent.style.position;
    const originalZIndex = mainContent.style.zIndex;

    // Temporarily show landing page OFF-SCREEN for capture (to avoid interfering with intro)
    mainContent.style.position = 'fixed';
    mainContent.style.top = '0';
    mainContent.style.left = '-9999px'; // Position FAR off-screen
    mainContent.style.width = `${window.innerWidth}px`;
    mainContent.style.height = `${window.innerHeight}px`;
    mainContent.style.display = 'block';
    mainContent.style.opacity = '1';
    mainContent.style.pointerEvents = 'none';
    mainContent.style.visibility = 'visible';
    mainContent.classList.remove('landing--hidden');

    await new Promise(resolve => setTimeout(resolve, 150));

    const canvas = document.createElement('canvas');
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const html2canvas = window.html2canvas;
    if (html2canvas && typeof html2canvas === 'function') {
      try {
        const capturedCanvas = await html2canvas(mainContent, {
          width: width,
          height: height,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#0a0a0f',
          scale: window.devicePixelRatio || 1,
          windowWidth: width,
          windowHeight: height,
          onclone: (clonedDoc) => {
            // Ensure cloned document has same dimensions
            clonedDoc.body.style.width = width + 'px';
            clonedDoc.body.style.height = height + 'px';
          }
        });

        ctx.drawImage(capturedCanvas, 0, 0, width, height);

        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
      } catch (e) {
        console.warn('html2canvas failed for landing, using fallback:', e);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        window.scrollTo(scrollX, scrollY);
      }
    } else {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Restore original state - keep it hidden
    mainContent.style.position = originalPosition;
    mainContent.style.zIndex = originalZIndex;
    mainContent.style.display = originalDisplay;
    mainContent.style.opacity = originalOpacity;
    mainContent.style.pointerEvents = originalPointerEvents;
    mainContent.style.visibility = originalVisibility;
    mainContent.style.top = '';
    mainContent.style.left = '';
    mainContent.style.width = '';
    mainContent.style.height = '';
    mainContent.classList.add('landing--hidden');

    return canvas;
  } catch (e) {
    console.warn('Could not capture landing page:', e);
    return createFallbackCanvas('#0a0a0f');
  }
}

function createFallbackCanvas(color = '#0a0a0f') {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resolve(canvas);
  });
}

async function initThree() {
  if (!canvasRef.value) {
    console.error('Canvas ref not available');
    return;
  }

  if (renderer) {
    console.log('Renderer already initialized');
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  try {
    console.log('Initializing WebGL scene...');
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });

    const gl = renderer.getContext();
    if (!gl) {
      console.error('WebGL context not available');
      renderer = null;
      return;
    }

    console.log('WebGL context created successfully');
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffefe5, 1);

    // Create intro screen texture (what we're transitioning FROM)
    let introTexture = null;
    let texture1Size = new THREE.Vector2(1, 1);

    try {
      const introCanvas = await captureIntroScreen();
      if (introCanvas) {
        introTexture = new THREE.CanvasTexture(introCanvas);
        introTexture.needsUpdate = true;
        introTexture.minFilter = THREE.LinearFilter;
        introTexture.magFilter = THREE.LinearFilter;
        texture1Size = new THREE.Vector2(
          introCanvas.width,
          introCanvas.height
        );
        console.log('Intro screen captured successfully');
      }
    } catch (e) {
      console.warn('Could not capture intro screen:', e);
    }

    // Fallback to peach color if intro capture failed
    if (!introTexture) {
      const peachData = new Uint8Array([255, 239, 229, 255]);
      introTexture = new THREE.DataTexture(
        peachData,
        1,
        1,
        THREE.RGBAFormat
      );
      introTexture.needsUpdate = true;
      introTexture.minFilter = THREE.LinearFilter;
      introTexture.magFilter = THREE.LinearFilter;
    }

    // Create landing page texture (what we're transitioning TO)
    let landingPageTexture = null;
    let texture2Size = new THREE.Vector2(1, 1);

    try {
      const landingPageCanvas = await captureLandingPage();
      if (landingPageCanvas) {
        landingPageTexture = new THREE.CanvasTexture(landingPageCanvas);
        landingPageTexture.needsUpdate = true;
        landingPageTexture.minFilter = THREE.LinearFilter;
        landingPageTexture.magFilter = THREE.LinearFilter;
        texture2Size = new THREE.Vector2(
          landingPageCanvas.width,
          landingPageCanvas.height
        );
        console.log('Landing page captured successfully');
      }
    } catch (e) {
      console.warn('Could not capture landing page for transition:', e);
    }

    // Fallback to dark color if landing capture failed
    if (!landingPageTexture) {
      const darkData = new Uint8Array([10, 10, 15, 255]);
      landingPageTexture = new THREE.DataTexture(
        darkData,
        1,
        1,
        THREE.RGBAFormat
      );
      landingPageTexture.needsUpdate = true;
      landingPageTexture.minFilter = THREE.LinearFilter;
      landingPageTexture.magFilter = THREE.LinearFilter;
    }
    
    material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture1: { value: introTexture },
        uTexture2: { value: landingPageTexture },
        uProgress: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uTexture1Size: { value: texture1Size },
        uTexture2Size: { value: texture2Size }
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      depthWrite: false,
      depthTest: false
    });

    console.log('Shader material created with uniforms:', {
      texture1: material.uniforms.uTexture1.value,
      texture2: material.uniforms.uTexture2.value,
      resolution: material.uniforms.uResolution.value
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    console.log('Initial render...');
    renderer.render(scene, camera);
    console.log('WebGL initialization complete');
  } catch (error) {
    console.error('Error initializing WebGL:', error);
    console.error('Error stack:', error.stack);
  }
}

function animate() {
  if (!renderer || !scene || !camera) {
    console.warn('Renderer, scene, or camera not available');
    return;
  }

  try {
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
  if (isActive.value) {
    console.log('Transition already active, skipping');
    return;
  }

  console.log('Starting WebGL transition...');
  isActive.value = true;

  if (!renderer) {
    console.log('Renderer not initialized, initializing now...');
    await initThree();
  }

  if (!renderer) {
    console.error('Renderer failed to initialize');
    isActive.value = false;
    emit('complete');
    return;
  }

  if (renderer && material) {
    try {
      // Re-capture intro screen (current state)
      console.log('Capturing intro screen for transition...');
      const introCanvas = await captureIntroScreen();
      if (introCanvas && material) {
        console.log('Intro screen captured, creating texture...');
        const introTexture = new THREE.CanvasTexture(introCanvas);
        introTexture.needsUpdate = true;
        introTexture.minFilter = THREE.LinearFilter;
        introTexture.magFilter = THREE.LinearFilter;

        material.uniforms.uTexture1.value = introTexture;
        material.uniforms.uTexture1Size.value.set(
          introCanvas.width,
          introCanvas.height
        );
        console.log('Intro texture updated successfully');
      }

      // Re-capture landing page (destination)
      console.log('Capturing landing page for transition...');
      const landingPageCanvas = await captureLandingPage();
      if (landingPageCanvas && material) {
        console.log('Landing page captured, creating texture...');
        const landingPageTexture = new THREE.CanvasTexture(landingPageCanvas);
        landingPageTexture.needsUpdate = true;
        landingPageTexture.minFilter = THREE.LinearFilter;
        landingPageTexture.magFilter = THREE.LinearFilter;

        material.uniforms.uTexture2.value = landingPageTexture;
        material.uniforms.uTexture2Size.value.set(
          landingPageCanvas.width,
          landingPageCanvas.height
        );
        console.log('Landing texture updated successfully');
      }
    } catch (e) {
      console.warn('Could not update textures:', e);
    }

    material.uniforms.uProgress.value = 0;
    console.log('Starting GSAP animation with config:', ANIMATION_CONFIG);

    // Start the render loop
    animate();

    // Small delay to ensure textures are fully loaded and WebGL canvas is visible
    await new Promise(resolve => setTimeout(resolve, 50));

    // Use GSAP to animate the progress uniform
    gsapTween = gsap.to(material.uniforms.uProgress, {
      value: 1,
      duration: ANIMATION_CONFIG.duration,
      ease: ANIMATION_CONFIG.ease,
      onComplete: () => {
        console.log('Animation complete');
        stopAnimation();
        setTimeout(() => {
          emit('complete');
        }, 50);
      }
    });
  }
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
  console.log('WebGLPortalTransition mounted');
  window.addEventListener('resize', handleResize);

  if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
    console.error('WebGL not supported in this browser');
    return;
  }

  // Give the canvas time to mount in the DOM
  setTimeout(() => {
    if (canvasRef.value) {
      console.log('Canvas element found, initializing Three.js');
      initThree();
    } else {
      console.error('Canvas ref not available after mount');
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
  pointer-events: all;
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

