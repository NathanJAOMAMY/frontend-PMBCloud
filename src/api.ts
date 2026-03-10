// Local server

// export const API_BASE_URL = 'http://localhost:3001';

export const API_BASE_URL = 'https://backend-pmbcloud.onrender.com';

// APRÈS - pour Docker
// export const API_BASE_URL = 'http://host.docker.internal:3001';

// online server
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