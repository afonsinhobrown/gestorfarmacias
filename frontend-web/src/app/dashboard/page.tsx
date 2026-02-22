'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }

        // Redirecionar com base no tipo de usuário
        switch (user.tipo_usuario) {
            case 'ADMIN':
                router.push('/dashboard/admin');
                break;
            case 'FARMACIA':
                router.push('/dashboard/vendas');
                break;
            case 'ENTREGADOR':
                router.push('/motoboy');
                break;
            case 'CLIENTE':
                router.push('/cliente');
                break;
            default:
                router.push('/');
        }
    }, [isAuthenticated, user, router]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Redirecionando para o seu painel...</p>
            </div>
        </div>
    );
}
