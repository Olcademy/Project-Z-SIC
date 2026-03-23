import { AppConfig } from '@/platform/config'; // FIXED: API config
import { apiClient } from '@/platform/api/client'; // FIXED: API config

export const BASE_URL = AppConfig.API_BASE_URL; // FIXED: API config
export const API_URL = `${AppConfig.API_BASE_URL}/api`; // FIXED: API config

export { apiClient }; 
