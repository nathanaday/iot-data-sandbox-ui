<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLLMProvidersStore } from '@/stores/llmProviders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Plus, Trash2 } from 'lucide-vue-next';
import type { LLMProviderType } from '@/api';

const store = useLLMProvidersStore();

const isOpen = ref(false);
const isAddingProvider = ref(false);

// Form state for adding new provider
const newProvider = ref({
  provider_type: 'openai' as LLMProviderType,
  name: '',
  api_key: '',
  base_url: '',
  default_model: '',
});

const providerTypes: { value: LLMProviderType; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google_ai', label: 'Google AI (Gemini)' },
  { value: 'azure_openai', label: 'Azure OpenAI' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'huggingface', label: 'Hugging Face' },
];

onMounted(() => {
  store.fetchProviders();
});

function resetForm() {
  newProvider.value = {
    provider_type: 'openai',
    name: '',
    api_key: '',
    base_url: '',
    default_model: '',
  };
  isAddingProvider.value = false;
}

async function handleAddProvider() {
  try {
    await store.createProvider({
      provider_type: newProvider.value.provider_type,
      name: newProvider.value.name,
      api_key: newProvider.value.api_key,
      base_url: newProvider.value.base_url || undefined,
      default_model: newProvider.value.default_model || undefined,
    });
    resetForm();
  } catch (err) {
    console.error('Failed to add provider:', err);
  }
}

async function handleDeleteProvider(id: number) {
  if (confirm('Are you sure you want to delete this provider?')) {
    try {
      await store.deleteProvider(id);
    } catch (err) {
      console.error('Failed to delete provider:', err);
    }
  }
}

async function handleToggleEnabled(id: number) {
  try {
    await store.toggleEnabled(id);
  } catch (err) {
    console.error('Failed to toggle provider:', err);
  }
}

function getProviderTypeLabel(type: string): string {
  const found = providerTypes.find(p => p.value === type);
  return found?.label || type;
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="ghost" size="icon" class="h-8 w-8">
        <Settings class="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>LLM Provider Settings</DialogTitle>
        <DialogDescription>
          Configure your LLM providers to enable AI-powered chat.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Existing Providers -->
        <div v-if="store.providers.length > 0" class="space-y-2">
          <div
            v-for="provider in store.providers"
            :key="provider.provider_id"
            class="flex items-center justify-between p-3 rounded-lg border"
          >
            <div class="flex-1">
              <div class="font-medium">{{ provider.name }}</div>
              <div class="text-sm text-muted-foreground">
                {{ getProviderTypeLabel(provider.provider_type) }}
                <span v-if="provider.default_model"> - {{ provider.default_model }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Switch
                :checked="provider.is_enabled"
                @update:checked="handleToggleEnabled(provider.provider_id)"
              />
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-destructive"
                @click="handleDeleteProvider(provider.provider_id)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-4 text-muted-foreground">
          No providers configured. Add one to get started.
        </div>

        <!-- Add Provider Form -->
        <div v-if="isAddingProvider" class="space-y-4 pt-4 border-t">
          <div class="space-y-2">
            <Label>Provider Type</Label>
            <Select v-model="newProvider.provider_type">
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="type in providerTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Name</Label>
            <Input
              v-model="newProvider.name"
              placeholder="e.g., My OpenAI Key"
            />
          </div>

          <div class="space-y-2">
            <Label>API Key</Label>
            <Input
              v-model="newProvider.api_key"
              type="password"
              placeholder="sk-..."
            />
          </div>

          <div class="space-y-2">
            <Label>Default Model (optional)</Label>
            <Input
              v-model="newProvider.default_model"
              placeholder="e.g., gpt-4o, claude-3-opus"
            />
          </div>

          <div class="space-y-2">
            <Label>Base URL (optional)</Label>
            <Input
              v-model="newProvider.base_url"
              placeholder="For Azure or custom endpoints"
            />
          </div>

          <div class="flex gap-2">
            <Button @click="handleAddProvider" :disabled="!newProvider.name || !newProvider.api_key">
              Add Provider
            </Button>
            <Button variant="outline" @click="resetForm">
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          v-if="!isAddingProvider"
          @click="isAddingProvider = true"
          class="w-full"
        >
          <Plus class="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
