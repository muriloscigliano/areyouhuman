<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { gsap } from 'gsap';

interface Props {
  message: string;
  isBot: boolean;
  timestamp?: Date;
}

const props = defineProps<Props>();
const messageEl = ref<HTMLElement | null>(null);

onMounted(() => {
  if (messageEl.value) {
    gsap.from(messageEl.value, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: 'power2.out'
    });
  }
});
</script>

<template>
  <div 
    ref="messageEl"
    :class="['message', { 'message--bot': isBot, 'message--user': !isBot }]"
  >
    <div class="message__avatar">
      <span v-if="isBot">🤖</span>
      <span v-else>👤</span>
    </div>
    <div class="message__content">
      <div class="message__text">{{ message }}</div>
      <div v-if="timestamp" class="message__time">
        {{ timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: flex-start;
}

.message--user {
  flex-direction: row-reverse;
}

.message__avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.message--user .message__avatar {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.message__content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message__text {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.875rem 1.125rem;
  border-radius: 1rem;
  color: white;
  line-height: 1.5;
  word-wrap: break-word;
}

.message--bot .message__text {
  border-bottom-left-radius: 0.25rem;
}

.message--user .message__text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom-right-radius: 0.25rem;
}

.message__time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0 0.5rem;
}

.message--user .message__time {
  text-align: right;
}

@media (max-width: 768px) {
  .message__content {
    max-width: 80%;
  }
  
  .message__avatar {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }
}
</style>

