import { User } from "@shared/schema";

// Auth state management
let currentUser: User | null = null;

export function setCurrentUser(user: User | null) {
    currentUser = user;
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
}

export function getCurrentUser(): User | null {
    if (currentUser) return currentUser;

    const stored = localStorage.getItem('currentUser');
    if (stored) {
        try {
            currentUser = JSON.parse(stored);
            return currentUser;
        } catch {
            localStorage.removeItem('currentUser');
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

// API helpers
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const user = getCurrentUser();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (user) {
        headers.Authorization = `Bearer ${user.id}`;
    }

    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

// Auth API calls
export async function setupFirstUser(name: string, pin: string): Promise<User> {
    const response = await fetch('/api/auth/setup', {
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

export async function verifyPin(pin: string): Promise<User> {
    const response = await fetch('/api/auth/verify', {
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

// User management API calls
export async function getUsers(): Promise<User[]> {
    return apiRequest('/users');
}

export async function createUser(userData: { name: string; pin: string; role: 'admin' | 'cashier' }): Promise<User> {
    const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
    return response.user;
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User> {
    const response = await apiRequest(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
    return response.user;
}

export async function deleteUser(id: number): Promise<void> {
    await apiRequest(`/users/${id}`, {
        method: 'DELETE',
    });
}

export async function changeUserPin(id: number, pin: string): Promise<User> {
    const response = await apiRequest(`/users/${id}/pin`, {
        method: 'PATCH',
        body: JSON.stringify({ pin }),
    });
    return response.user;
}
