/**
 * Pinia store for managing DataSources
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '@/api';
import type {
  DataSourceMetadata,
  UploadParams,
  UploadResponse,
  DataQueryResponse,
  DataQueryParams,
  PreviewDataResponse,
} from '@/api';

export const useDataSourcesStore = defineStore('datasources', () => {
  // State
  const dataSources = ref<DataSourceMetadata[]>([]);
  const currentDataSource = ref<DataSourceMetadata | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const dataSourceCount = computed(() => dataSources.value.length);

  const getDataSourceById = computed(() => {
    return (id: number) =>
      dataSources.value.find(ds => ds.data_source_id === id);
  });

  const sortedByCreationDate = computed(() => {
    return [...dataSources.value].sort(
      (a, b) =>
        new Date(b.when_created).getTime() - new Date(a.when_created).getTime()
    );
  });

  const dataSourcesByType = computed(() => {
    return (type: string) => dataSources.value.filter(ds => ds.type === type);
  });

  // Actions

  /**
   * Fetch all datasources
   */
  async function fetchDataSources(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.listDataSources();
      dataSources.value = response.data_sources;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch datasources';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a single datasource by ID
   */
  async function fetchDataSource(id: number): Promise<DataSourceMetadata> {
    loading.value = true;
    error.value = null;
    try {
      const dataSource = await apiService.getDataSource(id);
      currentDataSource.value = dataSource;

      const index = dataSources.value.findIndex(
        ds => ds.data_source_id === id
      );
      if (index !== -1) {
        dataSources.value[index] = dataSource;
      } else {
        dataSources.value.push(dataSource);
      }

      return dataSource;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch datasource';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Upload a new datasource
   */
  async function uploadDataSource(
    params: UploadParams
  ): Promise<UploadResponse> {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.uploadDataSource(params);

      const newDataSource: DataSourceMetadata = {
        data_source_id: response.data_source_id,
        name: response.name,
        type: 'csv',
        start_time: response.start_time,
        end_time: response.end_time,
        row_count: response.row_count,
        time_label: response.time_label,
        value_label: response.value_label,
        when_created: response.when_created,
      };

      dataSources.value.push(newDataSource);
      currentDataSource.value = newDataSource;

      return response;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to upload datasource';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a datasource
   */
  async function deleteDataSource(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteDataSource(id);
      dataSources.value = dataSources.value.filter(
        ds => ds.data_source_id !== id
      );
      if (currentDataSource.value?.data_source_id === id) {
        currentDataSource.value = null;
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete datasource';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Query data from a datasource
   */
  async function queryDataSourceData(
    id: number,
    params?: DataQueryParams
  ): Promise<DataQueryResponse> {
    loading.value = true;
    error.value = null;
    try {
      const data = await apiService.queryDataSourceData(id, params);
      return data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to query datasource data';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Preview CSV data without creating a datasource
   */
  async function previewCSV(file: File): Promise<PreviewDataResponse> {
    loading.value = true;
    error.value = null;
    try {
      const preview = await apiService.previewCSV(file);
      return preview;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to preview CSV data';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set the current datasource
   */
  function setCurrentDataSource(dataSource: DataSourceMetadata | null): void {
    currentDataSource.value = dataSource;
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
    dataSources.value = [];
    currentDataSource.value = null;
    loading.value = false;
    error.value = null;
  }

  return {
    dataSources,
    currentDataSource,
    loading,
    error,
    dataSourceCount,
    getDataSourceById,
    sortedByCreationDate,
    dataSourcesByType,
    fetchDataSources,
    fetchDataSource,
    uploadDataSource,
    deleteDataSource,
    queryDataSourceData,
    previewCSV,
    setCurrentDataSource,
    clearError,
    $reset,
  };
});
