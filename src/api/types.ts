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

/**
 * Request to execute a tool on layer data
 */
export interface ToolExecuteRequest {
  tool_name: string;
  source_layer_id: number;
  project_id: number;
  output_name: string;
  parameters: Record<string, unknown>;
}

/**
 * Summary information about tool execution result
 */
export interface ToolResultSummary {
  rows?: number;
  message?: string;
}

/**
 * Response from executing a tool on layer data
 */
export interface ToolExecuteResponse {
  success: boolean;
  layer?: LayerResponse;
  result_type: string;
  raw_result?: unknown;
  result_summary: ToolResultSummary;
}

// ============================
// LLM Provider Types
// ============================

/**
 * Supported LLM provider types
 */
export type LLMProviderType =
  | 'openai'
  | 'azure_openai'
  | 'anthropic'
  | 'google_ai'
  | 'vertex_ai'
  | 'ollama'
  | 'huggingface';

/**
 * LLM provider configuration response
 */
export interface LLMProviderResponse {
  provider_id: number;
  provider_type: LLMProviderType;
  name: string;
  base_url?: string;
  default_model?: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Response from listing all LLM providers
 */
export interface LLMProviderListResponse {
  providers: LLMProviderResponse[];
}

/**
 * Request to create a new LLM provider
 */
export interface CreateLLMProviderRequest {
  provider_type: LLMProviderType;
  name: string;
  api_key: string;
  base_url?: string;
  default_model?: string;
}

/**
 * Request to update an existing LLM provider
 */
export interface UpdateLLMProviderRequest {
  name?: string;
  api_key?: string;
  base_url?: string;
  default_model?: string;
  is_enabled?: boolean;
}

// ============================
// Chat Types
// ============================

/**
 * Request to submit a chat message
 */
export interface ChatRequest {
  message: string;
  conversation_id?: string;
  provider_id: number;
}

/**
 * Response from submitting a chat message
 */
export interface ChatJobResponse {
  job_id: string;
  conversation_id: string;
}

/**
 * Status of a chat job
 */
export type ChatJobStatus = 'pending' | 'streaming' | 'complete' | 'failed';

/**
 * Status response for a chat job
 */
export interface ChatStatusResponse {
  job_id: string;
  conversation_id: string;
  status: ChatJobStatus;
  response_text: string;
  input_tokens: number;
  output_tokens: number;
  error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * Chat message in a conversation
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  token_count?: number;
}

/**
 * Request to clear chat history
 */
export interface ClearHistoryRequest {
  conversation_id: string;
}

