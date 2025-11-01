/**
 * API Configuration
 * 
 * Centralized configuration for API client.
 * You can use environment variables or hardcoded values.
 */

/**
 * Get the API base URL from environment or default to localhost
 */
export function getApiBaseUrl(): string {
  // Check for Vite environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL as string;
  }

  // Default to localhost for development
  return 'http://localhost:8080';
}

/**
 * API configuration object
 */
export const apiConfig = {
  baseUrl: getApiBaseUrl(),
  timeout: 30000, // 30 seconds
};

/**
 * To use a custom base URL, you can:
 * 
 * 1. Set environment variable in .env file:
 *    VITE_API_BASE_URL=https://api.example.com
 * 
 * 2. Or programmatically set it:
 *    import { apiClient } from '@/api';
 *    apiClient.setBaseUrl('https://api.example.com');
 */

