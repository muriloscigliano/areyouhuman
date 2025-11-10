<template>
  <div 
    ref="wrapperRef"
    class="wrapper-scene"
    :class="{ 
      'BOTTOM': zIndex === 'bottom',
      'TOP': zIndex === 'top',
      'active': isActive 
    }"
  >
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  effect: {
    type: String,
    default: 'slide',
    validator: (value) => ['slide', 'fade', 'blur', 'morph', 'reveal'].includes(value)
  },
  direction: {
    type: String,
    default: 'horizontal',
    validator: (value) => ['horizontal', 'vertical'].includes(value)
  },
  duration: {
    type: Number,
    default: 1000
  }
});

const emit = defineEmits(['complete']);

const wrapperRef = ref(null);
const canvasRef = ref(null);
let gl = null;
let program = null;
let animationId = null;
let startTime = null;
let isActive = ref(false);
let zIndex = ref('default');

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_uv = a_position * 0.5 + 0.5;
  }
`;

const fragmentShaders = {
  slide: `
    precision highp float;
    uniform float u_progress;
    uniform vec2 u_resolution;
    uniform int u_direction;
    varying vec2 v_uv;
    
    void main() {
      vec2 uv = v_uv;
      float progress = u_progress;
      
      float offset = 0.0;
      if (u_direction == 0) {
        offset = mix(-1.0, 1.0, progress);
        uv.x += offset;
      } else {
        offset = mix(-1.0, 1.0, progress);
        uv.y += offset;
      }
      
      vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
      
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
      } else {
        float edge = smoothstep(0.0, 0.1, abs(uv.x - 0.5));
        color = vec4(0.0, 0.0, 0.0, 1.0 - edge);
      }
      
      gl_FragColor = color;
    }
  `,
  
  fade: `
    precision highp float;
    uniform float u_progress;
    varying vec2 v_uv;
    
    void main() {
      float alpha = 1.0 - abs(u_progress * 2.0 - 1.0);
      gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
    }
  `,
  
  blur: `
    precision highp float;
    uniform float u_progress;
    uniform vec2 u_resolution;
    varying vec2 v_uv;
    
    void main() {
      float blurAmount = abs(u_progress * 2.0 - 1.0) * 0.1;
      float alpha = 1.0 - abs(u_progress * 2.0 - 1.0);
      
      vec4 color = vec4(0.0, 0.0, 0.0, alpha);
      gl_FragColor = color;
    }
  `,
  
  morph: `
    precision highp float;
    uniform float u_progress;
    uniform vec2 u_resolution;
    varying vec2 v_uv;
    
    void main() {
      vec2 uv = v_uv;
      float progress = u_progress;
      
      float wave = sin(uv.x * 10.0 + progress * 3.14159) * 0.1;
      uv.y += wave * progress;
      
      float alpha = 1.0;
      if (uv.y < 0.0 || uv.y > 1.0) {
        alpha = 0.0;
      }
      
      gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
    }
  `,
  
  reveal: `
    precision highp float;
    uniform float u_progress;
    uniform vec2 u_resolution;
    varying vec2 v_uv;
    
    void main() {
      vec2 uv = v_uv;
      float progress = u_progress;
      
      float centerX = 0.5;
      float dist = abs(uv.x - centerX);
      float reveal = smoothstep(0.5, 0.0, dist * 2.0 - progress * 2.0);
      
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - reveal);
    }
  `
};

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

function initWebGL() {
  if (!canvasRef.value) return;
  
  const canvas = canvasRef.value;
  gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    console.warn('WebGL not supported, falling back to CSS transitions');
    return;
  }
  
  resizeCanvas();
  
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaders[props.effect]);
  
  if (!vertexShader || !fragmentShader) return;
  
  program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) return;
  
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ]), gl.STATIC_DRAW);
  
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  
  gl.useProgram(program);
}

function resizeCanvas() {
  if (!canvasRef.value || !gl) return;
  
  const dpr = window.devicePixelRatio || 1;
  const rect = canvasRef.value.getBoundingClientRect();
  
  canvasRef.value.width = rect.width * dpr;
  canvasRef.value.height = rect.height * dpr;
  
  gl.viewport(0, 0, canvasRef.value.width, canvasRef.value.height);
}

function animate(currentTime) {
  if (!gl || !program || !isActive.value) {
    return;
  }
  
  if (!startTime) {
    startTime = currentTime;
  }
  
  const elapsed = currentTime - startTime;
  const progress = Math.min(elapsed / props.duration, 1.0);
  
  const progressLocation = gl.getUniformLocation(program, 'u_progress');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  const directionLocation = gl.getUniformLocation(program, 'u_direction');
  
  gl.uniform1f(progressLocation, progress);
  gl.uniform2f(resolutionLocation, canvasRef.value.width, canvasRef.value.height);
  gl.uniform1i(directionLocation, props.direction === 'horizontal' ? 0 : 1);
  
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
  if (progress < 1.0) {
    animationId = requestAnimationFrame(animate);
  } else {
    isActive.value = false;
    zIndex.value = 'default';
    startTime = null;
    emit('complete');
  }
}

function startTransition() {
  if (!gl || !program) {
    console.warn('WebGL not initialized, using CSS fallback');
    setTimeout(() => {
      isActive.value = false;
      emit('complete');
    }, props.duration);
    return;
  }
  
  isActive.value = true;
  zIndex.value = 'top';
  startTime = null;
  animationId = requestAnimationFrame(animate);
}

watch(() => props.active, (newVal) => {
  if (newVal) {
    startTransition();
  } else {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    isActive.value = false;
    zIndex.value = 'default';
  }
});

onMounted(() => {
  initWebGL();
  window.addEventListener('resize', resizeCanvas);
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('resize', resizeCanvas);
  
  if (gl && program) {
    gl.deleteProgram(program);
  }
});
</script>

<style scoped>
.wrapper-scene {
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 8;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.wrapper-scene.active {
  opacity: 1;
}

.wrapper-scene.BOTTOM {
  z-index: 6;
}

.wrapper-scene.TOP {
  z-index: 11;
}

.wrapper-scene canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>

