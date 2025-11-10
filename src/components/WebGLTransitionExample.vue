<template>
  <div class="transition-demo">
    <WebGLTransition
      :active="isTransitioning"
      :effect="selectedEffect"
      :direction="selectedDirection"
      :duration="duration"
      @complete="onTransitionComplete"
    />
    
    <div class="demo-controls">
      <h3>WebGL Transition Demo</h3>
      
      <div class="control-group">
        <label>Effect:</label>
        <select v-model="selectedEffect">
          <option value="slide">Slide</option>
          <option value="fade">Fade</option>
          <option value="blur">Blur</option>
          <option value="morph">Morph</option>
          <option value="reveal">Reveal</option>
        </select>
      </div>
      
      <div class="control-group" v-if="selectedEffect === 'slide'">
        <label>Direction:</label>
        <select v-model="selectedDirection">
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>Duration: {{ duration }}ms</label>
        <input 
          type="range" 
          v-model.number="duration" 
          min="500" 
          max="3000" 
          step="100"
        />
      </div>
      
      <button @click="triggerTransition" :disabled="isTransitioning" class="btn-trigger">
        {{ isTransitioning ? 'Transitioning...' : 'Start Transition' }}
      </button>
    </div>
    
    <div class="demo-content">
      <p>This is demo content that will be covered by the WebGL transition overlay.</p>
      <p>Click the button above to see the transition effect.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import WebGLTransition from './WebGLTransition.vue';

const isTransitioning = ref(false);
const selectedEffect = ref('slide');
const selectedDirection = ref('horizontal');
const duration = ref(1000);

function triggerTransition() {
  isTransitioning.value = true;
}

function onTransitionComplete() {
  isTransitioning.value = false;
  console.log('Transition complete!');
}
</script>

<style scoped>
.transition-demo {
  min-height: 100vh;
  padding: 2rem;
}

.demo-controls {
  max-width: 600px;
  margin: 0 auto 3rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.demo-controls h3 {
  margin-bottom: 1.5rem;
  text-align: center;
}

.control-group {
  margin-bottom: 1.5rem;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.control-group select,
.control-group input[type="range"] {
  width: 100%;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
}

.control-group input[type="range"] {
  padding: 0;
  height: 8px;
  cursor: pointer;
}

.btn-trigger {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.btn-trigger:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.demo-content p {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}
</style>

