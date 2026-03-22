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
    login: (userData: Omit<User, 'isGuest'>) => Promise<void>;
    logout: () => Promise<void>;
    setAsGuest: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@sic_user_data';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize user from storage
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUser({
                        ...parsed,
                        phone: parsed.phone || '',
                        location: parsed.location || 'India',
                    });
                } else {
                    // Default to guest if no user is stored
                    setUser({
                        name: 'Guest User',
                        email: '',
                        phone: '',
                        location: 'India',
                        isGuest: true,
                    });
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
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }, [user]);

    const login = useCallback(async (userData: Omit<User, 'isGuest'>) => {
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
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
            setUser({
                name: 'Guest User',
                email: '',
                phone: '',
                location: 'India',
                isGuest: true,
            });
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
        try {
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guestUser));
        } catch (error) {
            console.error('Failed to save guest status:', error);
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
