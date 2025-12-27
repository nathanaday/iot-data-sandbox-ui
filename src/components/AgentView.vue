<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useLLMProvidersStore } from '@/stores/llmProviders';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LLMProviderManager from '@/components/LLMProviderManager.vue';
import { Send, Trash2, Loader2 } from 'lucide-vue-next';

const chatStore = useChatStore();
const providersStore = useLLMProvidersStore();

const message = ref('');
const isFocused = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

const suggestedPrompts = [
  'Show me anomalies in temperature readings',
  'What patterns do you see in the data?',
  'Summarize the last 24 hours of readings',
];

const dropShadowStyle = computed(() => {
  if (isFocused.value) {
    return 'filter: drop-shadow(0 4px 16px rgba(47, 130, 224, 0.25)) drop-shadow(0 8px 32px rgba(146, 126, 240, 0.2)) drop-shadow(0 12px 48px rgba(244, 121, 255, 0.15)); transition: filter 0.3s ease;';
  } else {
    return 'filter: drop-shadow(0 2px 8px rgba(47, 130, 224, 0.15)) drop-shadow(0 4px 12px rgba(146, 126, 240, 0.1)); transition: filter 0.3s ease;';
  }
});

const selectedProviderIdString = computed({
  get: () => chatStore.selectedProviderId?.toString() || '',
  set: (value: string) => {
    if (value) {
      chatStore.setSelectedProvider(parseInt(value, 10));
    }
  },
});

const formattedTokens = computed(() => {
  const total = chatStore.totalTokens;
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1)}k`;
  }
  return total.toString();
});

const formattedCost = computed(() => {
  return `$${chatStore.estimatedCost.toFixed(4)}`;
});

const formattedResponseTime = computed(() => {
  if (chatStore.lastResponseTime === null) {
    return '--';
  }
  if (chatStore.lastResponseTime >= 1000) {
    return `${(chatStore.lastResponseTime / 1000).toFixed(1)}s`;
  }
  return `${chatStore.lastResponseTime}ms`;
});

onMounted(() => {
  providersStore.fetchProviders();
});

// Auto-scroll to bottom when messages change
watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }
);

// Also scroll when streaming content updates
watch(
  () => chatStore.messages[chatStore.messages.length - 1]?.content,
  async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }
);

async function handleSend() {
  if (!message.value.trim() || !chatStore.canSendMessage) return;

  const content = message.value.trim();
  message.value = '';
  await chatStore.sendMessage(content);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function handlePromptClick(prompt: string) {
  message.value = prompt;
}

function handleClearHistory() {
  chatStore.clearHistory();
}
</script>

<template>
  <Card class="h-full flex flex-col p-0 gap-0">
    <CardContent class="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
      <!-- Header with provider selector and settings -->
      <div class="flex items-center gap-2 pb-2 border-b">
        <Select v-model="selectedProviderIdString">
          <SelectTrigger class="w-[200px]">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="provider in providersStore.enabledProviders"
              :key="provider.provider_id"
              :value="provider.provider_id.toString()"
            >
              {{ provider.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <LLMProviderManager />

        <div class="flex-1" />

        <Button
          v-if="chatStore.hasMessages"
          variant="ghost"
          size="sm"
          @click="handleClearHistory"
          class="text-muted-foreground"
        >
          <Trash2 class="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      <!-- Messages Area -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto space-y-4 min-h-0"
      >
        <template v-if="chatStore.hasMessages">
          <div
            v-for="(msg, index) in chatStore.messages"
            :key="index"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] rounded-lg px-4 py-2"
              :class="
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              "
            >
              <p class="whitespace-pre-wrap text-sm">{{ msg.content }}</p>
              <div
                v-if="msg.role === 'assistant' && chatStore.isStreaming && index === chatStore.messages.length - 1 && !msg.content"
                class="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 class="h-4 w-4 animate-spin" />
                <span class="text-xs">Thinking...</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <template v-else>
          <div class="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <p class="text-sm mb-4">Start a conversation with your AI assistant</p>

            <!-- Suggested Prompts -->
            <div class="space-y-2 w-full max-w-md">
              <p class="text-xs font-medium">Try asking:</p>
              <button
                v-for="(prompt, index) in suggestedPrompts"
                :key="index"
                class="w-full text-left text-sm px-3 py-2 rounded-md border border-border/50 hover:border-border hover:bg-accent/50 transition-colors"
                @click="handlePromptClick(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Error Display -->
      <div
        v-if="chatStore.error"
        class="px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-md"
      >
        {{ chatStore.error }}
        <button
          class="ml-2 underline"
          @click="chatStore.clearError()"
        >
          Dismiss
        </button>
      </div>

      <!-- Input Area -->
      <div class="flex gap-2 items-end">
        <div
          class="flex-1 relative"
          :style="dropShadowStyle"
        >
          <div class="absolute inset-0 rounded-lg bg-gradient-to-r from-[#2F82E0] via-[#927EF0] to-[#F479FF] opacity-20 blur-sm"></div>
          <div class="relative p-[1px] rounded-lg bg-gradient-to-r from-[#2F82E0] via-[#927EF0] to-[#F479FF]">
            <Textarea
              v-model="message"
              placeholder="Ask me anything about your IoT data..."
              class="resize-none min-h-[60px] max-h-[120px] bg-background"
              @keydown="handleKeydown"
              @focus="isFocused = true"
              @blur="isFocused = false"
              :disabled="chatStore.isStreaming"
            />
          </div>
        </div>
        <Button
          size="icon"
          class="h-[60px] w-[60px] shrink-0"
          :disabled="!message.trim() || !chatStore.canSendMessage"
          @click="handleSend"
        >
          <Loader2 v-if="chatStore.isStreaming" class="w-5 h-5 animate-spin" />
          <Send v-else class="w-5 h-5" />
        </Button>
      </div>

      <!-- Usage Info -->
      <div class="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div class="flex items-center gap-4">
          <span>Tokens: {{ formattedTokens }} / 128k</span>
          <span>|</span>
          <span>Cost: {{ formattedCost }}</span>
        </div>
        <div>
          <span>Response time: {{ formattedResponseTime }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
