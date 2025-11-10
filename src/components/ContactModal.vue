<template>
  <aside ref="modalWrapRef" class="modal-wrap">
    <div class="modal-bg" @click="close"></div>
    <div ref="sidebarRef" class="sidebar">
      <!-- Close Button -->
      <div class="close-button-wrapper">
        <button 
          @click="close"
          class="close-button"
          aria-label="close button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Chat Container (hidden initially, shown when chatting) -->
      <div v-if="isChatting" class="chat-container">
        <AiChat ref="aiChatRef" />
      </div>

      <!-- Welcome Screen (shown initially) -->
      <div v-else class="welcome-screen">
        <!-- Top Section with title centered -->
        <div class="welcome-top">
          <h1 class="main-title">
            HEY HUMAN,<br>
            I AM <span class="title-emphasis">TELOS</span>
          </h1>
          <p class="subtitle">Talk to me about your project and let's build something together</p>
        </div>

        <!-- Bottom Section -->
        <div class="welcome-bottom">
          <!-- Quick Actions -->
          <div class="quick-actions">
            <button 
              v-for="action in quickActions" 
              :key="action.id"
              @click="handleQuickAction(action.text)"
              class="action-button"
            >
              <span>{{ action.text }}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 9L9 1M9 1H1M9 1V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- Input Area -->
          <div class="input-container">
            <div class="input-wrapper">
              <div class="input-content">
                <input 
                  ref="inputRef"
                  v-model="userInput"
                  @keydown.enter="handleSendMessage"
                  type="text"
                  placeholder="Ask anything here"
                  class="message-input"
                />
                <div class="input-actions">
                  <div class="action-icons">
                    <button class="icon-button active" aria-label="Search">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M11.5 11.5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                    </button>
                    <button class="icon-button" aria-label="Globe">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M1 8h14M8 1c-2 2-2 6 0 14M8 1c2 2 2 6 0 14" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                    </button>
                  </div>
                  <button 
                    @click="handleSendMessage"
                    :disabled="!userInput.trim()"
                    class="send-button"
                    aria-label="Send message"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2L8 14M8 2L3 7M8 2L13 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { gsap } from 'gsap';
import { useContactModal } from '../composables/useContactModal';
import AiChat from './AiChat.vue';

// Custom easing function - Material Design curve (0.4, 0.0, 0.2, 1)
// This creates a smooth, professional animation without needing CustomEase plugin
const telosEase = (t: number): number => {
  const p1 = 0.4, p2 = 0.0, p3 = 0.2, p4 = 1.0;
  const cx = 3 * p1;
  const bx = 3 * (p3 - p1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p2;
  const by = 3 * (p4 - p2) - cy;
  const ay = 1 - cy - by;
  
  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
  
  let t2 = t;
  for (let i = 0; i < 8; i++) {
    const x = sampleCurveX(t2) - t;
    if (Math.abs(x) < 0.001) break;
    const d = (3 * ax * t2 + 2 * bx) * t2 + cx;
    if (Math.abs(d) < 0.000001) break;
    t2 -= x / d;
  }
  
  return sampleCurveY(t2);
};

const { isOpen, close } = useContactModal();

const userInput = ref('');
const isChatting = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const aiChatRef = ref<typeof AiChat | null>(null);

const quickActions = [
  { id: 1, text: 'Amplify My Humanity' },
  { id: 2, text: 'Build AI Strategy' },
  { id: 3, text: 'Start AI Audit' },
  { id: 4, text: 'Estimate My Project' },
  { id: 5, text: 'Show AI Example' },
];

const handleQuickAction = (actionText: string) => {
  startChat(actionText);
};

const handleSendMessage = () => {
  if (!userInput.value.trim()) return;
  startChat(userInput.value);
};

const startChat = async (message: string) => {
  const messageToSend = message;
  userInput.value = '';
  isChatting.value = true;
  
  // Wait for next tick to ensure AiChat component is mounted
  await nextTick();
  
  // Send the initial message to the chat
  if (aiChatRef.value && typeof aiChatRef.value.sendInitialMessage === 'function') {
    aiChatRef.value.sendInitialMessage(messageToSend);
  }
};

const modalWrapRef = ref<HTMLElement | null>(null);
const sidebarRef = ref<HTMLElement | null>(null);
let openTimeline: gsap.core.Timeline | null = null;
let closeTimeline: gsap.core.Timeline | null = null;
let isAnimating = false;

function initModal() {
  if (!modalWrapRef.value || !sidebarRef.value) return;

  const modalWrap = modalWrapRef.value;
  const sidebar = sidebarRef.value;
  const bg = modalWrap.querySelector('.modal-bg') as HTMLElement;

  const isMobileLandscape = window.innerWidth < window.innerHeight && window.innerWidth < 768;
  const startX = isMobileLandscape ? 0 : window.innerWidth - 18;
  const startY = isMobileLandscape ? window.innerHeight - 18 : 0;

  // Set initial states immediately
  gsap.set(modalWrap, { display: 'none' });
  gsap.set(bg, { opacity: 0 });
  gsap.set(sidebar, { x: startX, y: startY });

  openTimeline = gsap.timeline({ paused: true })
    .set(modalWrap, { display: 'block' })
    .to(bg, { opacity: 1, duration: 0.5, ease: telosEase })
    .to(sidebar, { x: 0, y: 0, duration: 0.8, ease: telosEase }, '<');

  closeTimeline = gsap.timeline({
    paused: true,
    onStart: () => { isAnimating = true; },
    onComplete: () => {
      isAnimating = false;
      isChatting.value = false; // Reset chat state on close
    },
  })
    .to(bg, { opacity: 0, duration: 0.5, ease: telosEase })
    .to(sidebar, {
      x: startX,
      y: startY,
      duration: 0.8,
      ease: telosEase
    }, '<+=0.2')
    .set(modalWrap, { display: 'none' });
}

watch(isOpen, (newValue) => {
  if (newValue) {
    if (!isAnimating && openTimeline) {
      openTimeline.restart();
    }
  } else {
    if (!isAnimating && closeTimeline) {
      closeTimeline.restart();
    }
  }
});

onMounted(() => {
  // Initialize immediately - no setTimeout needed
  initModal();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen.value) {
      close();
    }
  });
});

