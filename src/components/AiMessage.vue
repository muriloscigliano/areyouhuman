<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { gsap } from 'gsap';
import ThinkingIndicator from './ThinkingIndicator.vue';

interface Props {
  message: string;
  isBot: boolean;
  timestamp?: Date;
  showThinking?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showThinking: false
});

const messageEl = ref<HTMLElement | null>(null);

// Enhanced message formatting to match Figma patterns
// Supports: **bold**, line breaks, important questions, bullet lists, italic examples
const formattedMessage = computed(() => {
  if (!props.isBot) return props.message;
  
  let formatted = props.message.trim();
  
  // Step 1: Handle bullet lists (lines starting with * or -)
  // Convert bullet lists to HTML <ul> and <li> tags
  const lines = formatted.split('\n');
  const processedLines: Array<string> = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Detect bullet: starts with *, -, or • followed by space (but not *(text)* pattern)
    const isBullet = /^[\*\-\•]\s+/.test(line) && !/^\*\(/.test(line);
    const nextIsBullet = i < lines.length - 1 && /^[\*\-\•]\s+/.test(lines[i + 1]?.trim()) && !/^\*\(/.test(lines[i + 1]?.trim());
    
    if (isBullet) {
      if (!inList) {
        processedLines.push('<ul class="message__list">');
        inList = true;
      }
      // Remove bullet marker and wrap in <li>
      const listItem = line.replace(/^[\*\-\•]\s+/, '');
      processedLines.push(`<li>${listItem}</li>`);
      
      // Close list if next line is not a bullet
      if (!nextIsBullet) {
        processedLines.push('</ul>');
        inList = false;
      }
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  
  // Close list if still open
  if (inList) {
    processedLines.push('</ul>');
  }
  
  formatted = processedLines.join('\n');
  
  // Step 2: Handle italic examples like *(e.g., ...)*
  formatted = formatted.replace(/\*\(([^)]+)\)\*/g, '<em class="message__example">($1)</em>');
  
  // Step 3: Handle important questions - bold questions ending with ? should be on their own line
  formatted = formatted.replace(/([^\n<])\s*\*\*([^*]+\?)\*\*/g, '$1<br /><strong>$2</strong>');
  
  // Step 4: Handle explicit line breaks before questions
  formatted = formatted.replace(/\n\s*\*\*([^*]+\?)\*\*/g, '<br /><strong>$1</strong>');
  
  // Step 5: Convert remaining **bold** to <strong> tags (non-greedy)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Step 6: Handle paragraph breaks and line breaks
  const hasParagraphBreaks = /\n\n+/.test(formatted);
  
  if (hasParagraphBreaks) {
    // Split by double+ newlines and wrap each in <p> tags
    const paragraphs = formatted.split(/\n\n+/).filter(p => p.trim());
    formatted = paragraphs.map(p => {
      // Ensure bold questions are on their own line within paragraphs
      p = p.replace(/([^<])\s*<strong>([^<]+\?)<\/strong>/g, '$1<br /><strong>$2</strong>');
      // Convert single newlines to <br /> but preserve lists
      p = p.replace(/\n(?!<[ul])/g, '<br />');
      return `<p>${p}</p>`;
    }).join('');
  } else {
    // Single newlines become <br />, but preserve list structure
    formatted = formatted.replace(/\n(?!<[ul])/g, '<br />');
    
    // Final pass: ensure any bold questions are on their own line
    formatted = formatted.replace(/([^<])\s*<strong>([^<]+\?)<\/strong>/g, '$1<br /><strong>$2</strong>');
    
    formatted = `<p>${formatted}</p>`;
  }
  
  return formatted;
});

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

/* Gap between message bubble and thinking indicator */
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
  border: 1px solid #424242;
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

.message__bubble--bot .message__text p {
  margin: 0;
  padding: 0;
  line-height: 1.4;
}

.message__bubble--bot .message__text p + p {
  margin-top: 1em;
}

/* Bullet list styling - matches Figma */
.message__bubble--bot .message__text .message__list {
  list-style: none;
  padding: 0;
  margin: 0.5em 0;
  display: flex;
  flex-direction: column;
  gap: 0.25em;
}

.message__bubble--bot .message__text .message__list li {
  position: relative;
  padding-left: 1em;
  line-height: 1.4;
  color: inherit;
}

.message__bubble--bot .message__text .message__list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #868797;
  font-weight: 400;
}

/* Italic examples styling */
.message__bubble--bot .message__text .message__example {
  font-style: italic;
  color: #868797;
  font-size: 0.95em;
}

.message__bubble--bot .message__text strong {
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  font-weight: 700;
  color: inherit;
}

.message__bubble--bot .message__text br {
  display: block;
  content: "";
  line-height: 1.4;
  margin: 0;
}

/* Bold text styling - matches Figma */
.message__bubble--bot .message__text strong {
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  font-weight: 700;
  color: inherit;
  display: inline;
}

/* Ensure bold questions on their own line (no extra spacing) */
.message__bubble--bot .message__text br + strong {
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

