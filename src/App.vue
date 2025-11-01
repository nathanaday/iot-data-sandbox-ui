<script setup lang="ts">
import { ref } from 'vue';
import DataSourceList from '@/components/DataSourceList.vue';
import DataSourceUpload from '@/components/DataSourceUpload.vue';

const listKey = ref(0);

// Force refresh the list when a new datasource is uploaded
const handleUploaded = () => {
  listKey.value++;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-6 py-4">
        <h1 class="text-2xl font-bold text-gray-900">IoT Data Sandbox UI</h1>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-1">
          <DataSourceUpload @uploaded="handleUploaded" />
        </div>
      </div>
      
      <DataSourceList :key="listKey" />
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 1400px;
}
</style>
