/**
 * Vue composable for using the IoT Data Sandbox API
 * Provides reactive state management for API calls
 */

import { ref, type Ref } from 'vue';
import {
  apiClient,
  type DataSourceListResponse,
  type DataSourceMetadata,
  type DataQueryResponse,
  type UploadResponse,
  type DataQueryParams,
  type UploadParams,
  ApiError,
} from '@/api';

interface UseApiState<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
}

/**
 * Generic API call wrapper with reactive state
 */
function createApiCall<T, Args extends any[]>(
  apiFunction: (...args: Args) => Promise<T>
) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const execute = async (...args: Args): Promise<T | null> => {
    loading.value = true;
    error.value = null;
    try {
      const result = await apiFunction(...args);
      data.value = result;
      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        error.value = err.error;
      } else if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'An unknown error occurred';
      }
      return null;
    } finally {
      loading.value = false;
    }
  };

  return { data, loading, error, execute };
}

/**
 * Composable for listing datasources
 */
export function useDataSources() {
  return createApiCall<DataSourceListResponse, []>(() =>
    apiClient.listDataSources()
  );
}

/**
 * Composable for getting a single datasource
 */
export function useDataSource() {
  return createApiCall<DataSourceMetadata, [number]>((id) =>
    apiClient.getDataSource(id)
  );
}

/**
 * Composable for querying data
 */
export function useQueryData() {
  return createApiCall<DataQueryResponse, [number, DataQueryParams?]>(
    (id, params) => apiClient.queryData(id, params)
  );
}

/**
 * Composable for uploading datasources
 */
export function useUploadDataSource() {
  return createApiCall<UploadResponse, [UploadParams]>((params) =>
    apiClient.uploadDataSource(params)
  );
}

/**
 * Composable for deleting datasources
 */
export function useDeleteDataSource() {
  return createApiCall<void, [number]>((id) =>
    apiClient.deleteDataSource(id)
  );
}

