<script setup lang="ts">
import { ref } from 'vue';
import DataSourceList from '@/components/DataSourceList.vue';
import DataSourceUpload from '@/components/DataSourceUpload.vue';
import NavHeader from '@/components/NavHeader.vue';
const listKey = ref(0);

// Force refresh the list when a new datasource is uploaded
const handleUploaded = () => {
  listKey.value++;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <NavHeader />
    </header>

    <main class="container mx-auto px-6 py-8">

      <!-- <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-1">
          <DataSourceUpload @uploaded="handleUploaded" />
        </div>
      </div>
      
      <DataSourceList :key="listKey" /> -->
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 1400px;
}
</style>
