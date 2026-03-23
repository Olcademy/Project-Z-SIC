/**
 * Application Configuration
 * 
 * Centralized configuration for the SIC app.
 * Environment variables must be prefixed with EXPO_PUBLIC_ in Expo apps.
 */

export const AppConfig = {
    /**
     * Backend API Base URL
     * Configured via EXPO_PUBLIC_BACKEND_URL environment variable
     */
    API_BASE_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://project-z-backend-apis.onrender.com',
    
    /**
     * Feature Flags (Static for Phase 1)
     * These are hardcoded as per Phase 1 requirements
     * In future phases, these will be fetched from /api/config endpoint
     */
    FEATURE_FLAGS: {
        enableOrdering: false,
        enableBooking: false,
    },
    
    /**
     * Guest User Credentials
     * Used for automatic guest login
     */
    GUEST_CREDENTIALS: {
        email: 'guest@gmail.com',
        password: 'Guest@123',
    },
    
    /**
     * App Settings
     */
    APP_NAME: 'Strategic Information Center',
    APP_SHORT_NAME: 'SIC',
    DEEP_LINK_SCHEME: 'sic://',
};

// Log configuration on initialization
console.log('[APP CONFIG] Initialized with:', {
    apiBaseUrl: AppConfig.API_BASE_URL,
    featureFlags: AppConfig.FEATURE_FLAGS,
});