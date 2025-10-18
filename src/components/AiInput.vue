<script setup lang="ts">
import { ref } from 'vue';

interface Emits {
  (e: 'send', message: string): void;
}

const emit = defineEmits<Emits>();
const inputValue = ref('');
const isComposing = ref(false);

const handleSend = () => {
  const message = inputValue.value.trim();
  if (message) {
    emit('send', message);
    inputValue.value = '';
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !isComposing.value) {
    event.preventDefault();
    handleSend();
  }
};

const handleCompositionStart = () => {
  isComposing.value = true;
};

const handleCompositionEnd = () => {
  isComposing.value = false;
};
</script>

<template>
  <div class="ai-input">
    <div class="ai-input__wrapper">
      <textarea
        v-model="inputValue"
        @keydown="handleKeyDown"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
        class="ai-input__field"
        placeholder="Type your message..."
        rows="1"
      />
      <button 
        @click="handleSend"
        :disabled="!inputValue.trim()"
        class="ai-input__button"
        type="button"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.ai-input {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.ai-input__wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  max-width: 100%;
}

.ai-input__field {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1.25rem;
  padding: 0.875rem 1.25rem;
  color: white;
  font-size: 0.9375rem;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: all 0.2s ease;
  max-height: 120px;
  min-height: 44px;
}

.ai-input__field::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.ai-input__field:focus {
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.ai-input__button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.ai-input__button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-input__button:active:not(:disabled) {
  transform: scale(0.95);
}

.ai-input__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .ai-input {
    padding: 0.75rem;
  }
  
  .ai-input__field {
    font-size: 1rem;
    padding: 0.75rem 1rem;
  }
}
</style>

