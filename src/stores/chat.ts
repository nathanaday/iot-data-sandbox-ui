/**
 * Pinia store for managing Chat functionality
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '@/api';
import type { ChatMessage, ChatStatusResponse } from '@/api';

const POLLING_INTERVAL = 200; // 200ms polling interval

interface StreamingState {
  jobId: string;
  lastResponseLength: number;
  pollingInterval: ReturnType<typeof setInterval> | null;
}

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref<ChatMessage[]>([]);
  const conversationId = ref<string | null>(null);
  const selectedProviderId = ref<number | null>(null);
  const isStreaming = ref(false);
  const streamingState = ref<StreamingState | null>(null);
  const totalInputTokens = ref(0);
  const totalOutputTokens = ref(0);
  const lastResponseTime = ref<number | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(false);

  // Computed
  const totalTokens = computed(() => totalInputTokens.value + totalOutputTokens.value);

  const estimatedCost = computed(() => {
    // Rough estimate based on typical pricing (adjust as needed)
    const inputCost = (totalInputTokens.value / 1000) * 0.003;
    const outputCost = (totalOutputTokens.value / 1000) * 0.015;
    return inputCost + outputCost;
  });

  const hasMessages = computed(() => messages.value.length > 0);

  const canSendMessage = computed(() =>
    selectedProviderId.value !== null && !isStreaming.value
  );

  // Actions

  /**
   * Send a message to the chat
   */
  async function sendMessage(content: string): Promise<void> {
    if (!selectedProviderId.value) {
      error.value = 'Please select an LLM provider first';
      return;
    }

    if (isStreaming.value) {
      error.value = 'Please wait for the current response to complete';
      return;
    }

    const startTime = Date.now();
    error.value = null;

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    messages.value.push(userMessage);

    try {
      // Submit message to API
      const response = await apiService.submitChatMessage({
        message: content,
        conversation_id: conversationId.value || undefined,
        provider_id: selectedProviderId.value,
      });

      // Update conversation ID if this is a new conversation
      if (!conversationId.value) {
        conversationId.value = response.conversation_id;
      }

      // Add placeholder for assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      messages.value.push(assistantMessage);

      // Start polling for response
      await pollForResponse(response.job_id, messages.value.length - 1, startTime);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message';
      // Remove the user message if sending failed
      messages.value.pop();
    }
  }

  /**
   * Poll for chat response
   */
  async function pollForResponse(
    jobId: string,
    messageIndex: number,
    startTime: number
  ): Promise<void> {
    isStreaming.value = true;
    streamingState.value = {
      jobId,
      lastResponseLength: 0,
      pollingInterval: null,
    };

    const poll = async () => {
      try {
        const status = await apiService.getChatStatus(jobId);
        const targetMessage = messages.value[messageIndex];

        // Update the assistant message with new content
        if (targetMessage && status.response_text.length > streamingState.value!.lastResponseLength) {
          targetMessage.content = status.response_text;
          streamingState.value!.lastResponseLength = status.response_text.length;
        }

        // Check if complete
        if (status.status === 'complete') {
          stopPolling();
          totalInputTokens.value += status.input_tokens;
          totalOutputTokens.value += status.output_tokens;
          if (targetMessage) {
            targetMessage.token_count = status.output_tokens;
          }
          lastResponseTime.value = Date.now() - startTime;
        } else if (status.status === 'failed') {
          stopPolling();
          error.value = status.error || 'Chat request failed';
          // Remove the empty assistant message
          messages.value.splice(messageIndex, 1);
        }
      } catch (err) {
        stopPolling();
        error.value = err instanceof Error ? err.message : 'Failed to get response';
      }
    };

    // Start polling
    await poll();
    if (isStreaming.value) {
      streamingState.value!.pollingInterval = setInterval(poll, POLLING_INTERVAL);
    }
  }

  /**
   * Stop polling for response
   */
  function stopPolling(): void {
    if (streamingState.value?.pollingInterval) {
      clearInterval(streamingState.value.pollingInterval);
    }
    streamingState.value = null;
    isStreaming.value = false;
  }

  /**
   * Clear chat history
   */
  async function clearHistory(): Promise<void> {
    if (conversationId.value) {
      try {
        await apiService.clearChatHistory(conversationId.value);
      } catch (err) {
        console.error('Failed to clear history on server:', err);
      }
    }

    messages.value = [];
    conversationId.value = null;
    totalInputTokens.value = 0;
    totalOutputTokens.value = 0;
    lastResponseTime.value = null;
    error.value = null;
  }

  /**
   * Set the selected LLM provider
   */
  function setSelectedProvider(providerId: number): void {
    selectedProviderId.value = providerId;
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Reset store state
   */
  function $reset(): void {
    stopPolling();
    messages.value = [];
    conversationId.value = null;
    selectedProviderId.value = null;
    isStreaming.value = false;
    streamingState.value = null;
    totalInputTokens.value = 0;
    totalOutputTokens.value = 0;
    lastResponseTime.value = null;
    error.value = null;
    loading.value = false;
  }

  return {
    // State
    messages,
    conversationId,
    selectedProviderId,
    isStreaming,
    totalInputTokens,
    totalOutputTokens,
    lastResponseTime,
    error,
    loading,
    // Computed
    totalTokens,
    estimatedCost,
    hasMessages,
    canSendMessage,
    // Actions
    sendMessage,
    stopPolling,
    clearHistory,
    setSelectedProvider,
    clearError,
    $reset,
  };
});
