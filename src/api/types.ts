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

