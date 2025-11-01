/**
 * API Client for IoT Data Sandbox
 * Provides methods to interact with all API endpoints
 */

import type {
  DataSourceListResponse,
  DataSourceMetadata,
  DataQueryResponse,
  UploadResponse,
  ErrorResponse,
  DataQueryParams,
  UploadParams,
} from './types';
import { apiConfig } from './config';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public error: string
  ) {
    super(`API Error ${status}: ${error}`);
    this.name = 'ApiError';
  }
}

/**
 * Configuration for the API client
 */
export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
}

/**
 * IoT Data Sandbox API Client
 */
export class IoTDataSandboxClient {
  private baseUrl: string;
  private timeout: number;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || apiConfig.baseUrl;
    this.timeout = config.timeout || apiConfig.timeout;
  }

  /**
   * Helper method to handle fetch requests
   */
  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData: ErrorResponse = await response.json();
          errorMessage = errorData.error;
        } catch {
          // If parsing error response fails, use statusText
        }
        throw new ApiError(response.status, response.statusText, errorMessage);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  /**
   * List all datasources
   * GET /api/datasources
   */
  async listDataSources(): Promise<DataSourceListResponse> {
    return this.fetch<DataSourceListResponse>('/api/datasources');
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

    return this.fetch<UploadResponse>('/api/datasources', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Get datasource metadata by ID
   * GET /api/datasources/{id}
   */
  async getDataSource(id: number): Promise<DataSourceMetadata> {
    return this.fetch<DataSourceMetadata>(`/api/datasources/${id}`);
  }

  /**
   * Delete a datasource by ID
   * DELETE /api/datasources/{id}
   */
  async deleteDataSource(id: number): Promise<void> {
    return this.fetch<void>(`/api/datasources/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Query time series data from a datasource
   * GET /api/datasources/{id}/data
   */
  async queryData(
    id: number,
    params?: DataQueryParams
  ): Promise<DataQueryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.start_time) {
      queryParams.append('start_time', params.start_time);
    }
    if (params?.end_time) {
      queryParams.append('end_time', params.end_time);
    }

    const queryString = queryParams.toString();
    const path = `/api/datasources/${id}/data${queryString ? `?${queryString}` : ''}`;

    return this.fetch<DataQueryResponse>(path);
  }

  /**
   * Update the base URL for the API client
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

/**
 * Default API client instance
 */
export const apiClient = new IoTDataSandboxClient();

/**
 * Create a new API client instance with custom configuration
 */
export function createApiClient(config?: ApiClientConfig): IoTDataSandboxClient {
  return new IoTDataSandboxClient(config);
}

