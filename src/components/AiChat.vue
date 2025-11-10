<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { gsap } from 'gsap';
import axios from 'axios';
import AiMessage from './AiMessage.vue';
import greetingsData from '../data/context/greetings.json';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface GreetingCondition {
  time?: string;
  isReturning?: boolean;
  intent?: string;
  hasProject?: boolean;
  isWeekend?: boolean;
}

interface Greeting {
  id: string;
  condition: GreetingCondition;
  message: string;
}

const messages = ref<Message[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const leadId = ref<string | null>(null);
const conversationId = ref<string | null>(null);
const currentMessage = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// Smart greeting system - loads from JSON with condition matching
const getSmartGreeting = () => {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isReturningUser = localStorage.getItem('telos_visited') === 'true';
  const lastProject = localStorage.getItem('telos_last_project');
  const lastIntent = localStorage.getItem('telos_last_intent');
  
  // Determine time context
  let timeContext = '';
  if (hour >= 5 && hour < 12) timeContext = 'morning';
  else if (hour >= 12 && hour < 17) timeContext = 'afternoon';
  else if (hour >= 17 && hour < 22) timeContext = 'evening';
  else timeContext = 'night';
  
  // Check if weekend
  const isWeekend = day === 0 || day === 6;
  
  // Build current context
  const currentContext = {
    time: timeContext,
    isReturning: isReturningUser,
    hasProject: !!lastProject,
    intent: lastIntent || undefined,
    isWeekend
  };
  
  // Find matching greetings from JSON
  const matchingGreetings = greetingsData.greetings.filter((greeting: Greeting) => {
    return matchesCondition(greeting.condition, currentContext);
  });
  
  // Pick random from matching greetings, or use default
  if (matchingGreetings.length > 0) {
    const randomIndex = Math.floor(Math.random() * matchingGreetings.length);
    let message = matchingGreetings[randomIndex].message;
    
    // Replace template variables
    if (lastProject) {
      message = message.replace('{{projectName}}', lastProject);
    }
    
    return message;
  }
  
  // Fallback
  return "Hey Human 👋 I'm Telos. Let's build something extraordinary together.";
};

// Condition matching logic
const matchesCondition = (condition: GreetingCondition, context: any): boolean => {
  // Check each condition property
  for (const [key, value] of Object.entries(condition)) {
    if (context[key] !== value) {
      return false;
    }
  }
  return true;
};

// Initial greeting message - now dynamic!
onMounted(() => {
  if (chatContainer.value) {
    gsap.from(chatContainer.value, {
      opacity: 0,
      scale: 0.95,
      duration: 0.5,
      ease: 'power2.out'
    });
  }
  
  // Mark user as visited for future sessions
  localStorage.setItem('telos_visited', 'true');
  
  setTimeout(() => {
    addBotMessage(getSmartGreeting());
  }, 500);
});

const addMessage = (text: string, isBot: boolean) => {
  const message: Message = {
    id: Date.now().toString() + Math.random(),
    text,
    isBot,
    timestamp: new Date()
  };
  
  messages.value.push(message);
  scrollToBottom();
};

const addBotMessage = (text: string) => {
  addMessage(text, true);
};

const addUserMessage = (text: string) => {
  addMessage(text, false);
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    });
  }
};

const handleSendMessage = () => {
  if (!currentMessage.value.trim()) return;
  handleSend(currentMessage.value);
  currentMessage.value = '';
};

// Method to send initial message from parent (ContactModal)
const sendInitialMessage = (message: string) => {
  if (message && message.trim()) {
    handleSend(message);
  }
};

// Expose method to parent component
defineExpose({
  sendInitialMessage
});

const handleSend = async (messageText: string) => {
  addUserMessage(messageText);
  
  isLoading.value = true;
  
  try {
    // Call your API endpoint
    const response = await axios.post('/api/chat', {
      message: messageText,
      conversationHistory: messages.value,
      leadId: leadId.value,
      conversationId: conversationId.value
    });
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate thinking
    
    if (response.data.reply) {
      addBotMessage(response.data.reply);
    }

    // Store IDs for future messages
    if (response.data.leadId) {
      leadId.value = response.data.leadId;
    }
    if (response.data.conversationId) {
      conversationId.value = response.data.conversationId;
    }
  } catch (error) {
    console.error('Chat error:', error);
    
    // Fallback responses for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (messages.value.length === 2) {
      addBotMessage(`Nice to meet you! What company do you work for?`);
    } else if (messages.value.length === 4) {
      addBotMessage(`Great! What's your role at ${messageText}?`);
    } else if (messages.value.length === 6) {
      addBotMessage(`Interesting! What's the biggest challenge you're facing that automation could help solve?`);
    } else {
      addBotMessage(`Thanks for sharing! I'm analyzing how automation can help you. Our team will reach out soon with personalized recommendations.`);
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div ref="chatContainer" class="ai-chat">
    <!-- Messages Container -->
    <div ref="messagesContainer" class="ai-chat__messages">
      <AiMessage
        v-for="message in messages"
        :key="message.id"
        :message="message.text"
        :is-bot="message.isBot"
        :timestamp="message.timestamp"
      />
      
      <div v-if="isLoading" class="ai-chat__typing">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
    
    <!-- Input Area -->
    <div class="ai-chat__input-wrapper">
      <div class="input-container">
        <div class="input-content">
          <input 
            ref="inputRef"
            v-model="currentMessage"
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
              :disabled="!currentMessage.trim()"
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
</template>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 24px;
}

.ai-chat__messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 8px;
}

.ai-chat__messages::-webkit-scrollbar {
  width: 4px;
}

.ai-chat__messages::-webkit-scrollbar-track {
  background: transparent;
}

.ai-chat__messages::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 2px;
}

.ai-chat__messages::-webkit-scrollbar-thumb:hover {
  background: #444;
}

.ai-chat__typing {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.typing-indicator {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid #333;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #666;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* Input Wrapper */
.ai-chat__input-wrapper {
  width: 100%;
}

.input-container {
  background: #121212;
  border: 1px solid #7f7f7f;
  border-radius: 24px;
  padding: 6px;
}

.input-content {
  background: #171717;
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.message-input {
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-family: 'PP Supply Mono', monospace;
  font-size: 16px;
  letter-spacing: 0.48px;
  width: 100%;
  flex: 1;
  resize: none;
}

.message-input::placeholder {
  color: #bababa;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

@media (max-width: 768px) {
  .input-content {
    min-height: 100px;
    padding: 14px;
  }

  .message-input {
    font-size: 14px;
  }
}
</style>

