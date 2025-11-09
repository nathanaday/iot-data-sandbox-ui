/**
 * Axios-based API Service for IoT Data Sandbox
 * Provides methods to interact with all API endpoints
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  DataSourceListResponse,
  DataSourceMetadata,
  DataQueryResponse,
  UploadResponse,
  DataQueryParams,
  UploadParams,
  ProjectResponse,
  ProjectListResponse,
  CreateProjectRequest,
  LayerResponse,
  LayerListResponse,
  CreateLayerRequest,
  UpdateColorRequest,
  UpdateVisibilityRequest,
  DuplicateLayerRequest,
} from './types';
import { apiConfig } from './config';

/**
 * Custom error class for API errors
 */
export class ApiServiceError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public message: string,
    public originalError?: AxiosError
  ) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

/**
 * API Service class using Axios
 */
export class ApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseURL?: string, timeout?: number) {
    this.axiosInstance = axios.create({
      baseURL: baseURL || apiConfig.baseUrl,
      timeout: timeout || apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup Axios interceptors for error handling
   */
  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const errorMessage =
            (error.response.data as { error?: string })?.error ||
            error.message ||
            'An error occurred';
          throw new ApiServiceError(
            error.response.status,
            error.response.statusText,
            errorMessage,
            error
          );
        } else if (error.request) {
          throw new ApiServiceError(
            0,
            'Network Error',
            'No response received from server',
            error
          );
        } else {
          throw new ApiServiceError(0, 'Request Error', error.message, error);
        }
      }
    );
  }

  /**
   * Update the base URL
   */
  setBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  /**
   * Get the current base URL
   */
  getBaseURL(): string | undefined {
    return this.axiosInstance.defaults.baseURL;
  }

  // ============================
  // DATASOURCES ENDPOINTS
  // ============================

  /**
   * List all datasources
   * GET /api/datasources
   */
  async listDataSources(): Promise<DataSourceListResponse> {
    const response = await this.axiosInstance.get<DataSourceListResponse>(
      '/api/datasources'
    );
    return response.data;
  }

  /**
   * Upload a CSV datasource
   * POST /api/datasources
   */
  async uploadDataSource(params: UploadParams): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.name) {
      formData.append('name', params.name);
    }

    const response = await this.axiosInstance.post<UploadResponse>(
      '/api/datasources',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Get datasource metadata by ID
   * GET /api/datasources/{id}
   */
  async getDataSource(id: number): Promise<DataSourceMetadata> {
    const response = await this.axiosInstance.get<DataSourceMetadata>(
      `/api/datasources/${id}`
    );
    return response.data;
  }

  /**
   * Delete a datasource by ID
   * DELETE /api/datasources/{id}
   */
  async deleteDataSource(id: number): Promise<void> {
    await this.axiosInstance.delete(`/api/datasources/${id}`);
  }

  /**
   * Query time series data from a datasource
   * GET /api/datasources/{id}/data
   */
  async queryDataSourceData(
    id: number,
    params?: DataQueryParams
  ): Promise<DataQueryResponse> {
    const response = await this.axiosInstance.get<DataQueryResponse>(
      `/api/datasources/${id}/data`,
      { params }
    );
    return response.data;
  }

  // ============================
  // PROJECTS ENDPOINTS
  // ============================

  /**
   * List all projects
   * GET /api/projects
   */
  async listProjects(): Promise<ProjectListResponse> {
    const response = await this.axiosInstance.get<ProjectListResponse>(
      '/api/projects'
    );
    return response.data;
  }

  /**
   * Create a new project
   * POST /api/projects
   */
  async createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    const response = await this.axiosInstance.post<ProjectResponse>(
      '/api/projects',
      data
    );
    return response.data;
  }

  /**
   * Get project details by ID
   * GET /api/projects/{id}
   */
  async getProject(id: number): Promise<ProjectResponse> {
    const response = await this.axiosInstance.get<ProjectResponse>(
      `/api/projects/${id}`
    );
    return response.data;
  }

  /**
   * Delete a project by ID
   * DELETE /api/projects/{id}
   */
  async deleteProject(id: number): Promise<void> {
    await this.axiosInstance.delete(`/api/projects/${id}`);
  }

  /**
   * Get all layers in a project
   * GET /api/projects/{id}/layers
   */
  async getProjectLayers(id: number): Promise<LayerListResponse> {
    const response = await this.axiosInstance.get<LayerListResponse>(
      `/api/projects/${id}/layers`
    );
    return response.data;
  }

  /**
   * Add a layer to a project
   * POST /api/projects/{id}/layers
   */
  async createLayer(
    projectId: number,
    data: CreateLayerRequest
  ): Promise<LayerResponse> {
    const response = await this.axiosInstance.post<LayerResponse>(
      `/api/projects/${projectId}/layers`,
      data
    );
    return response.data;
  }

  // ============================
  // LAYERS ENDPOINTS
  // ============================

  /**
   * Get layer details by ID
   * GET /api/layers/{id}
   */
  async getLayer(id: number): Promise<LayerResponse> {
    const response = await this.axiosInstance.get<LayerResponse>(
      `/api/layers/${id}`
    );
    return response.data;
  }

  /**
   * Delete a layer by ID
   * DELETE /api/layers/{id}
   */
  async deleteLayer(id: number): Promise<void> {
    await this.axiosInstance.delete(`/api/layers/${id}`);
  }

  /**
   * Update layer color
   * PUT /api/layers/{id}/color
   */
  async updateLayerColor(
    id: number,
    data: UpdateColorRequest
  ): Promise<LayerResponse> {
    const response = await this.axiosInstance.put<LayerResponse>(
      `/api/layers/${id}/color`,
      data
    );
    return response.data;
  }

  /**
   * Update layer visibility
   * PUT /api/layers/{id}/visibility
   */
  async updateLayerVisibility(
    id: number,
    data: UpdateVisibilityRequest
  ): Promise<LayerResponse> {
    const response = await this.axiosInstance.put<LayerResponse>(
      `/api/layers/${id}/visibility`,
      data
    );
    return response.data;
  }

  /**
   * Duplicate a layer
   * POST /api/layers/{id}/duplicate
   */
  async duplicateLayer(
    id: number,
    data: DuplicateLayerRequest
  ): Promise<LayerResponse> {
    const response = await this.axiosInstance.post<LayerResponse>(
      `/api/layers/${id}/duplicate`,
      data
    );
    return response.data;
  }

  /**
   * Get layer time series data
   * GET /api/layers/{id}/data
   */
  async getLayerData(
    id: number,
    params?: DataQueryParams
  ): Promise<DataQueryResponse> {
    const response = await this.axiosInstance.get<DataQueryResponse>(
      `/api/layers/${id}/data`,
      { params }
    );
    return response.data;
  }

  /**
   * Load CSV data into layer
   * POST /api/layers/{id}/load-csv
   */
  async loadLayerCSV(
    id: number,
    params: UploadParams
  ): Promise<LayerResponse> {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.name) {
      formData.append('name', params.name);
    }

    const response = await this.axiosInstance.post<LayerResponse>(
      `/api/layers/${id}/load-csv`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
}

/**
 * Default API service instance
 */
export const apiService = new ApiService();

/**
 * Create a new API service instance with custom configuration
 */
export function createApiService(
  baseURL?: string,
  timeout?: number
): ApiService {
  return new ApiService(baseURL, timeout);
}
