<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { gsap } from 'gsap';
import axios from 'axios';
import AiMessage from './AiMessage.vue';
import AiInput from './AiInput.vue';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const messages = ref<Message[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const leadId = ref<string | null>(null);
const conversationId = ref<string | null>(null);

// Smart greeting system - dynamic Telos personality
const getSmartGreeting = () => {
  const hour = new Date().getHours();
  const isReturningUser = localStorage.getItem('telos_visited') === 'true';
  const lastProject = localStorage.getItem('telos_last_project');
  
  // Time-based context
  let timeContext = '';
  if (hour >= 5 && hour < 12) timeContext = 'morning';
  else if (hour >= 12 && hour < 17) timeContext = 'afternoon';
  else if (hour >= 17 && hour < 22) timeContext = 'evening';
  else timeContext = 'night';
  
  // Device context (optional personalization)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Different greetings for returning vs new users
  const newUserGreetings = [
    `Hey Human 👋 I'm Telos — your strategist from the folds of time.\nReady to build something that feels half magic, half machine?`,
    
    `Hey Human ⚡️\nI'm Telos, your AI strategist. Let's turn your idea into something real — what's on your mind?`,
    
    `Good ${timeContext}, Human 👋\nI'm Telos. I help founders and teams design AI systems that stay human.\nWhat brings you here today?`,
    
    `Hey Human 🌟\nTelos here — part strategist, part design assistant, fully curious about your vision.\nWhat would you like to build?`,
    
    `Hey Human 👋\nI came through the folds of time to help you reshape what's next.\nShall we start with your idea?`
  ];
  
  const returningUserGreetings = [
    `Welcome back, Human 👋\nTelos here — ready when you are. New project, or continuing something?`,
    
    `Hey Human ⚡️\nGood to see you again. What's the next challenge we're solving together?`,
    
    `Human! You're back 🌟\nLet's pick up where brilliance left off — or start something entirely new.`,
    
    `Hey Human 👋\nI remember you. Ready to turn another idea into reality?`,
    
    `Good ${timeContext}, Human ⚡️\nBack for more magic? Let's do this.`,
    
    lastProject 
      ? `Welcome back, Human 👋\nI remember we were exploring ${lastProject}. Continue that, or start fresh?`
      : `Human! The folds of time brought you back 🌟\nWhat's brewing in your mind today?`
  ];
  
  // Choose greeting based on context
  const greetings = isReturningUser ? returningUserGreetings : newUserGreetings;
  const randomIndex = Math.floor(Math.random() * greetings.length);
  
  return greetings[randomIndex];
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
    <div class="ai-chat__header">
      <div class="ai-chat__title">
        <span class="ai-chat__icon">🤖</span>
        <div>
          <h3>Are You Human? Copilot</h3>
          <p class="ai-chat__status">
            <span class="ai-chat__status-dot"></span>
            Online
          </p>
        </div>
      </div>
    </div>
    
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
    
    <AiInput @send="handleSend" />
  </div>
</template>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.ai-chat__header {
  padding: 1.25rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.ai-chat__title {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.ai-chat__icon {
  font-size: 2rem;
}

.ai-chat__title h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
}

.ai-chat__status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.6);
}

.ai-chat__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.ai-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.ai-chat__messages::-webkit-scrollbar {
  width: 6px;
}

.ai-chat__messages::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.ai-chat__messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.ai-chat__messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-chat__typing {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: flex-start;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.875rem 1.125rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  border-bottom-left-radius: 0.25rem;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
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
    opacity: 0.6;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .ai-chat {
    height: 500px;
    border-radius: 1rem;
  }
  
  .ai-chat__header {
    padding: 1rem;
  }
  
  .ai-chat__messages {
    padding: 1rem;
  }
}
</style>

