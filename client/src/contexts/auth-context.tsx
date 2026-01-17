import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../../../shared/types';

interface AuthContextType {
    user: User | null;
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isCashier: boolean;
    isOwner: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    console.log('AuthProvider: Mounting');

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const login = async (pin: string): Promise<boolean> => {
        try {
            // Check if we're running in Electron and can use direct database access
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
                console.log('Using direct database access for login');
                const electronAPI = (window as any).electronAPI;

                const result = await electronAPI.login(pin);

                if (result && result.user) {
                    console.log('Login successful, user data:', result.user);
                    setUser(result.user);
                    // Store in localStorage for persistence
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('currentUser', JSON.stringify(result.user));
                    }
                    return true;
                } else {
                    console.log('Login failed - no user returned');
                    return false;
                }
            } else {
                // Fallback to server API for web environments
                // Get server URL - use fallback for web dev
                let serverUrl = '';
                if (typeof window !== 'undefined') {
                    serverUrl = window.location.origin;
                    if (window.location.hostname === 'localhost') {
                        serverUrl = 'http://localhost:5001'; // Fallback for web dev
                    }
                }

                console.log('Attempting login with server URL:', serverUrl);

                const response = await fetch(`${serverUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin }),
                });

                console.log('Login response status:', response.status);

                if (response.ok) {
                    const userData = await response.json();
                    console.log('Login successful, user data:', userData);
                    setUser(userData.user);
                    // Store in localStorage for persistence
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('currentUser', JSON.stringify(userData.user));
                    }
                    return true;
                } else {
                    console.log('Login failed with status:', response.status);
                    const errorData = await response.json().catch(() => ({}));
                    console.log('Error data:', errorData);
                    return false;
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('currentUser');
        }
    };

    // Check for stored user on mount
    useEffect(() => {
        console.log('AuthProvider: mounted and checking storage');
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
                try {
                    const parsed = JSON.parse(storedUser);
                    if (parsed && typeof parsed === 'object') {
                        console.log('Restoring user session', parsed);
                        setUser(parsed);
                        // Restore backend session
                        if (typeof window !== 'undefined' && (window as any).electronAPI && parsed.id) {
                            (window as any).electronAPI.setSession(parsed.id).catch((err: any) =>
                                console.error('Failed to restore session:', err)
                            );
                        }
                    } else {
                        localStorage.removeItem('currentUser');
                    }
                } catch (error) {
                    console.error('Error parsing stored user:', error);
                    localStorage.removeItem('currentUser');
                }
            } else if (storedUser === 'undefined' || storedUser === 'null') {
                localStorage.removeItem('currentUser');
            }
        }
        setIsLoading(false);
    }, []);

    const value: AuthContextType = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || false,
        isCashier: user?.role === 'cashier' || false,
        isOwner: user?.isOwner || false,
        isLoading,
    };

    console.log('AuthProvider: providing value', {
        isAuthenticated: !!user,
        isLoading,
        isAdmin: value.isAdmin,
        isCashier: value.isCashier
    });

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        console.error('useAuth: context is undefined! This component is likely NOT inside AuthProvider.');
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}