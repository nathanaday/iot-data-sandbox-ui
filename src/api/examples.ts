/**
 * Usage Examples for IoT Data Sandbox API
 * 
 * This file demonstrates various ways to use the API client and composables
 * in your Vue components.
 */

/* ============================================================================
 * EXAMPLE 1: Using the API Client Directly
 * ========================================================================== */

/*
import { apiClient, ApiError } from '@/api';

// List all datasources
try {
  const response = await apiClient.listDataSources();
  console.log('Data sources:', response.data_sources);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.error);
  }
}

// Get a specific datasource
try {
  const dataSource = await apiClient.getDataSource(1);
  console.log('Data source:', dataSource);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Not found:', error.error);
  }
}

// Query data with time range
try {
  const data = await apiClient.queryData(1, {
    start_time: '2024-01-01T00:00:00Z',
    end_time: '2024-12-31T23:59:59Z',
  });
  console.log('Data points:', data.data);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Query failed:', error.error);
  }
}

// Upload a CSV file
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput.files && fileInput.files[0]) {
  try {
    const result = await apiClient.uploadDataSource({
      file: fileInput.files[0],
      name: 'My Custom Name', // optional
    });
    console.log('Uploaded:', result);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Upload failed:', error.error);
    }
  }
}

// Delete a datasource
try {
  await apiClient.deleteDataSource(1);
  console.log('Deleted successfully');
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Delete failed:', error.error);
  }
}
*/

/* ============================================================================
 * EXAMPLE 2: Using Composables in Vue Components
 * ========================================================================== */

/*
import { onMounted } from 'vue';
import { useDataSources, useQueryData, useUploadDataSource } from '@/composables/useApi';

// In your component's setup function:

// List datasources with reactive state
const { data: dataSources, loading, error, execute: loadDataSources } = useDataSources();

onMounted(async () => {
  await loadDataSources();
  // data is automatically populated in dataSources.value
  if (dataSources.value) {
    console.log('Data sources:', dataSources.value.data_sources);
  }
  if (error.value) {
    console.error('Error:', error.value);
  }
});

// Query data with reactive state
const { data: queryResult, loading: queryLoading, error: queryError, execute: queryData } = useQueryData();

const fetchData = async (id: number) => {
  await queryData(id, {
    start_time: '2024-01-01T00:00:00Z',
    end_time: '2024-12-31T23:59:59Z',
  });
  
  if (queryResult.value) {
    console.log('Data points:', queryResult.value.data);
    console.log('Row count:', queryResult.value.row_count);
  }
};

// Upload with reactive state
const { data: uploadResult, loading: uploading, error: uploadError, execute: upload } = useUploadDataSource();

const handleUpload = async (file: File) => {
  await upload({ file, name: 'My Data' });
  
  if (uploadResult.value) {
    console.log('Uploaded successfully:', uploadResult.value.data_source_id);
  }
  if (uploadError.value) {
    console.error('Upload failed:', uploadError.value);
  }
};
*/

/* ============================================================================
 * EXAMPLE 3: Creating a Custom API Client with Different Base URL
 * ========================================================================== */

/*
import { createApiClient } from '@/api';

// Create a client for production
const productionClient = createApiClient({
  baseUrl: 'https://api.example.com',
  timeout: 10000, // 10 seconds
});

// Use it the same way as the default client
const data = await productionClient.listDataSources();

// Or change the base URL of the default client
import { apiClient } from '@/api';
apiClient.setBaseUrl('https://api.example.com');
*/

/* ============================================================================
 * EXAMPLE 4: Complete Vue Component Example
 * ========================================================================== */

/*
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDataSources, useDeleteDataSource } from '@/composables/useApi';
import type { DataSourceMetadata } from '@/api';

const { data: response, loading, error, execute: loadDataSources } = useDataSources();
const { execute: deleteDataSource } = useDeleteDataSource();

const dataSources = ref<DataSourceMetadata[]>([]);

onMounted(async () => {
  await loadDataSources();
  if (response.value) {
    dataSources.value = response.value.data_sources;
  }
});

const handleDelete = async (id: number) => {
  const confirmed = confirm('Are you sure?');
  if (!confirmed) return;
  
  await deleteDataSource(id);
  // Refresh the list
  await loadDataSources();
  if (response.value) {
    dataSources.value = response.value.data_sources;
  }
};
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-if="error">Error: {{ error }}</div>
    
    <div v-for="ds in dataSources" :key="ds.data_source_id">
      <h3>{{ ds.name }}</h3>
      <p>Rows: {{ ds.row_count }}</p>
      <button @click="handleDelete(ds.data_source_id)">Delete</button>
    </div>
  </div>
</template>
*/

/* ============================================================================
 * EXAMPLE 5: TypeScript Type Usage
 * ========================================================================== */

/*
import type {
  DataPoint,
  DataQueryResponse,
  DataSourceMetadata,
  DataSourceListResponse,
  UploadResponse,
  ErrorResponse,
  DataQueryParams,
  UploadParams,
} from '@/api';

// Use types in your functions
function processDataPoints(points: DataPoint[]): number {
  return points.reduce((sum, point) => sum + point.value, 0);
}

// Type your component props
interface Props {
  dataSource: DataSourceMetadata;
}

// Type your API responses
const fetchData = async (): Promise<DataQueryResponse> => {
  return await apiClient.queryData(1);
};

// Use query params type
const params: DataQueryParams = {
  start_time: '2024-01-01T00:00:00Z',
  end_time: '2024-12-31T23:59:59Z',
};
*/

export {};

