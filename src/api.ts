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

export const apiRequest = async <T = any>(
  config: AxiosRequestConfig,
  retries = 3
): Promise<AxiosResponse<T>> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios(config);
      return response;
    } catch (error: any) {
      if (error.response?.status === 429 && attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`[apiRequest] Rate limited (429), retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};