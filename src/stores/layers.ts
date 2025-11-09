/**
 * Pinia store for managing Layers
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '@/api';
import type {
  LayerResponse,
  CreateLayerRequest,
  UpdateColorRequest,
  UpdateVisibilityRequest,
  DuplicateLayerRequest,
  DataQueryResponse,
  DataQueryParams,
  UploadParams,
  DataSourceMetadata,
} from '@/api';

export const useLayersStore = defineStore('layers', () => {
  // State
  const layers = ref<LayerResponse[]>([]);
  const currentLayer = ref<LayerResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Cache for timeseries data - keyed by layer ID
  const layerDataCache = ref<Map<number, DataQueryResponse>>(new Map());

  // Computed
  const layerCount = computed(() => layers.value.length);

  const getLayerById = computed(() => {
    return (id: number) => layers.value.find(l => l.data_layer_id === id);
  });

  const getLayersByProjectId = computed(() => {
    return (projectId: number) =>
      layers.value.filter(l => l.project_id === projectId);
  });

  const visibleLayers = computed(() => {
    return layers.value.filter(l => l.is_visible);
  });

  const sortedByZIndex = computed(() => {
    return [...layers.value].sort((a, b) => a.z_index - b.z_index);
  });

  // Actions

  /**
   * Fetch a single layer by ID
   */
  async function fetchLayer(id: number): Promise<LayerResponse> {
    loading.value = true;
    error.value = null;
    try {
      const layer = await apiService.getLayer(id);
      currentLayer.value = layer;

      const index = layers.value.findIndex(l => l.data_layer_id === id);
      if (index !== -1) {
        layers.value[index] = layer;
      } else {
        layers.value.push(layer);
      }

      return layer;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch layer';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new layer in a project
   */
  async function createLayer(
    projectId: number,
    data: CreateLayerRequest
  ): Promise<LayerResponse> {
    loading.value = true;
    error.value = null;
    try {
      const layer = await apiService.createLayer(projectId, data);
      layers.value.push(layer);
      currentLayer.value = layer;
      return layer;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create layer';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a layer
   */
  async function deleteLayer(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteLayer(id);
      layers.value = layers.value.filter(l => l.data_layer_id !== id);
      if (currentLayer.value?.data_layer_id === id) {
        currentLayer.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete layer';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update layer color
   */
  async function updateLayerColor(
    id: number,
    color: string
  ): Promise<LayerResponse> {
    loading.value = true;
    error.value = null;
    try {
      const data: UpdateColorRequest = { color };
      const layer = await apiService.updateLayerColor(id, data);

      const index = layers.value.findIndex(l => l.data_layer_id === id);
      if (index !== -1) {
        layers.value[index] = layer;
      }

      if (currentLayer.value?.data_layer_id === id) {
        currentLayer.value = layer;
      }

      return layer;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update layer color';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update layer visibility
   */
  async function updateLayerVisibility(
    id: number,
    isVisible: boolean
  ): Promise<LayerResponse> {
    loading.value = true;
    error.value = null;
    try {
      const data: UpdateVisibilityRequest = { is_visible: isVisible };
      const layer = await apiService.updateLayerVisibility(id, data);

      const index = layers.value.findIndex(l => l.data_layer_id === id);
      if (index !== -1) {
        layers.value[index] = layer;
      }

      if (currentLayer.value?.data_layer_id === id) {
        currentLayer.value = layer;
      }

      return layer;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update layer visibility';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Duplicate a layer
   */
  async function duplicateLayer(
    id: number,
    newName: string
  ): Promise<LayerResponse> {
    loading.value = true;
    error.value = null;
    try {
      const data: DuplicateLayerRequest = { new_name: newName };
      const layer = await apiService.duplicateLayer(id, data);
      layers.value.push(layer);
      return layer;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to duplicate layer';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get layer time series data
   */
  async function fetchLayerData(
    id: number,
    params?: DataQueryParams
  ): Promise<DataQueryResponse> {
    loading.value = true;
    error.value = null;
    try {
      const data = await apiService.getLayerData(id, params);
      // Cache the data
      layerDataCache.value.set(id, data);
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch layer data';
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  /**
   * Get cached layer data (without fetching)
   */
  function getCachedLayerData(id: number): DataQueryResponse | undefined {
    return layerDataCache.value.get(id);
  }
  
  /**
   * Check if layer data is cached
   */
  function hasLayerDataCached(id: number): boolean {
    return layerDataCache.value.has(id);
  }

  /**
   * Get layer data source metadata
   */
  async function fetchLayerDataMetadata(
    id: number
  ): Promise<DataSourceMetadata> {
    loading.value = true;
    error.value = null;
    try {
      const metadata = await apiService.getLayerDataMetadata(id);
      return metadata;
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch layer data metadata';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Load CSV data into layer
   */
  async function loadLayerCSV(
    id: number,
    params: UploadParams
  ): Promise<LayerResponse> {
    loading.value = true;
    error.value = null;
    try {
      const layer = await apiService.loadLayerCSV(id, params);

      const index = layers.value.findIndex(l => l.data_layer_id === id);
      if (index !== -1) {
        layers.value[index] = layer;
      }

      if (currentLayer.value?.data_layer_id === id) {
        currentLayer.value = layer;
      }

      return layer;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load CSV into layer';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set layers for a project (used after fetching project layers)
   */
  function setLayers(newLayers: LayerResponse[]): void {
    layers.value = newLayers;
  }

  /**
   * Add layers to the store (merge, don't replace)
   */
  function addLayers(newLayers: LayerResponse[]): void {
    newLayers.forEach(newLayer => {
      const index = layers.value.findIndex(
        l => l.data_layer_id === newLayer.data_layer_id
      );
      if (index !== -1) {
        layers.value[index] = newLayer;
      } else {
        layers.value.push(newLayer);
      }
    });
  }

  /**
   * Set the current layer
   */
  function setCurrentLayer(layer: LayerResponse | null): void {
    currentLayer.value = layer;
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
    layers.value = [];
    currentLayer.value = null;
    loading.value = false;
    error.value = null;
    layerDataCache.value.clear();
  }

  return {
    layers,
    currentLayer,
    loading,
    error,
    layerDataCache,
    layerCount,
    getLayerById,
    getLayersByProjectId,
    visibleLayers,
    sortedByZIndex,
    fetchLayer,
    createLayer,
    deleteLayer,
    updateLayerColor,
    updateLayerVisibility,
    duplicateLayer,
    fetchLayerData,
    getCachedLayerData,
    hasLayerDataCached,
    fetchLayerDataMetadata,
    loadLayerCSV,
    setLayers,
    addLayers,
    setCurrentLayer,
    clearError,
    $reset,
  };
});
