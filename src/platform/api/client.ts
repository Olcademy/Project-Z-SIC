import axios from 'axios';
import { AppConfig } from '@/platform/config';

const DEFAULT_API_BASE_URL = 'https://project-z-backend-apis.onrender.com';

const getApiBaseUrl = (): string => {
    const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
    const baseUrl = (raw && raw.trim().length > 0 ? raw.trim() : DEFAULT_API_BASE_URL).replace(/\/+$/, '');
    return baseUrl;
};

export const apiClient = axios.create({
    baseURL: AppConfig.API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

apiClient.interceptors.response.use(
    (response) => {
        console.log(`[API SUCCESS] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
        return response;
    },
    (error) => {
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'UNKNOWN';
        const status = error.response?.status || 'NO_RESPONSE';
        const message = error.message || 'Unknown error';

        console.error(`[API ERROR] ${method} ${url} - Status: ${status} - ${message}`);

        if (error.response?.data) {
            console.error('[API ERROR DATA]', error.response.data);
        }
        return Promise.reject(error);
    }
);

// Log the configured base URL on initialization
console.log('[API CLIENT] Initialized with baseURL:', AppConfig.API_BASE_URL);
