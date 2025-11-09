<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiService } from '@/api'
import type { PreviewDataResponse } from '@/api/types'
import { useProjectsStore } from '@/stores/projects'

const open = defineModel<boolean>('open', { default: false })
const projectsStore = useProjectsStore()
const selectedFile = ref<File | null>(null)
const projectType = ref('time-series')
const projectName = ref('')
const isDragging = ref(false)
const previewData = ref<PreviewDataResponse | null>(null)
const isLoadingPreview = ref(false)
const previewError = ref<string | null>(null)
const isCreating = ref(false)
const createError = ref<string | null>(null)

// Generate random project name
const generateRandomName = () => {
  const adjectives = ['Swift', 'Quantum', 'Stellar', 'Cosmic', 'Dynamic', 'Nimble', 'Azure', 'Golden', 'Crystal', 'Mystic']
  const nouns = ['Phoenix', 'Dragon', 'Falcon', 'Thunder', 'Nebula', 'Horizon', 'Cascade', 'Vertex', 'Prism', 'Echo']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 1000)
  return `${adj} ${noun} ${num}`
}

const projectNamePlaceholder = computed(() => generateRandomName())

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    await loadPreview(target.files[0])
  }
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files[0]) {
    const file = files[0]
    if (file.name.endsWith('.csv')) {
      selectedFile.value = file
      await loadPreview(file)
    } else {
      alert('Please select a CSV file')
    }
  }
}

