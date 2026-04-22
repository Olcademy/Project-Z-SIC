import * as SecureStore from 'expo-secure-store';
import { apiClient } from '@/platform/api/client';

const USER_AUTH_TOKEN_KEY = 'sic_user_auth_token';

export const applyApiAuthToken = (token?: string | null) => {
    const trimmed = String(token || '').trim();
    if (trimmed.length > 0) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${trimmed}`;
    } else {
        // Ensure header is removed entirely (Axios merges undefined oddly).
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete apiClient.defaults.headers.common.Authorization;
    }
};

export const setUserAuthToken = async (token?: string | null, options?: { persist?: boolean }) => {
    applyApiAuthToken(token);

    const shouldPersist = Boolean(options?.persist);
    const trimmed = String(token || '').trim();

    if (!shouldPersist) {
        // Avoid stale token on next cold start.
        await SecureStore.deleteItemAsync(USER_AUTH_TOKEN_KEY);
        return;
    }

    if (trimmed.length === 0) {
        await SecureStore.deleteItemAsync(USER_AUTH_TOKEN_KEY);
        return;
    }

    await SecureStore.setItemAsync(USER_AUTH_TOKEN_KEY, trimmed);
};

export const hydrateUserAuthToken = async () => {
    try {
        const token = await SecureStore.getItemAsync(USER_AUTH_TOKEN_KEY);
        applyApiAuthToken(token);
        return token;
    } catch {
        applyApiAuthToken(null);
        return null;
    }
};

export const clearUserAuthToken = async () => {
    applyApiAuthToken(null);
    await SecureStore.deleteItemAsync(USER_AUTH_TOKEN_KEY);
};
