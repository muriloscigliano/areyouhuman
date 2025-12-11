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
  uniform sampler2D uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  varying vec2 vUv;

  vec2 getDistortedUv(vec2 uv, vec2 direction, float factor) {
    vec2 scaledDirection = direction;
    scaledDirection.y *= 2.0;
    return uv - scaledDirection * factor;
  }

  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 p = vUv * uResolution;
    vec2 sphereCenter = center * uResolution;

    float maxRadius = length(uResolution) * 1.5;
    float bubbleRadius = uProgress * maxRadius;

    float dist = length(sphereCenter - p);

    // Lens distortion calculation
    vec2 distortionDirection = normalize(p - sphereCenter);
    float focusFactor = 0.25;
    float focusRadius = bubbleRadius * focusFactor;
    float focusStrength = bubbleRadius / 3000.0;
    float focusSdf = length(sphereCenter - p) - focusRadius;
    float sphereSdf = length(sphereCenter - p) - bubbleRadius;
    float inside = smoothstep(0.0, 1.0, -sphereSdf / (bubbleRadius * 0.001 + 0.001));

    float magnifierFactor = focusSdf / (bubbleRadius - focusRadius + 0.001);
    float mFactor = clamp(magnifierFactor * inside, 0.0, 1.0);
    mFactor = pow(mFactor, 5.0);

    float distortionFactor = mFactor * focusStrength;

    vec2 distortedUV = getDistortedUv(vUv, distortionDirection / uResolution, distortionFactor * uResolution.x);

    // Mask for circle reveal
    float mask = step(bubbleRadius, dist);

    vec4 currentImg = texture2D(uTexture1, vUv);
    vec4 newImg = texture2D(uTexture2, distortedUV);

    float finalMask = max(mask, 1.0 - inside);
    vec4 color = mix(newImg, currentImg, finalMask);

    gl_FragColor = color;
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
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture1: { value: null },
      uTexture2: { value: null },
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
  });

  const texture = new THREE.CanvasTexture(captureCanvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

const captureContainerAsTexture = async (container: HTMLElement): Promise<THREE.Texture> => {
  const captureCanvas = await html2canvas(container, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#000000',
    scale: 1,
    logging: false,
    width: window.innerWidth,
    height: window.innerHeight,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
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

const initBarba = async () => {
  // Dynamic import to avoid SSR issues
  const barba = (await import('@barba/core')).default;

  barba.init({
    preventRunning: true,
    // Skip Barba for home page - it has complex Vue components that need full hydration
    prevent: ({ href }: { href: string }) => {
      const url = new URL(href, window.location.origin);
      // Force full page load for home page
      return url.pathname === '/' || url.pathname === '';
    },
    transitions: [
      {
        name: 'webgl-lens-transition',
        async leave(data) {
          if (!material || !canvas.value) return;

          // Capture current page
          const currentTexture = await capturePageAsTexture();
          material.uniforms.uTexture1.value = currentTexture;
          material.uniforms.uProgress.value = 0;

          // Show canvas and start rendering
          canvas.value.style.opacity = '1';
          canvas.value.style.pointerEvents = 'auto';
          startRenderLoop();
        },

        async enter(data) {
          if (!material || !canvas.value) return;

          // Inject styles from the new page
          const newDoc = new DOMParser().parseFromString(data.next.html, 'text/html');
          const newStyles = newDoc.querySelectorAll('style');
          newStyles.forEach(style => {
            // Check if this style already exists to avoid duplicates
            const styleContent = style.textContent || '';
            const existingStyles = document.querySelectorAll('style');
            let exists = false;
            existingStyles.forEach(existing => {
              if (existing.textContent === styleContent) exists = true;
            });
            if (!exists && styleContent.trim()) {
              const newStyle = document.createElement('style');
              newStyle.textContent = styleContent;
              document.head.appendChild(newStyle);
            }
          });

          // Update document title
          document.title = newDoc.title;

          // Capture the new page content
          const nextContainer = data.next.container;
          if (nextContainer) {
            // Wait a bit for styles to apply
            await new Promise(r => setTimeout(r, 50));
            const nextTexture = await captureContainerAsTexture(nextContainer);
            material.uniforms.uTexture2.value = nextTexture;
          }

          // Animate the transition
          await new Promise<void>((resolve) => {
            gsap.to(material!.uniforms.uProgress, {
              value: 1,
              duration: 2.2,
              ease: 'expo.inOut',
              onComplete: resolve,
            });
          });

          // Scroll to top
          window.scrollTo(0, 0);

          // Fade out canvas
          await new Promise<void>((resolve) => {
            gsap.to(canvas.value, {
              opacity: 0,
              duration: 0.3,
              ease: 'power2.out',
              onComplete: () => {
                if (canvas.value) {
                  canvas.value.style.pointerEvents = 'none';
                }
                stopRenderLoop();
                resolve();
              },
            });
          });
        },
      },
    ],
    // Re-run scripts after page transition
    hooks: {
      after: () => {
        // Re-run inline scripts from the new page
        const scripts = document.querySelectorAll('[data-barba="container"] script');
        scripts.forEach(oldScript => {
          const newScript = document.createElement('script');
          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });

        // Dispatch event that page has changed
        window.dispatchEvent(new CustomEvent('barba-after'));
      },
    },
  });
};

onMounted(() => {
  initWebGL();
  initBarba();
  window.addEventListener('resize', handleResize);
});

onUnmounted(async () => {
  window.removeEventListener('resize', handleResize);
  stopRenderLoop();
  if (renderer) {
    renderer.dispose();
  }
  // Dynamic import for cleanup
  const barba = (await import('@barba/core')).default;
  barba.destroy();
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
