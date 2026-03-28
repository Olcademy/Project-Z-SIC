import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
    name: string;
    email: string;
    phone: string;
    photoURL?: string;
    location: string;
    isGuest: boolean;
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    updateProfile: (data: Partial<Omit<User, 'isGuest' | 'email'>>) => Promise<void>;
    login: (userData: Omit<User, 'isGuest'>, options?: { rememberMe?: boolean }) => Promise<void>;
    logout: () => Promise<void>;
    setAsGuest: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@sic_user_data';
const REMEMBER_ME_KEY = '@sic_remember_me';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [shouldPersistUser, setShouldPersistUser] = useState(false);

    // Initialize user from storage
    useEffect(() => {
        const loadUser = async () => {
            try {
                const rawRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
                const rememberMe = rawRememberMe ? Boolean(JSON.parse(rawRememberMe)) : false;
                setShouldPersistUser(rememberMe);

                // If the user didn't opt into persistence, always start logged out.
                if (!rememberMe) {
                    await AsyncStorage.removeItem(USER_STORAGE_KEY);
                    setUser(null);
                    return;
                }

                const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    const isGuest = Boolean(parsed?.isGuest);
                    if (isGuest) {
                        // Guest mode should be an explicit choice each session.
                        await AsyncStorage.removeItem(USER_STORAGE_KEY);
                        await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(false));
                        setShouldPersistUser(false);
                        setUser(null);
                    } else {
                        setUser({
                            ...parsed,
                            phone: parsed.phone || '',
                            location: parsed.location || 'India',
                            isGuest: false,
                        });
                    }
                } else {
                    // No session by default; user must login or continue as guest.
                    setUser(null);
                }
            } catch (error) {
                console.error('Failed to load user data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const updateProfile = useCallback(async (data: Partial<Omit<User, 'isGuest' | 'email'>>) => {
        if (!user || user.isGuest) return;

        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        try {
            if (shouldPersistUser) {
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }, [shouldPersistUser, user]);

    const login = useCallback(async (userData: Omit<User, 'isGuest'>, options?: { rememberMe?: boolean }) => {
        const rememberMe = Boolean(options?.rememberMe);
        const newUser: User = { 
            name: userData.name || 'User',
            email: userData.email || '',
            phone: userData.phone || '',
            photoURL: userData.photoURL || undefined,
            location: userData.location || 'India',
            isGuest: false 
        };
        setUser(newUser);
        try {
            setShouldPersistUser(rememberMe);
            await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(rememberMe));

            if (rememberMe) {
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
            } else {
                // Prevent a stale remembered user from auto-logging in on next cold start.
                await AsyncStorage.removeItem(USER_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
            await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(false));
            setShouldPersistUser(false);
            setUser(null);
        } catch (error) {
            console.error('Failed to clear user data:', error);
        }
    }, []);

    const setAsGuest = useCallback(async () => {
        const guestUser: User = {
            name: 'Guest User',
            email: '',
            phone: '',
            location: 'India',
            isGuest: true,
        };
        setUser(guestUser);
        setShouldPersistUser(false);
        try {
            await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(false));
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to update session persistence:', error);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, updateProfile, login, logout, setAsGuest }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
