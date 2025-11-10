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
  gap: 12px;
  align-items: flex-start;
}

.message--user {
  flex-direction: row-reverse;
}

.message__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fb6400;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.message--user .message__avatar {
  background: #333;
}

.message__content {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message__text {
  background: #1a1a1a;
  border: 1px solid #333;
  padding: 12px 16px;
  border-radius: 12px;
  color: #fff;
  line-height: 1.5;
  word-wrap: break-word;
  font-family: 'PP Supply Mono', monospace;
  font-size: 14px;
}

.message--bot .message__text {
  border-bottom-left-radius: 4px;
}

.message--user .message__text {
  background: #212121;
  border-color: #424242;
  border-bottom-right-radius: 4px;
}

.message__time {
  font-size: 11px;
  color: #666;
  padding: 0 8px;
  font-family: 'PP Supply Mono', monospace;
}

.message--user .message__time {
  text-align: right;
}

@media (max-width: 768px) {
  .message__content {
    max-width: 80%;
  }
  
  .message__avatar {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .message__text {
    font-size: 13px;
    padding: 10px 14px;
  }
}
</style>

