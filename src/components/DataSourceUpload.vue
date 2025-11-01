<script setup lang="ts">
import { ref } from 'vue';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUploadDataSource } from '@/composables/useApi';

const emit = defineEmits<{
  uploaded: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const dataSourceName = ref('');

const { data: uploadResult, loading, error, execute: uploadDataSource } = useUploadDataSource();

// Handle file selection
const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]!;
    // Use filename as default name if not provided
    if (!dataSourceName.value) {
      dataSourceName.value = target.files[0]!.name.replace(/\.[^/.]+$/, '');
    }
  }
};

// Handle upload
const handleUpload = async () => {
  if (!selectedFile.value) {
    return;
  }

  const file = selectedFile.value; // Store in const for type narrowing

  const result = await uploadDataSource({
    file,
    name: dataSourceName.value || undefined,
  });

  if (result) {
    // Clear form
    selectedFile.value = null;
    dataSourceName.value = '';
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    // Emit event to parent
    emit('uploaded');
  }
};

// Trigger file input
const selectFile = () => {
  fileInput.value?.click();
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Upload CSV Data Source</CardTitle>
      <CardDescription>
        Upload a CSV file with 'timestamp' and 'value' columns
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- File input -->
      <div>
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          @change="onFileChange"
          class="hidden"
        />
        <Button @click="selectFile" variant="outline" class="w-full">
          {{ selectedFile ? selectedFile.name : 'Choose CSV File' }}
        </Button>
      </div>

      <!-- Name input -->
      <div>
        <label class="block text-sm font-medium mb-2">
          Data Source Name (optional)
        </label>
        <input
          v-model="dataSourceName"
          type="text"
          placeholder="Enter a name or leave blank to use filename"
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Upload button -->
      <Button
        @click="handleUpload"
        :disabled="!selectedFile || loading"
        class="w-full"
      >
        {{ loading ? 'Uploading...' : 'Upload' }}
      </Button>

      <!-- Error message -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
        {{ error }}
      </div>

      <!-- Success message -->
      <div v-if="uploadResult" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
        <p class="font-semibold">Upload successful!</p>
        <p>ID: {{ uploadResult.data_source_id }}</p>
        <p>Rows: {{ uploadResult.row_count.toLocaleString() }}</p>
      </div>
    </CardContent>
  </Card>
</template>

