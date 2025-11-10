/**
 * Pinia store for managing Tools
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '@/api';
import type { ToolManifest } from '@/api';

export const useToolsStore = defineStore('tools', () => {
  // State
  const tools = ref<ToolManifest[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const toolCount = computed(() => tools.value.length);

  const getToolByName = computed(() => {
    return (name: string) => tools.value.find(t => t.name === name);
  });

  // Actions

  /**
   * Fetch all tool manifests from the API
   */
  async function fetchTools(): Promise<ToolManifest[]> {
    loading.value = true;
    error.value = null;
    try {
      const toolList = await apiService.getToolManifests();
      tools.value = toolList;
      return toolList;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tools';
      throw err;
    } finally {
      loading.value = false;
    }
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
    tools.value = [];
    loading.value = false;
    error.value = null;
  }

  return {
    tools,
    loading,
    error,
    toolCount,
    getToolByName,
    fetchTools,
    clearError,
    $reset,
  };
});
