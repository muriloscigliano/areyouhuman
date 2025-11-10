<template>
  <div class="gradient-background">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { gsap } from 'gsap';

const canvasRef = ref(null);

// Reactive parameters
const frequency = ref(2.60);
const amount = ref(0.47);
const speed = ref(0.003);
const smoothness = ref(0.90); // Controls smoothstep range
const rotation = ref(88); // Gradient rotation in degrees (0 = horizontal, 90 = vertical)
const opacity = ref(0.20); // Background opacity (0 = transparent, 1 = opaque)

// Reactive colors
const color1 = ref('#ffffff'); // White
const color2 = ref('#f5b000'); // Golden yellow
const color3 = ref('#ffffff'); // White
const color4 = ref('#4a33bf'); // Deep purple
const color5 = ref('#f53d00'); // Orange-red

let scene = null;
let camera = null;
let renderer = null;
let material = null;
let mesh = null;
let animationId = null;

// 3D Simplex noise function
const simplex3D = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

// Simple vertex shader - no distortion, just pass through
const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader with stacked noise octaves for smooth flowing gradient
const fragmentShader = `
  ${simplex3D}

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform sampler2D u_gradient;
  uniform float u_frequency;
  uniform float u_amount;
  uniform float u_smoothness;
  uniform float u_rotation;
  uniform float u_opacity;

  varying vec2 vUv;

  void main() {
    // Normalize coordinates
    vec2 uv = vUv;

    // Convert rotation from degrees to radians
    float angle = radians(u_rotation);

    // Create rotation matrix
    mat2 rotationMatrix = mat2(
      cos(angle), -sin(angle),
      sin(angle), cos(angle)
    );

    // Center the UV coordinates, rotate, then uncenter
    vec2 centeredUV = uv - 0.5;
    vec2 rotatedUV = rotationMatrix * centeredUV;
    rotatedUV += 0.5;

    // Calculate stacked noise with frequency parameter using rotated coordinates
    float noise = 0.0;

    // Octave 1: Main wave pattern - add Y offset for vertical movement
    noise += snoise(vec3(rotatedUV.x * u_frequency, rotatedUV.y * u_frequency * 0.5, u_time)) * 0.5;

    // Octave 2: Secondary variation - different Y offset
    noise += snoise(vec3(rotatedUV.x * u_frequency * 2.0 + 5.0, rotatedUV.y * u_frequency * 0.3, u_time * 1.5)) * 0.25;

    // Octave 3: Fine details - subtle Y variation
    noise += snoise(vec3(rotatedUV.x * u_frequency * 4.0 + 10.0, rotatedUV.y * u_frequency * 0.2, u_time * 2.0)) * 0.125;

    // Add vertical movement by offsetting the Y coordinate
    float yOffset = snoise(vec3(rotatedUV.x * 2.0, 0.0, u_time * 0.5)) * 0.3;

    // Normalize the noise to 0-1 range
    noise = noise * 0.5 + 0.5;

    // Mix with base gradient using rotated X coordinate
    float baseGradient = rotatedUV.x + yOffset;
    noise = mix(baseGradient, noise, u_amount);

    // Apply smoothstep for softer transitions (use smoothness parameter)
    float smoothMin = 0.5 - u_smoothness * 0.5;
    float smoothMax = 0.5 + u_smoothness * 0.5;
    noise = smoothstep(smoothMin, smoothMax, noise);

    // Clamp the noise value
    noise = clamp(noise, 0.0, 1.0);

    // Sample the gradient texture
    vec4 color = texture2D(u_gradient, vec2(noise, 0.5));

    // Apply opacity
    color.a *= u_opacity;

    gl_FragColor = color;
  }
`;

function createGradientTexture(c1, c2, c3, c4, c5) {
  // Guard against SSR - only run on client
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 512, 0);

  gradient.addColorStop(0, c1);      // Color0
  gradient.addColorStop(0.25, c2);   // Color1
  gradient.addColorStop(0.5, c3);    // Color2
  gradient.addColorStop(0.75, c4);   // Color3
  gradient.addColorStop(1, c5);      // Color4

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}

