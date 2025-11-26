/**
 * TypeScript type definitions for IoT Data Sandbox API
 * Generated from Swagger specification
 */

/**
 * Single data point in a time series
 */
export interface DataPoint {
  timestamp: string;
  value: number;
}

/**
 * Response from querying time series data
 */
export interface DataQueryResponse {
  data: DataPoint[];
  start_time: string;
  end_time: string;
  row_count: number;
}

/**
 * Metadata about a datasource
 */
export interface DataSourceMetadata {
  data_source_id: number;
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  row_count: number;
  time_label: string;
  value_label: string;
  when_created: string;
}

/**
 * Response from listing all datasources
 */
export interface DataSourceListResponse {
  data_sources: DataSourceMetadata[];
}

/**
 * Response from uploading a new datasource
 */
export interface UploadResponse {
  data_source_id: number;
  name: string;
  start_time: string;
  end_time: string;
  row_count: number;
  time_label: string;
  value_label: string;
  when_created: string;
}

/**
 * Error response from the API
 */
export interface ErrorResponse {
  error: string;
}

/**
 * Query parameters for data queries
 */
export interface DataQueryParams {
  start_time?: string;
  end_time?: string;
}

/**
 * Upload parameters for datasource creation
 */
export interface UploadParams {
  file: File;
  name?: string;
}

/**
 * Project response
 */
export interface ProjectResponse {
  project_id: number;
  name: string;
  layer_count: number;
  when_created: string;
}

/**
 * Response from listing all projects
 */
export interface ProjectListResponse {
  projects: ProjectResponse[];
}

/**
 * Request to create a new project
 */
export interface CreateProjectRequest {
  name: string;
}

/**
 * Layer response
 */
export interface LayerResponse {
  data_layer_id: number;
  project_id: number;
  data_source_id: number;
  name: string;
  color: string;
  is_visible: boolean;
  z_index: number;
}

/**
 * Response from listing all layers
 */
export interface LayerListResponse {
  layers: LayerResponse[];
}

/**
 * Request to create a new layer
 */
export interface CreateLayerRequest {
  name: string;
}

/**
 * Request to update layer color
 */
export interface UpdateColorRequest {
  color: string;
}

/**
 * Request to update layer visibility
 */
export interface UpdateVisibilityRequest {
  is_visible: boolean;
}

/**
 * Request to duplicate a layer
 */
export interface DuplicateLayerRequest {
  new_name: string;
}

/**
 * Response from previewing CSV data (without creating datasource)
 */
export interface PreviewDataResponse {
  type: string;
  row_count: number;
  start_time: string;
  end_time: string;
  time_label: string;
  value_label: string;
}

/**
 * Parameter definition for a tool
 */
export interface ParameterDefinition {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

/**
 * Tool manifest describing a registered tool
 */
export interface ToolManifest {
  name: string;
  description: string;
  category: string;
  documentation: string;
  parameters: ParameterDefinition[];
  examples?: string[];
}

/**
 * Response from listing all tool manifests
 */
export interface ToolManifestListResponse {
  tools: ToolManifest[];
}

/**
 * Response from starting an async CSV upload job
 */
export interface UploadJobResponse {
  job_id: string;
}

/**
 * Status of a single layer in an upload job
 */
export interface LayerStatusDetail {
  layer_name: string;
  rows_written: number;
  total_rows: number;
  percent_complete: number;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
}

/**
 * Status response for an async CSV upload job
 */
export interface JobStatusResponse {
  job_id: string;
  project_id: number;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  layers: LayerStatusDetail[];
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

