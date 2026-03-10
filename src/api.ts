// API Base URL - uses environment variable for different environments
// @ts-ignore - Vite provides import.meta.env
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Debug: Log the API URL being used
console.log('[API] Using API_BASE_URL:', API_BASE_URL);
// @ts-ignore - Vite provides import.meta.env
console.log('[API] VITE_API_BASE_URL env:', import.meta.env.VITE_API_BASE_URL);

// Local server (commented for reference)
// export const API_BASE_URL = 'http://localhost:3001';

// Production server (commented for reference)
// export const API_BASE_URL = 'https://backend-pmbcloud.onrender.com';

// Docker setup (commented for reference)
// export const API_BASE_URL = 'http://host.docker.internal:3001';

// Other online servers (commented for reference)
// export const API_BASE_URL = 'https://back-intranet.onrender.com';
// export const API_BASE_URL = 'https://env-2523343.jcloud-ver-jpe.ik-server.com';

// Utility function for API calls with retry logic
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Track pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>();

function createRequestKey(config: AxiosRequestConfig): string {
  return `${config.method || 'GET'}:${config.url}:${JSON.stringify(config.data || {})}`;
}

export const apiRequest = async <T = any>(
  config: AxiosRequestConfig,
  retries = 3
): Promise<AxiosResponse<T>> => {
  const requestKey = createRequestKey(config);
  
  // Return pending request if already in flight (deduplication)
  if (pendingRequests.has(requestKey)) {
    console.log(`[apiRequest] Reusing pending request for ${requestKey}`);
    return pendingRequests.get(requestKey);
  }

  const requestPromise = (async () => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios(config);
        return response;
      } catch (error: any) {
        // Handle rate limiting with exponential backoff
        if (error.response?.status === 429 && attempt < retries - 1) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Cap at 10 seconds
          console.warn(`[apiRequest] Rate limited (429), retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // Don't retry on client errors other than 429
        if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }
        // Retry on network errors or 5xx server errors
        if (attempt < retries - 1) {
          const delay = Math.min(Math.pow(2, attempt) * 500, 5000);
          console.warn(`[apiRequest] Error on attempt ${attempt + 1}, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  })();

  pendingRequests.set(requestKey, requestPromise);
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingRequests.delete(requestKey);
  }
};