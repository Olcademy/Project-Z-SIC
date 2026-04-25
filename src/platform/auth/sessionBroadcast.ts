/**
 * sessionBroadcast.ts
 *
 * Allows the API client (which lives outside React) to trigger a logout
 * by calling a registered callback from UserContext.
 *
 * This avoids circular imports between client.ts ↔ UserContext.tsx.
 *
 * Also maintains a module-level flag `sessionInvalidated` so that hooks
 * can synchronously skip API calls even before React re-renders.
 */

type LogoutCallback = () => void;

/** Module-level flag — set synchronously on first "User not found" 404. */
let _sessionInvalidated = false;

let _onSessionInvalidated: LogoutCallback | null = null;

/** Returns true if the session has been marked invalid this JS process lifetime. */
export const isSessionInvalidated = (): boolean => _sessionInvalidated;

/** Reset the flag (called on successful login). */
export const resetSessionInvalidation = (): void => {
    _sessionInvalidated = false;
};

/** Called by UserContext on mount to register the logout handler. */
export const registerSessionInvalidationHandler = (cb: LogoutCallback) => {
    _onSessionInvalidated = cb;
};

/** Called by the API interceptor when it receives a "User not found" 404. */
export const broadcastSessionInvalidated = () => {
    if (_sessionInvalidated) return; // Already invalidated — don't fire repeatedly
    _sessionInvalidated = true;
    if (_onSessionInvalidated) {
        _onSessionInvalidated();
    }
};