function init() {
  if (!canvasRef.value) return;

  // Scene setup
  scene = new THREE.Scene();

  // Camera setup - orthographic for flat 2D gradient
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
  camera.position.z = 1;

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Create a simple plane geometry (no subdivisions needed)
  const geometry = new THREE.PlaneGeometry(2 * aspect, 2);

  // Create gradient texture
  const gradientTexture = createGradientTexture(
    color1.value,
    color2.value,
    color3.value,
    color4.value,
    color5.value
  );

  // Guard against SSR - exit if texture creation failed
  if (!gradientTexture) return;

  // Shader material with uniforms - start with 0 values for entrance animation
  material = new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_gradient: { value: gradientTexture },
      u_frequency: { value: 0 }, // Start at 0
      u_amount: { value: 0 }, // Start at 0
      u_smoothness: { value: smoothness.value },
      u_rotation: { value: rotation.value },
      u_opacity: { value: 0 } // Start at 0
    },
    vertexShader,
    fragmentShader,
    transparent: true
  });

  // Create mesh
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Start animation
  animate();

  // Entrance animation: animate all parameters from 0 to target values over 10 seconds
  const animationDuration = 10;
  const animationEase = 'power2.out';

  // Animate opacity
  gsap.to(material.uniforms.u_opacity, {
    value: opacity.value,
    duration: animationDuration,
    ease: animationEase
  });

  // Animate frequency
  gsap.to(material.uniforms.u_frequency, {
    value: frequency.value,
    duration: animationDuration,
    ease: animationEase
  });

  // Animate amount
  gsap.to(material.uniforms.u_amount, {
    value: amount.value,
    duration: animationDuration,
    ease: animationEase
  });

  // Animate speed (this affects u_time increment in animate function)
  // We'll create a temporary object to animate and update the speed
  const speedAnim = { value: 0 };
  gsap.to(speedAnim, {
    value: speed.value,
    duration: animationDuration,
    ease: animationEase,
    onUpdate: () => {
      // The animate function will use the current speed.value
      speed.value = speedAnim.value;
    },
    onComplete: () => {
      console.log('Gradient entrance animation complete');
      // Reset speed to original value
      speed.value = speedAnim.value;
    }
  });
}

function animate() {
  animationId = requestAnimationFrame(animate);

  if (material) {
    material.uniforms.u_time.value += speed.value;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function handleResize() {
  if (!renderer || !camera || !mesh) return;

  const aspect = window.innerWidth / window.innerHeight;

  // Update orthographic camera
  camera.left = -aspect;
  camera.right = aspect;
  camera.updateProjectionMatrix();

  // Update plane geometry to match new aspect ratio
  mesh.geometry.dispose();
  mesh.geometry = new THREE.PlaneGeometry(2 * aspect, 2);

  // Update resolution uniform
  material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);

  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Watch for parameter changes and update shader uniforms
watch([frequency, amount, smoothness, rotation, opacity], () => {
  if (material) {
    material.uniforms.u_frequency.value = frequency.value;
    material.uniforms.u_amount.value = amount.value;
    material.uniforms.u_smoothness.value = smoothness.value;
    material.uniforms.u_rotation.value = rotation.value;
    material.uniforms.u_opacity.value = opacity.value;
  }
});

// Watch for color changes and regenerate gradient texture
watch([color1, color2, color3, color4, color5], () => {
  if (material && material.uniforms.u_gradient.value) {
    // Dispose old texture
    material.uniforms.u_gradient.value.dispose();

    // Create new texture with updated colors
    const newTexture = createGradientTexture(
      color1.value,
      color2.value,
      color3.value,
      color4.value,
      color5.value
    );

    // Only update if texture was created successfully
    if (newTexture) {
      material.uniforms.u_gradient.value = newTexture;
    }
  }
});

onMounted(() => {
  init();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  if (renderer) {
    renderer.dispose();
  }

  if (material) {
    material.dispose();
    if (material.uniforms.u_gradient.value) {
      material.uniforms.u_gradient.value.dispose();
    }
  }

  if (mesh && mesh.geometry) {
    mesh.geometry.dispose();
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
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
