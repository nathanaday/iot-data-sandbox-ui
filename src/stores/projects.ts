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

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<ProjectResponse[]>([]);
  const currentProject = ref<ProjectResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

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
  }

  return {
    projects,
    currentProject,
    loading,
    error,
    projectCount,
    getProjectById,
    sortedProjects,
    fetchProjects,
    fetchProject,
    createProject,
    deleteProject,
    fetchProjectLayers,
    setCurrentProject,
    clearError,
    $reset,
  };
});
