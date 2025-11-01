<script setup lang="ts">
import { ref, computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQueryData } from '@/composables/useApi';
import type { DataPoint } from '@/api';

const props = defineProps<{
  dataSourceId: number;
  dataSourceName: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

// Query parameters
const startTime = ref('');
const endTime = ref('');

const { data: queryResult, loading, error, execute: queryData } = useQueryData();

// Computed data points
const dataPoints = computed<DataPoint[]>(() => {
  return queryResult.value?.data || [];
});

// Load data
const loadData = async () => {
  await queryData(props.dataSourceId, {
    start_time: startTime.value || undefined,
    end_time: endTime.value || undefined,
  });
};

// Format timestamp for display
const formatTimestamp = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
};

// Format number with proper precision
const formatValue = (value: number) => {
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
};

// Calculate statistics
const statistics = computed(() => {
  const points = dataPoints.value;
  if (points.length === 0) return null;

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;

  return { min, max, avg, count: values.length };
});

// Load all data on mount
loadData();
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex justify-between items-start">
        <div>
          <CardTitle>{{ dataSourceName }}</CardTitle>
          <CardDescription>Data Source ID: {{ dataSourceId }}</CardDescription>
        </div>
        <Button variant="ghost" size="sm" @click="emit('close')">
          ✕
        </Button>
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Time range filters -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">
            Start Time (RFC3339)
          </label>
          <input
            v-model="startTime"
            type="text"
            placeholder="2024-01-01T00:00:00Z"
            class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">
            End Time (RFC3339)
          </label>
          <input
            v-model="endTime"
            type="text"
            placeholder="2024-12-31T23:59:59Z"
            class="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Button @click="loadData" :disabled="loading" class="w-full">
        {{ loading ? 'Loading...' : 'Query Data' }}
      </Button>

      <!-- Error message -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
        {{ error }}
      </div>

      <!-- Statistics -->
      <div v-if="statistics" class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div class="text-xs text-gray-600">Count</div>
          <div class="text-lg font-semibold">{{ statistics.count.toLocaleString() }}</div>
        </div>
        <div>
          <div class="text-xs text-gray-600">Min</div>
          <div class="text-lg font-semibold">{{ formatValue(statistics.min) }}</div>
        </div>
        <div>
          <div class="text-xs text-gray-600">Max</div>
          <div class="text-lg font-semibold">{{ formatValue(statistics.max) }}</div>
        </div>
        <div>
          <div class="text-xs text-gray-600">Average</div>
          <div class="text-lg font-semibold">{{ formatValue(statistics.avg) }}</div>
        </div>
      </div>

      <!-- Query metadata -->
      <div v-if="queryResult" class="text-sm text-gray-600 space-y-1">
        <div>
          <span class="font-semibold">Query Range:</span>
          {{ formatTimestamp(queryResult.start_time) }} to {{ formatTimestamp(queryResult.end_time) }}
        </div>
        <div>
          <span class="font-semibold">Rows Returned:</span>
          {{ queryResult.row_count.toLocaleString() }}
        </div>
      </div>

      <!-- Data table -->
      <div v-if="dataPoints.length > 0" class="space-y-2">
        <h3 class="font-semibold">Data Points (showing first 100)</h3>
        <div class="max-h-96 overflow-y-auto border rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Timestamp
                </th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">
                  Value
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(point, index) in dataPoints.slice(0, 100)" :key="index" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-sm text-gray-900">
                  {{ formatTimestamp(point.timestamp) }}
                </td>
                <td class="px-4 py-2 text-sm text-gray-900 text-right font-mono">
                  {{ formatValue(point.value) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="dataPoints.length > 100" class="text-sm text-gray-500 text-center">
          Showing 100 of {{ dataPoints.length.toLocaleString() }} data points
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && !error" class="text-center py-8 text-gray-500">
        No data points found for the selected time range.
      </div>
    </CardContent>
  </Card>
</template>

