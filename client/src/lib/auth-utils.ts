import type { User } from "../../../../shared/types";

// Check if running in Electron
function isElectron(): boolean {
    return typeof (window as any).electronAPI !== 'undefined';
}

// Get server URL for API requests
function getServerUrl(): string {
    // In Electron environment, we'll get the URL from IPC (handled elsewhere)
    // For browser development, connect directly to backend server
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'http://localhost:5001';
    }
    return '';
}

// Auth state management
let currentUser: User | null = null;

export function setCurrentUser(user: User | null) {
    currentUser = user;
    if (typeof window !== 'undefined') {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    }
}

export function getCurrentUser(): User | null {
    if (currentUser) return currentUser;

    const stored = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    if (stored) {
        try {
            currentUser = JSON.parse(stored);
            return currentUser;
        } catch {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('currentUser');
            }
        }
    }

    return null;
}

export function isAuthenticated(): boolean {
    return getCurrentUser() !== null;
}

export function isAdmin(): boolean {
    const user = getCurrentUser();
    return user?.role === 'admin';
}

export function isOwner(): boolean {
    const user = getCurrentUser();
    return user?.isOwner === true;
}

export function logout() {
    setCurrentUser(null);
}

// PIN validation
export function validatePin(pin: string): { isValid: boolean; error?: string } {
    if (!pin) {
        return { isValid: false, error: "PIN is required" };
    }

    if (pin.length !== 6) {
        return { isValid: false, error: "PIN must be 6 digits" };
    }

    if (!/^\d{6}$/.test(pin)) {
        return { isValid: false, error: "PIN must contain only numbers" };
    }

    return { isValid: true };
}

// Check if first-time setup is needed
export async function checkSetup(): Promise<boolean> {
    if (isElectron()) {
        return await (window as any).electronAPI.checkSetupNeeded();
    } else {
        const serverUrl = getServerUrl();
        const response = await fetch(`${serverUrl}/api/auth/setup`, { method: 'HEAD' });
        return response.ok;
    }
}

// API helpers
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (isElectron()) {
        // Use direct database access via Electron API
        const electronAPI = (window as any).electronAPI;

        // Map API endpoints to Electron functions
        if (endpoint === '/users') {
            if (options.method === 'GET') {
                return await electronAPI.getUsers();
            } else if (options.method === 'POST') {
                const body = JSON.parse(options.body as string);
                return await electronAPI.createUser(body);
            }
        } else if (endpoint.startsWith('/users/')) {
            const parts = endpoint.split('/');
            const id = parseInt(parts[2]);
            if (options.method === 'PATCH' && endpoint.includes('/pin')) {
                // Handle PIN change
                const body = JSON.parse(options.body as string);
                return await electronAPI.changeUserPin(id, body.pin);
            } else if (options.method === 'PATCH') {
                // Handle user update
                const body = JSON.parse(options.body as string);
                return await electronAPI.updateUser(id, body);
            } else if (options.method === 'DELETE') {
                return await electronAPI.deleteUser(id);
            }
        }

        // For other endpoints, throw an error since they should be handled by queryClient
        throw new Error(`Direct database access not implemented for endpoint: ${endpoint}`);
    } else {
        // Fallback to server API for web environments
        const user = getCurrentUser();
        const serverUrl = getServerUrl();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (user) {
            headers.Authorization = `Bearer ${user.id}`;
        }

        const response = await fetch(`${serverUrl}/api${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }
}

// Auth API calls
export async function setupFirstUser(name: string, pin: string): Promise<User> {
    if (isElectron()) {
        const result = await (window as any).electronAPI.setup({ name, pin });
        setCurrentUser(result.user);
        return result.user;
    } else {
        const serverUrl = getServerUrl();
        const response = await fetch(`${serverUrl}/api/auth/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, pin }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        const data = await response.json();
        setCurrentUser(data.user);
        return data.user;
    }
}

export async function verifyPin(pin: string): Promise<User> {
    if (isElectron()) {
        const result = await (window as any).electronAPI.login(pin);
        setCurrentUser(result.user);
        return result.user;
    } else {
        const serverUrl = getServerUrl();
        const response = await fetch(`${serverUrl}/api/auth/login`, { // Changed from /api/auth/verify to /api/auth/login
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        const data = await response.json();
        setCurrentUser(data.user);
        return data.user;
    }
}

// User management API calls
export async function getUsers(): Promise<User[]> {
    if (isElectron()) {
        return await (window as any).electronAPI.getUsers();
    } else {
        return apiRequest('/users');
    }
}

export async function createUser(userData: { name: string; pin: string; role: 'admin' | 'cashier' }): Promise<User> {
    if (isElectron()) {
        const electronAPI = (window as any).electronAPI;
        return await electronAPI.createUser(userData);
    } else {
        const response = await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return response.user;
    }
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User> {
    if (isElectron()) {
        const electronAPI = (window as any).electronAPI;
        return await electronAPI.updateUser(id, updates);
    } else {
        const response = await apiRequest(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
        return response.user;
    }
}

export async function deleteUser(id: number): Promise<void> {
    if (isElectron()) {
        const electronAPI = (window as any).electronAPI;
        await electronAPI.deleteUser(id);
    } else {
        await apiRequest(`/users/${id}`, {
            method: 'DELETE',
        });
    }
}

export async function changeUserPin(id: number, pin: string): Promise<User> {
    if (isElectron()) {
        const electronAPI = (window as any).electronAPI;
        return await electronAPI.changeUserPin(id, pin);
    } else {
        const response = await apiRequest(`/users/${id}/pin`, {
            method: 'PATCH',
            body: JSON.stringify({ pin }),
        });
        return response.user;
    }
}
