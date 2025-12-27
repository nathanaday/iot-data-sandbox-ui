/**
 * Pinia store for managing LLM Providers
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '@/api';
import type {
  LLMProviderResponse,
  CreateLLMProviderRequest,
  UpdateLLMProviderRequest,
} from '@/api';

export const useLLMProvidersStore = defineStore('llmProviders', () => {
  // State
  const providers = ref<LLMProviderResponse[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const enabledProviders = computed(() =>
    providers.value.filter(p => p.is_enabled)
  );

  const providerCount = computed(() => providers.value.length);

  const getProviderById = computed(() => {
    return (id: number) => providers.value.find(p => p.provider_id === id);
  });

  const getProvidersByType = computed(() => {
    return (type: string) => providers.value.filter(p => p.provider_type === type);
  });

  // Actions

  /**
   * Fetch all LLM providers from the API
   */
  async function fetchProviders(): Promise<LLMProviderResponse[]> {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.listLLMProviders();
      providers.value = response.providers;
      return response.providers;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch providers';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new LLM provider
   */
  async function createProvider(data: CreateLLMProviderRequest): Promise<LLMProviderResponse> {
    loading.value = true;
    error.value = null;
    try {
      const provider = await apiService.createLLMProvider(data);
      providers.value.push(provider);
      return provider;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create provider';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing LLM provider
   */
  async function updateProvider(id: number, data: UpdateLLMProviderRequest): Promise<LLMProviderResponse> {
    loading.value = true;
    error.value = null;
    try {
      const provider = await apiService.updateLLMProvider(id, data);
      const index = providers.value.findIndex(p => p.provider_id === id);
      if (index !== -1) {
        providers.value[index] = provider;
      }
      return provider;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update provider';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete an LLM provider
   */
  async function deleteProvider(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteLLMProvider(id);
      providers.value = providers.value.filter(p => p.provider_id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete provider';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Toggle provider enabled status
   */
  async function toggleEnabled(id: number): Promise<LLMProviderResponse> {
    const provider = providers.value.find(p => p.provider_id === id);
    if (!provider) {
      throw new Error('Provider not found');
    }
    return updateProvider(id, { is_enabled: !provider.is_enabled });
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
    providers.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    providers,
    loading,
    error,
    // Computed
    enabledProviders,
    providerCount,
    getProviderById,
    getProvidersByType,
    // Actions
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    toggleEnabled,
    clearError,
    $reset,
  };
});