const loadPreview = async (file: File) => {
  isLoadingPreview.value = true
  previewError.value = null
  previewData.value = null
  
  try {
    const preview = await apiService.previewCSV(file)
    previewData.value = preview
  } catch (error) {
    previewError.value = "We can't upload that .csv file. Please check that it is in a valid format."
    console.error('Preview error:', error)
    // Clear the selected file since it's invalid
    selectedFile.value = null
  } finally {
    isLoadingPreview.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleCreate = async () => {
  if (!selectedFile.value) {
    alert('Please select a CSV file')
    return
  }
  
  const finalProjectName = projectName.value.trim() || projectNamePlaceholder.value
  const file = selectedFile.value
  
  isCreating.value = true
  createError.value = null
  
  try {
    // Step 1: Create the project
    console.log('Creating project:', finalProjectName)
    const project = await apiService.createProject({ name: finalProjectName })
    console.log('Project created:', project)
    
    // Step 2: Create a layer in the project
    const layerName = file.name.replace('.csv', '') || 'Data Layer'
    console.log('Creating layer:', layerName)
    const layer = await apiService.createLayer(project.project_id, { name: layerName })
    console.log('Layer created:', layer)
    
    // Step 3: Load the CSV data into the layer
    console.log('Loading CSV data into layer')
    await apiService.loadLayerCSV(layer.data_layer_id, { file })
    console.log('CSV data loaded successfully')
    
    // Step 4: Load the project with all its data
    await projectsStore.loadProject(project.project_id)
    console.log('Project loaded successfully')
    
    // Success! Reset and close
    selectedFile.value = null
    projectType.value = 'time-series'
    projectName.value = ''
    previewData.value = null
    previewError.value = null
    createError.value = null
    open.value = false
    
  } catch (error) {
    console.error('Error creating project:', error)
    createError.value = 'Failed to create project. Please try again.'
  } finally {
    isCreating.value = false
  }
}

const handleCancel = () => {
  selectedFile.value = null
  projectType.value = 'time-series'
  projectName.value = ''
  previewData.value = null
  previewError.value = null
  createError.value = null
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <slot name="trigger">
        <Button variant="default">New Project</Button>
      </slot>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Create a new project</DialogTitle>
        <DialogDescription>
          Upload a CSV file to create a new time series data project
        </DialogDescription>
      </DialogHeader>
      
      <Card class="border-0 shadow-none">
        <CardContent class="space-y-6 p-0 pt-6">
          <!-- Project Name -->
          <div class="space-y-2">
            <Label for="project-name">Project Name</Label>
            <Input
              id="project-name"
              v-model="projectName"
              :placeholder="projectNamePlaceholder"
              class="w-full"
            />
            <p class="text-xs text-muted-foreground">
              Leave blank for auto-generated name
            </p>
          </div>

          <!-- Project Type Selection -->
          <div class="space-y-2">
            <Label for="project-type">Project Type</Label>
            <Select v-model="projectType">
              <SelectTrigger id="project-type">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="time-series">Time Series Data</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <!-- File Upload Zone -->
          <div class="space-y-2">
            <Label>Data File</Label>
            <div
              class="relative border-2 border-dashed rounded-lg p-8 text-center transition-colors"
              :class="{
                'border-primary bg-primary/5': isDragging,
                'border-muted-foreground/25 hover:border-muted-foreground/50': !isDragging
              }"
              @drop.prevent="handleDrop"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
            >
              <input
                type="file"
                accept=".csv"
                class="hidden"
                id="file-upload"
                @change="handleFileSelect"
              />
              
              <div v-if="!selectedFile" class="space-y-3">
                <div 
                  class="mx-auto w-12 h-12 rounded-full flex items-center justify-center"
                  :class="previewError ? 'bg-destructive/10' : 'bg-muted'"
                >
                  <svg
                    v-if="!previewError"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-muted-foreground"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-destructive"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                </div>
                
                <div v-if="previewError" class="space-y-2">
                  <p class="text-sm text-destructive font-medium">
                    {{ previewError }}
                  </p>
                  <label
                    for="file-upload"
                    class="inline-flex items-center justify-center text-sm font-medium text-primary hover:underline cursor-pointer"
                  >
                    Try another file
                  </label>
                </div>
                
                <div v-else class="space-y-1">
                  <p class="text-sm text-muted-foreground">
                    Drag and drop your CSV file here, or
                  </p>
                  <label
                    for="file-upload"
                    class="inline-flex items-center justify-center text-sm font-medium text-primary hover:underline cursor-pointer"
                  >
                    browse files
                  </label>
                </div>
                
                <p v-if="!previewError" class="text-xs text-muted-foreground">CSV files only</p>
              </div>
              
              <div v-else class="space-y-3">
                <div class="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-primary"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" x2="8" y1="13" y2="13" />
                    <line x1="16" x2="8" y1="17" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div class="space-y-1">
                  <p class="text-sm font-medium">{{ selectedFile.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ (selectedFile.size / 1024).toFixed(2) }} KB
                  </p>
                </div>

                <!-- Preview Data -->
                <div v-if="isLoadingPreview" class="text-xs text-muted-foreground text-center py-2">
                  Loading preview...
                </div>
                <div v-else-if="previewData" class="w-full pt-3 border-t">
                  <table class="w-full text-xs">
                    <tbody>
                      <tr class="border-b">
                        <td class="py-1.5 pr-4 text-muted-foreground font-medium">Rows:</td>
                        <td class="py-1.5 text-right">{{ previewData.row_count.toLocaleString() }}</td>
                      </tr>
                      <tr class="border-b">
                        <td class="py-1.5 pr-4 text-muted-foreground font-medium">Time Range:</td>
                        <td class="py-1.5 text-right">
                          {{ formatDate(previewData.start_time) }} - {{ formatDate(previewData.end_time) }}
                        </td>
                      </tr>
                      <tr class="border-b">
                        <td class="py-1.5 pr-4 text-muted-foreground font-medium">Time Column:</td>
                        <td class="py-1.5 text-right font-mono">{{ previewData.time_label }}</td>
                      </tr>
                      <tr>
                        <td class="py-1.5 pr-4 text-muted-foreground font-medium">Value Column:</td>
                        <td class="py-1.5 text-right font-mono">{{ previewData.value_label }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="selectedFile = null; previewData = null; previewError = null"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>

          <!-- Create Error Message -->
          <div v-if="createError" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p class="text-sm text-destructive font-medium">
              {{ createError }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-3 pt-4">
            <Button variant="outline" @click="handleCancel" :disabled="isCreating">
              Cancel
            </Button>
            <Button
              @click="handleCreate"
              :disabled="!selectedFile || isCreating"
            >
              <svg
                v-if="isCreating"
                class="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {{ isCreating ? 'Creating...' : 'Create Project' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
</style>