import axios from 'axios';
import { AppConfig } from '@/platform/config';
import { clearUserAuthToken } from '@/platform/auth/token';
import { broadcastSessionInvalidated } from '@/platform/auth/sessionBroadcast';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_BASE_URL = 'https://project-z-backend-apis.onrender.com';

const getApiBaseUrl = (): string => {
    const raw =
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        process.env.EXPO_PUBLIC_BACKEND_URL ||
        AppConfig.API_BASE_URL ||
        DEFAULT_API_BASE_URL;
    const trimmed = String(raw || '').trim();
    const baseUrl = (trimmed.length > 0 ? trimmed : DEFAULT_API_BASE_URL).replace(/\/+$/, '');
    return baseUrl;
};

export const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 60000,
    timeoutErrorMessage: 'Request timed out',
});

apiClient.interceptors.request.use((config) => {
    const baseURL = config.baseURL || '';
    const url = config.url || '';
    console.log('[API REQUEST]', config.method?.toUpperCase(), `${baseURL}${url}`);
    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        console.log(`[API SUCCESS] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
        return response;
    },
    (error) => {
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        const url = error.config?.url || 'UNKNOWN';
        const baseURL = error.config?.baseURL || 'UNKNOWN';
        const status = error.response?.status || 'NO_RESPONSE';
        const message = error.message || 'Unknown error';
        const code = error.code || 'NO_CODE';
        const responseData = error.response?.data;

        // 401 Unauthorized = token expired or revoked → real session invalidation.
        if (status === 401) {
            console.warn(`[API] Token expired or invalid (${method} ${url}). Logging out.`);
            clearUserAuthToken().catch(() => {});
            AsyncStorage.removeItem('@sic_user_data').catch(() => {});
            broadcastSessionInvalidated();
            return Promise.reject(error);
        }

        // 404 "User not found" on specific endpoints (e.g. favCheck) is a backend
        // quirk — do NOT log out the user. The query-level try/catch handles it.
        if (status === 404 && responseData?.message === 'User not found') {
            // Suppress the noisy error; query will return null gracefully.
            return Promise.reject(error);
        }

        console.error(`[API ERROR] ${method} ${baseURL}${url} - Status: ${status} - Code: ${code} - ${message}`);
        if (responseData) {
            console.error('[API ERROR DATA]', responseData);
        }

        return Promise.reject(error);
    }
);

// Log the configured base URL on initialization
console.log('[API CLIENT] Initialized with baseURL:', getApiBaseUrl());
