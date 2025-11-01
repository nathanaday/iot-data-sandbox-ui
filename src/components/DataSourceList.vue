<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient, type DataSourceMetadata, ApiError } from '@/api';

// Reactive state
const dataSources = ref<DataSourceMetadata[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Load datasources
const loadDataSources = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await apiClient.listDataSources();
    dataSources.value = response.data_sources || [];
  } catch (err) {
    if (err instanceof ApiError) {
      error.value = `Failed to load datasources: ${err.error}`;
    } else if (err instanceof Error) {
      error.value = `Failed to load datasources: ${err.message}`;
    } else {
      error.value = 'An unknown error occurred';
    }
  } finally {
    loading.value = false;
  }
};

// Delete a datasource
const deleteDataSource = async (id: number) => {
  if (!confirm('Are you sure you want to delete this datasource?')) {
    return;
  }
  
  try {
    await apiClient.deleteDataSource(id);
    await loadDataSources(); // Reload the list
  } catch (err) {
    if (err instanceof ApiError) {
      error.value = `Failed to delete datasource: ${err.error}`;
    } else if (err instanceof Error) {
      error.value = `Failed to delete datasource: ${err.message}`;
    }
  }
};

// Format date string
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
};

// Load datasources on component mount
onMounted(() => {
  loadDataSources();
});
</script>

<template>
  <div class="container mx-auto p-6 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">IoT Data Sources</h1>
      <Button @click="loadDataSources" :disabled="loading">
        {{ loading ? 'Loading...' : 'Refresh' }}
      </Button>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="loading && dataSources.length === 0" class="text-center py-8">
      Loading datasources...
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && dataSources.length === 0" class="text-center py-8">
      <p class="text-gray-500">No datasources found. Upload a CSV file to get started.</p>
    </div>

    <!-- Datasources grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="ds in dataSources" :key="ds.data_source_id">
        <CardHeader>
          <CardTitle>{{ ds.name }}</CardTitle>
          <CardDescription>ID: {{ ds.data_source_id }} • {{ ds.type }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="text-sm">
            <span class="font-semibold">Rows:</span> {{ ds.row_count.toLocaleString() }}
          </div>
          <div class="text-sm">
            <span class="font-semibold">Time Range:</span><br>
            {{ formatDate(ds.start_time) }}<br>
            to {{ formatDate(ds.end_time) }}
          </div>
          <div class="text-sm text-gray-500">
            Created: {{ formatDate(ds.when_created) }}
          </div>
        </CardContent>
        <CardFooter class="flex gap-2">
          <Button variant="outline" size="sm" @click="() => console.log('View data:', ds.data_source_id)">
            View Data
          </Button>
          <Button variant="destructive" size="sm" @click="deleteDataSource(ds.data_source_id)">
            Delete
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
}
</style>

