/**
 * Pinia store for managing Tools
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '@/api';
import type { ToolManifest, ToolExecuteRequest, ToolExecuteResponse, LayerResponse } from '@/api';

export const useToolsStore = defineStore('tools', () => {
  // State
  const tools = ref<ToolManifest[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Execution state
  const selectedTool = ref<ToolManifest | null>(null);
  const isExecuteModalOpen = ref(false);
  const isExecuting = ref(false);
  const executionError = ref<string | null>(null);
  const lastExecutionResult = ref<ToolExecuteResponse | null>(null);

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
   * Select a tool for execution (opens the modal)
   */
  function selectTool(tool: ToolManifest): void {
    selectedTool.value = tool;
    isExecuteModalOpen.value = true;
    executionError.value = null;
    lastExecutionResult.value = null;
  }

  /**
   * Clear the selected tool and close the modal
   */
  function clearSelection(): void {
    selectedTool.value = null;
    isExecuteModalOpen.value = false;
    executionError.value = null;
  }

  /**
   * Execute a tool on layer data
   */
  async function executeTool(request: ToolExecuteRequest): Promise<LayerResponse | null> {
    isExecuting.value = true;
    executionError.value = null;
    lastExecutionResult.value = null;

    try {
      const response = await apiService.executeTool(request);
      lastExecutionResult.value = response;

      if (response.success && response.layer) {
        return response.layer;
      }

      return null;
    } catch (err) {
      executionError.value = err instanceof Error ? err.message : 'Tool execution failed';
      throw err;
    } finally {
      isExecuting.value = false;
    }
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null;
    executionError.value = null;
  }

  /**
   * Reset store state
   */
  function $reset(): void {
    tools.value = [];
    loading.value = false;
    error.value = null;
    selectedTool.value = null;
    isExecuteModalOpen.value = false;
    isExecuting.value = false;
    executionError.value = null;
    lastExecutionResult.value = null;
  }

  return {
    // State
    tools,
    loading,
    error,
    selectedTool,
    isExecuteModalOpen,
    isExecuting,
    executionError,
    lastExecutionResult,
    // Computed
    toolCount,
    getToolByName,
    // Actions
    fetchTools,
    selectTool,
    clearSelection,
    executeTool,
    clearError,
    $reset,
  };
});
