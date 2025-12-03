import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
    user: User | null;
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const login = async (pin: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin }),
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData.user);
                // Store in localStorage for persistence
                localStorage.setItem('currentUser', JSON.stringify(userData.user));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    // Check for stored user on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }, []);

    const value: AuthContextType = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || false,
        isOwner: user?.isOwner || false,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
