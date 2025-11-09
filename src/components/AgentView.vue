<script setup lang="ts">
import { ref, computed } from 'vue';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles } from 'lucide-vue-next';

const message = ref('');
const isFocused = ref(false);

const suggestedPrompts = [
  'Show me anomalies in temperature readings'
];

const dropShadowStyle = computed(() => {
  if (isFocused.value) {
    return 'filter: drop-shadow(0 4px 16px rgba(47, 130, 224, 0.25)) drop-shadow(0 8px 32px rgba(146, 126, 240, 0.2)) drop-shadow(0 12px 48px rgba(244, 121, 255, 0.15)); transition: filter 0.3s ease;';
  } else {
    return 'filter: drop-shadow(0 2px 8px rgba(47, 130, 224, 0.15)) drop-shadow(0 4px 12px rgba(146, 126, 240, 0.1)); transition: filter 0.3s ease;';
  }
});
</script>

<template>
  <Card class="h-full flex flex-col p-0 gap-0">

    <CardContent class="flex-1 flex flex-col p-6 gap-6 overflow-hidden">

    
      <!-- Input Area -->
      <div class="flex gap-2 items-end">
        <div 
          class="flex-1 relative"
          :style="dropShadowStyle"
        >
          <!-- Gradient container -->
          <div class="absolute inset-0 rounded-lg bg-gradient-to-r from-[#2F82E0] via-[#927EF0] to-[#F479FF] opacity-20 blur-sm"></div>
          <div class="relative p-[1px] rounded-lg bg-gradient-to-r from-[#2F82E0] via-[#927EF0] to-[#F479FF]">
            <Textarea
              v-model="message"
              placeholder="Ask me anything about your IoT data..."
              class="resize-none min-h-[60px] max-h-[120px] bg-background"
              @keydown.enter.prevent="() => {}"
              @focus="isFocused = true"
              @blur="isFocused = false"
            />
          </div>
        </div>
        <Button
          size="icon"
          class="h-[60px] w-[60px] shrink-0"
          :disabled="!message.trim()"
        >
          <Send class="w-5 h-5" />
        </Button>
      </div>

      <!-- Suggested Prompts -->
      <div class="space-y-3">
        <p class="text-xs text-muted-foreground font-medium">Suggested prompts:</p>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="(prompt, index) in suggestedPrompts"
            :key="index"
            class="text-left text-sm px-3 py-2 rounded-md border border-border/50 hover:border-border hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
            @click="message = prompt"
          >
            {{ prompt }}
          </button>
        </div>
      </div>

      <!-- Usage Info -->
      <div class="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div class="flex items-center gap-4">
          <span>Tokens: 0 / 128k</span>
          <span>•</span>
          <span>Cost: $0.00</span>
        </div>
        <div>
          <span>Response time: --ms</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
