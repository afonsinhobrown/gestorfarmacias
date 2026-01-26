'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    Package,
    ShoppingBag,
    Truck,
    CreditCard,
    Users,
    Settings,
    LogOut,
    DollarSign
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

// Função auxiliar para combinar classes (se não tiver o lib/utils, crio depois)
// Por enquanto vou usar o clsx direto se precisar, mas vou assumir que lib/utils existe ou vou criar.
// Na verdade, vou criar um utils básico antes.

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const isAdmin = user?.tipo_usuario === 'ADMIN';
    const isFarmacia = user?.tipo_usuario === 'FARMACIA';
    const isCliente = user?.tipo_usuario === 'CLIENTE';
    const isEntregador = user?.tipo_usuario === 'ENTREGADOR';

    const menuItems = [
        {
            title: 'Visão Geral',
            href: isAdmin ? '/dashboard/admin' :
                isCliente ? '/dashboard/cliente' :
                    isEntregador ? '/dashboard/entregador' : '/dashboard/farmacia',
            icon: LayoutDashboard,
        },
        // Admin Menu
        {
            title: 'Farmácias',
            href: '/dashboard/admin/farmacias',
            icon: Store,
            show: isAdmin,
        },
        {
            title: 'Motoboys',
            href: '/dashboard/admin/motoboys',
            icon: Truck,
            show: isAdmin,
        },

        // Farmácia Menu
        {
            title: 'Faturação (Pedidos)',
            href: '/dashboard/pedidos',
            icon: ShoppingBag,
            show: isFarmacia,
        },
        {
            title: 'Gestão de Estoque',
            href: '/dashboard/estoque',
            icon: Package,
            show: isFarmacia,
        },
        {
            title: 'Gestão Financeira & RH',
            href: '/dashboard/financeiro',
            icon: DollarSign,
            show: isFarmacia,
        },
        {
            title: 'Ponto de Venda (POS)',
            href: '/dashboard/vendas',
            icon: CreditCard,
            show: isFarmacia,
        },
        {
            title: 'Relatórios & BI',
            href: '/dashboard/relatorios',
            icon: LayoutDashboard,
            show: isFarmacia,
        },
        {
            title: 'Entregas',
            href: '/dashboard/entregas',
            icon: Truck,
            show: isFarmacia,
        },

        // Cliente Menu
        {
            title: 'Meus Pedidos',
            href: '/dashboard/cliente',
            icon: ShoppingBag,
            show: isCliente,
        },

        // Entregador Menu
        {
            title: 'Central Logística',
            href: '/dashboard/entregador',
            icon: Truck,
            show: isEntregador,
        },

        {
            title: 'Fornecedores',
            href: '/dashboard/fornecedores',
            icon: Users,
            show: isFarmacia,
        },
        {
            title: 'Usuários',
            href: '/dashboard/usuarios',
            icon: Users,
            show: isAdmin,
        },
        {
            title: 'Minha Farmácia',
            href: '/dashboard/configuracoes',
            icon: Settings,
            show: isFarmacia,
        },
        {
            title: 'Configurações',
            href: '/dashboard/configuracoes',
            icon: Settings,
            show: !isFarmacia,
        },
        {
            title: 'Suporte',
            href: '/dashboard/suporte',
            icon: Users,
        },
    ];

    return (
        <aside className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col z-10">
            <div className="p-6 border-b">
                <h1 className="text-2xl font-bold text-blue-600">GestorFarma</h1>
                <p className="text-xs text-gray-500 mt-1">Painel {isAdmin ? 'Administrativo' : 'da Farmácia'}</p>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {menuItems.map((item, index) => {
                    if (item.show === false) return null;

                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                        <Link
                            key={index}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            <item.icon size={20} />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={() => {
                        logout();
                        window.location.href = '/login';
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 w-full transition-colors"
                >
                    <LogOut size={20} />
                    Sair
                </button>
            </div>
        </aside>
    );
}
