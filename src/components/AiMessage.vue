<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { gsap } from 'gsap';
import ThinkingIndicator from './ThinkingIndicator.vue';
import { formatBotMessage } from '../utils/messageFormatter';

interface Props {
  message: string;
  isBot: boolean;
  timestamp?: Date;
  showThinking?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showThinking: false,
});

const messageEl = ref<HTMLElement | null>(null);

// Use optimized formatter for bot messages
const formattedMessage = computed(() => {
  if (!props.isBot) {
    return props.message;
  }
  return formatBotMessage(props.message);
});

onMounted(() => {
  if (messageEl.value) {
    gsap.from(messageEl.value, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: 'power2.out',
    });
  }
});
</script>

<template>
  <div
    ref="messageEl"
    :class="['message', { 'message--bot': isBot, 'message--user': !isBot }]"
  >
    <div v-if="isBot" class="message__content">
      <div class="message__bubble message__bubble--bot">
        <div class="message__text" v-html="formattedMessage"></div>
      </div>
      <div v-if="showThinking" class="message__thinking">
        <ThinkingIndicator />
      </div>
    </div>
    <div v-else class="message__content">
      <div class="message__bubble message__bubble--user">
        <p class="message__text">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

.message--user {
  align-items: flex-end;
}

.message--bot {
  align-items: flex-start;
}

.message__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.message__bubble + .message__thinking {
  margin-top: 0;
}

.message__bubble {
  border-radius: 18px;
  padding: 16px 16px;
  max-width: 100%;
  word-wrap: break-word;
}

.message__bubble--user {
  background: #1f1f1f;
  align-self: flex-end;
}

.message__bubble--bot {
  background: #171717;
  border: 1px solid #282828;
  padding: 24px 18px;
  align-self: flex-start;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.message__text {
  margin: 0;
  padding: 0;
  color: #fff;
  line-height: 1.4;
  letter-spacing: 0.48px;
}

.message__bubble--user .message__text {
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  font-weight: 500;
  font-size: 16px;
  text-transform: capitalize;
  letter-spacing: 0.48px;
  white-space: pre-wrap;
  line-height: 1.4;
}

.message__bubble--bot .message__text {
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  letter-spacing: 0.48px;
  line-height: 1.4;
}

.message__bubble--bot .message__text :deep(p) {
  margin: 0;
  padding: 0;
  line-height: 1.4;
}

.message__bubble--bot .message__text :deep(p + p) {
  margin-top: 1em;
}

/* Bullet list styling */
.message__bubble--bot .message__text :deep(.message__list) {
  list-style: none;
  padding: 0;
  margin: 0.5em 0;
  display: flex;
  flex-direction: column;
  gap: 0.25em;
}

.message__bubble--bot .message__text :deep(.message__list li) {
  position: relative;
  padding-left: 1em;
  line-height: 1.4;
  color: inherit;
}

.message__bubble--bot .message__text :deep(.message__list li::before) {
  content: '•';
  position: absolute;
  left: 0;
  color: #868797;
  font-weight: 400;
}

/* Italic examples styling */
.message__bubble--bot .message__text :deep(.message__example) {
  font-style: italic;
  color: #868797;
  font-size: 0.95em;
}

/* Example bullet list styling */
.message__bubble--bot .message__text :deep(.message__example-list) {
  list-style: none;
  padding: 0;
  margin: 0.5em 0;
  display: flex;
  flex-direction: column;
  gap: 0.35em;
}

.message__bubble--bot .message__text :deep(.message__example-list li) {
  position: relative;
  padding-left: 1.25em;
  line-height: 1.5;
  color: #acacac;
  font-style: italic;
  font-size: 0.95em;
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  display: flex;
  align-items: center;
}

.message__bubble--bot .message__text :deep(.message__example-list li::before) {
  content: '—';
  position: absolute;
  left: 0;
  color: #868797;
  font-weight: 400;
  font-size: 1em;
  line-height: 1;
  top: 50%;
  transform: translateY(-50%);
}

.message__bubble--bot .message__text :deep(strong) {
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  font-weight: 700;
  color: inherit;
  display: inline;
}

.message__bubble--bot .message__text :deep(br) {
  display: block;
  content: '';
  line-height: 1.4;
  margin: 0;
}

.message__bubble--bot .message__text :deep(br + strong) {
  display: block;
  margin: 0;
  line-height: 1.4;
}

.message__thinking {
  margin: 0;
  padding: 0;
}

@media (max-width: 768px) {
  .message__bubble {
    max-width: 85%;
  }

  .message__bubble--bot {
    padding: 18px 14px;
  }

  .message__bubble--user {
    padding: 10px 14px;
  }

  .message__bubble--bot .message__text {
    font-size: 14px;
  }

  .message__bubble--user .message__text {
    font-size: 14px;
  }
}
</style>
