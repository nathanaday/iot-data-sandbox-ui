<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjectsStore } from '@/stores/projects'

type ModalMode = 'select' | 'manage'

interface Props {
  mode?: ModalMode
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'select'
})

const open = defineModel<boolean>('open', { default: false })
const projectsStore = useProjectsStore()

const isLoading = ref(false)
const error = ref<string | null>(null)
const deletingProjectId = ref<number | null>(null)
const confirmingDeleteId = ref<number | null>(null)
const canConfirmDelete = ref(false)

// Computed title and description based on mode
const dialogTitle = computed(() => 
  props.mode === 'select' ? 'Open Project' : 'Manage Projects'
)

const dialogDescription = computed(() =>
  props.mode === 'select' 
    ? 'Select a project to open and work with'
    : 'View and manage your existing projects'
)

// Fetch projects when modal opens and reset confirmation state when closed
watch(open, async (isOpen) => {
  if (isOpen) {
    await fetchProjects()
  } else {
    // Reset confirmation state when modal closes
    confirmingDeleteId.value = null
    canConfirmDelete.value = false
  }
})

const fetchProjects = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    await projectsStore.fetchProjects()
  } catch (err) {
    error.value = 'Failed to load projects. Please try again.'
    console.error('Error fetching projects:', err)
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSelectProject = (projectId: number) => {
  projectsStore.setSelectedProjectId(projectId)
  // Reset any confirmation state
  confirmingDeleteId.value = null
  canConfirmDelete.value = false
  open.value = false
}

const handleRemoveProject = (projectId: number) => {
  // First click: Show confirmation
  if (confirmingDeleteId.value !== projectId) {
    // Reset any previous confirmation
    confirmingDeleteId.value = projectId
    canConfirmDelete.value = false
    
    // Enable confirmation after 300ms to prevent accidental double clicks
    setTimeout(() => {
      // Only enable if still confirming this project
      if (confirmingDeleteId.value === projectId) {
        canConfirmDelete.value = true
      }
    }, 300)
    return
  }
  
  // Second click: Execute deletion
  if (canConfirmDelete.value) {
    executeDelete(projectId)
  }
}

const executeDelete = async (projectId: number) => {
  deletingProjectId.value = projectId
  confirmingDeleteId.value = null
  canConfirmDelete.value = false
  error.value = null
  
  try {
    await projectsStore.deleteProject(projectId)
  } catch (err) {
    error.value = 'Failed to delete project. Please try again.'
    console.error('Error deleting project:', err)
  } finally {
    deletingProjectId.value = null
  }
}

const isConfirmingDelete = (projectId: number) => {
  return confirmingDeleteId.value === projectId
}

const isCurrentlySelected = (projectId: number) => {
  return projectsStore.selectedProjectId === projectId
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <slot name="trigger">
        <Button variant="default">{{ mode === 'select' ? 'Open Project' : 'Manage Projects' }}</Button>
      </slot>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[700px]">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>
          {{ dialogDescription }}
        </DialogDescription>
      </DialogHeader>
      
      <Card class="border-0 shadow-none">
        <CardContent class="space-y-4 p-0 pt-6">
          <!-- Loading State -->
          <div v-if="isLoading" class="flex items-center justify-center py-8">
            <svg
              class="animate-spin h-8 w-8 text-primary"
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
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p class="text-sm text-destructive font-medium">
              {{ error }}
            </p>
            <Button
              variant="outline"
              size="sm"
              class="mt-3"
              @click="fetchProjects"
            >
              Try Again
            </Button>
          </div>

          <!-- Empty State -->
          <div v-else-if="projectsStore.projects.length === 0" class="text-center py-8 space-y-3">
            <div class="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
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
                class="text-muted-foreground"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium">No projects found</p>
              <p class="text-sm text-muted-foreground">
                Create your first project to get started
              </p>
            </div>
          </div>

          <!-- Projects Table -->
          <div v-else class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-[250px]">Project Name</TableHead>
                  <TableHead class="w-[180px]">Created</TableHead>
                  <TableHead class="w-[100px] text-center">Layers</TableHead>
                  <TableHead class="w-[120px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="project in projectsStore.sortedProjects" :key="project.project_id">
                  <TableCell class="font-medium">
                    <div class="flex items-center gap-2">
                      {{ project.name }}
                      <Badge v-if="isCurrentlySelected(project.project_id)" variant="default" class="text-xs">
                        Active
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell class="text-muted-foreground text-sm">
                    {{ formatDate(project.when_created) }}
                  </TableCell>
                  <TableCell class="text-center">
                    <Badge variant="secondary">
                      {{ project.layer_count }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    <!-- Select Mode Button -->
                    <Button
                      v-if="mode === 'select'"
                      size="sm"
                      variant="default"
                      @click="handleSelectProject(project.project_id)"
                      :disabled="isCurrentlySelected(project.project_id)"
                    >
                      {{ isCurrentlySelected(project.project_id) ? 'Selected' : 'Select' }}
                    </Button>
                    
                    <!-- Manage Mode Button -->
                    <Button
                      v-else
                      size="sm"
                      :variant="isConfirmingDelete(project.project_id) ? 'default' : 'destructive'"
                      @click="handleRemoveProject(project.project_id)"
                      :disabled="deletingProjectId === project.project_id || (isConfirmingDelete(project.project_id) && !canConfirmDelete)"
                      class="transition-all duration-300"
                    >
                      <svg
                        v-if="deletingProjectId === project.project_id"
                        class="animate-spin -ml-1 mr-2 h-3 w-3"
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
                      {{
                        deletingProjectId === project.project_id 
                          ? 'Removing...' 
                          : isConfirmingDelete(project.project_id)
                          ? 'Are you sure?'
                          : 'Remove'
                      }}
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Close Button -->
          <div class="flex justify-end pt-4">
            <Button variant="outline" @click="open = false">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
</style>

