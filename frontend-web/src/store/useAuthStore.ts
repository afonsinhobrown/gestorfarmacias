import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    tipo_usuario: 'ADMIN' | 'FARMACIA' | 'CLIENTE' | 'ENTREGADOR';
    foto_perfil?: string;
    telefone?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (user, token) => {
                localStorage.setItem('token', token);
                set({ user, token, isAuthenticated: true });
            },
            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage', // nome no localStorage
        }
    )
);
