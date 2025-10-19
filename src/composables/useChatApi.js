import { ref } from 'vue';

/**
 * Composable for handling chat API calls
 * Manages conversation state, message history, and API communication
 */
export function useChatApi() {
  const messages = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const conversationId = ref(null);

  /**
   * Send a message to the chat API
   * @param {string} message - User's message
   * @param {string} leadId - Optional lead ID to associate with conversation
   */
  async function sendMessage(message, leadId = null) {
    isLoading.value = true;
    error.value = null;

    // Add user message to UI immediately
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    messages.value.push(userMessage);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId.value,
          lead_id: leadId,
          history: messages.value.slice(-10) // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response to messages
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      messages.value.push(assistantMessage);

      // Store conversation ID for continuity
      if (data.conversation_id) {
        conversationId.value = data.conversation_id;
      }

      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Chat API error:', err);
      
      // Add error message to chat
      messages.value.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      });
      
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Clear conversation history
   */
  function clearMessages() {
    messages.value = [];
    conversationId.value = null;
    error.value = null;
  }

  /**
   * Initialize conversation with a greeting
   */
  async function initializeChat() {
    messages.value = [{
      role: 'assistant',
      content: 'Hi! I\'m your automation consultant. I\'m here to understand your needs and help you automate your business. What brings you here today?',
      timestamp: new Date()
    }];
  }

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    clearMessages,
    initializeChat
  };
}