onUnmounted(() => {
  if (openTimeline) {
    openTimeline.kill();
  }
  if (closeTimeline) {
    closeTimeline.kill();
  }
});
</script>

<style scoped>
/* Modal Wrapper */
.modal-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: none;
  pointer-events: all;
}

.modal-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  opacity: 0;
}

/* Sidebar Container */
.sidebar {
  position: absolute;
  top: 18px;
  right: 18px;
  bottom: 18px;
  width: 650px;
  height: calc(100% - 36px);
  background: #111111;
  border: 1px solid #333333;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 36px;
  box-shadow: 0 0 20px 20px rgba(0, 0, 0, 0.8);
  /* GSAP will handle all animations - no CSS transitions */
}

/* Close Button */
.close-button-wrapper {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 10;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #000;
  border: 1px solid #333333;
  border-radius: 50%;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: #fff;
  color: #000;
  border-color: #fff;
}

/* Chat Container */
.chat-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 48px;
  background: #111111;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 48px 36px 36px 36px;
  z-index: 1;
}

/* Welcome Screen */
.welcome-screen {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  gap: 100px;
  padding-top: 48px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 48px 36px 36px 36px;
}

.welcome-top {
  display: flex;
  flex-direction: column;
  gap: 36px;
  align-items: center;
  text-align: center;
  color: #fff;
  margin-top: 160px;
}

.main-title {
  font-family: 'PP Neue Machina', sans-serif;
  font-size: 56px;
  font-weight: 400;
  line-height: 1;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0;
}

.title-emphasis {
  font-family: 'PP Neue Machina', sans-serif;
  font-weight: 800;
  font-style: italic;
}

.subtitle {
  font-family: 'PP Supply Mono', monospace;
  font-size: 20px;
  font-weight: 200;
  line-height: 1.2;
  color: #fff;
  max-width: 424px;
  margin: 0 auto;
}

/* Bottom Section */
.welcome-bottom {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: #212121;
  border: 1px solid #424242;
  border-radius: 500px;
  color: #d8d9e8;
  font-family: 'Satoshi', sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-transform: capitalize;
  letter-spacing: 0.42px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #2a2a2a;
  border-color: #555;
}

.action-button svg {
  transform: rotate(180deg);
  color: currentColor;
}

/* Input Container */
.input-container {
  width: 100%;
}

.input-wrapper {
  background: #121212;
  border: 1px solid #7f7f7f;
  border-radius: 24px;
  padding: 6px;
  min-height: 200px;
}

.input-content {
  background: #171717;
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 188px;
}

.message-input {
  background: transparent;
  border: none;
  outline: none;
  color: #bababa;
  font-family: 'PP Supply Mono', monospace;
  font-size: 16px;
  letter-spacing: 0.48px;
  width: 100%;
  margin-bottom: auto;
}

.message-input::placeholder {
  color: #bababa;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.action-icons {
  display: flex;
  gap: 2px;
  background: #000;
  border: 1px solid #333333;
  border-radius: 500px;
  padding: 2px;
}

.icon-button {
  width: 36px;
  height: 36px;
  border-radius: 500px;
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-button.active {
  background: #171717;
  border: 1px solid #333333;
  color: #fff;
}

.icon-button:hover:not(.active) {
  color: #999;
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fb6400;
  border: none;
  color: #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.send-button:hover:not(:disabled) {
  background: #ff7a1a;
  transform: scale(1.05);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .sidebar {
    width: calc(100% - 36px);
    left: 18px;
    right: 18px;
    bottom: 18px;
    top: auto;
    max-height: calc(100% - 36px);
  }

  .close-button-wrapper {
    top: 12px;
    right: 12px;
  }

  .chat-container {
    padding: 40px 24px 24px 24px;
  }

  .welcome-screen {
    padding: 40px 24px 24px 24px;
  }

  .main-title {
    font-size: 40px;
  }

  .subtitle {
    font-size: 16px;
  }

  .action-button {
    font-size: 12px;
    padding: 10px 14px;
  }

  .input-wrapper {
    min-height: 150px;
  }

  .input-content {
    min-height: 138px;
  }
}
</style>

