/**
 * Pinia store for managing Projects
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiService } from '@/api';
import type {
  ProjectResponse,
  CreateProjectRequest,
  LayerListResponse,
} from '@/api';
import { useLayersStore } from './layers';

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<ProjectResponse[]>([]);
  const currentProject = ref<ProjectResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Selected project and layer IDs for tracking application state
  const selectedProjectId = ref<number | null>(null);
  const selectedLayerId = ref<number | null>(null);

  // Computed
  const projectCount = computed(() => projects.value.length);

  const getProjectById = computed(() => {
    return (id: number) => projects.value.find(p => p.project_id === id);
  });

  const sortedProjects = computed(() => {
    return [...projects.value].sort((a, b) =>
      new Date(b.when_created).getTime() - new Date(a.when_created).getTime()
    );
  });

  // Actions

  /**
   * Fetch all projects
   */
  async function fetchProjects(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.listProjects();
      projects.value = response.projects;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch projects';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a single project by ID
   */
  async function fetchProject(id: number): Promise<ProjectResponse> {
    loading.value = true;
    error.value = null;
    try {
      const project = await apiService.getProject(id);
      currentProject.value = project;

      const index = projects.value.findIndex(p => p.project_id === id);
      if (index !== -1) {
        projects.value[index] = project;
      } else {
        projects.value.push(project);
      }

      return project;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch project';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new project
   */
  async function createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    loading.value = true;
    error.value = null;
    try {
      const project = await apiService.createProject(data);
      projects.value.push(project);
      currentProject.value = project;
      return project;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create project';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a project
   */
  async function deleteProject(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteProject(id);
      projects.value = projects.value.filter(p => p.project_id !== id);
      if (currentProject.value?.project_id === id) {
        currentProject.value = null;
      }
      
      // If the deleted project was selected, select another project or set to null
      if (selectedProjectId.value === id) {
        if (projects.value.length > 0) {
          selectedProjectId.value = projects.value[0]?.project_id || null;
        } else {
          selectedProjectId.value = null;
        }
        selectedLayerId.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete project';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get all layers in a project
   */
  async function fetchProjectLayers(id: number): Promise<LayerListResponse> {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.getProjectLayers(id);
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch project layers';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set the current project
   */
  function setCurrentProject(project: ProjectResponse | null): void {
    currentProject.value = project;
  }

  /**
   * Load a project with all its data (layers and timeseries)
   * This is the main function to call when selecting a project
   */
  async function loadProject(id: number): Promise<void> {
    loading.value = true;
    error.value = null;
    
    try {
      const layersStore = useLayersStore();
      
      // Step 1: Fetch project details
      const project = await apiService.getProject(id);
      currentProject.value = project;
      selectedProjectId.value = id;
      
      // Update projects list
      const index = projects.value.findIndex(p => p.project_id === id);
      if (index !== -1) {
        projects.value[index] = project;
      } else {
        projects.value.push(project);
      }
      
      // Step 2: Fetch project layers list
      const layersResponse = await apiService.getProjectLayers(id);
      
      if (layersResponse.layers.length === 0) {
        // No layers in this project
        layersStore.setLayers([]);
        return;
      }
      
      // Step 3: Fetch detailed info for each layer (in parallel)
      const layerDetails = await Promise.all(
        layersResponse.layers.map(async (layerSummary) => {
          try {
            return await apiService.getLayer(layerSummary.data_layer_id);
          } catch (err) {
            console.error(`Failed to fetch layer ${layerSummary.data_layer_id}:`, err);
            return null;
          }
        })
      );
      
      // Filter out any failed fetches and update layers store
      const validLayers = layerDetails.filter(layer => layer !== null);
      layersStore.setLayers(validLayers);
      
      // Step 4: Fetch timeseries data for each layer (in parallel)
      await Promise.all(
        validLayers.map(async (layer) => {
          try {
            await layersStore.fetchLayerData(layer.data_layer_id);
          } catch (err: any) {
            // Only log non-404 errors (404 means data source doesn't exist, which is expected)
            if (err?.status !== 404) {
              console.error(`Failed to fetch data for layer ${layer.data_layer_id}:`, err);
            }
            // Continue loading other layers even if one fails
          }
        })
      );
      
      console.log(`Project ${project.name} loaded successfully with ${validLayers.length} layers`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load project';
      console.error('Error loading project:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set the selected project ID (without loading data)
   * Use loadProject() instead to load full project data
   */
  function setSelectedProjectId(id: number | null): void {
    const previousId = selectedProjectId.value;
    selectedProjectId.value = id;
    
    // Update currentProject when selectedProjectId changes
    if (id !== null) {
      const project = projects.value.find(p => p.project_id === id);
      currentProject.value = project || null;
    } else {
      currentProject.value = null;
    }
    
    // Clear selected layer when project changes
    if (id === null || id !== previousId) {
      selectedLayerId.value = null;
    }
  }

  /**
   * Set the selected layer ID
   */
  function setSelectedLayerId(id: number | null): void {
    selectedLayerId.value = id;
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
    projects.value = [];
    currentProject.value = null;
    loading.value = false;
    error.value = null;
    selectedProjectId.value = null;
    selectedLayerId.value = null;
  }

  return {
    projects,
    currentProject,
    loading,
    error,
    selectedProjectId,
    selectedLayerId,
    projectCount,
    getProjectById,
    sortedProjects,
    fetchProjects,
    fetchProject,
    createProject,
    deleteProject,
    fetchProjectLayers,
    loadProject,
    setCurrentProject,
    setSelectedProjectId,
    setSelectedLayerId,
    clearError,
    $reset,
  };
});
