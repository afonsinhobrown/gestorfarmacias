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
    DollarSign,
    BarChart3,
    Shield
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
            title: 'Visão Gerencial',
            href: isAdmin ? '/dashboard/admin' :
                isCliente ? '/dashboard/cliente' :
                    isEntregador ? '/dashboard/entregador' : '/dashboard/farmacia',
            icon: LayoutDashboard,
            show: true
        },
        // Super Admin Menu
        {
            title: 'Gestão Master',
            href: '/dashboard/admin/gestao',
            icon: Shield,
            show: isAdmin,
        },
        {
            title: 'Equipe de Entrega',
            href: '/dashboard/admin/motoboys',
            icon: Truck,
            show: isAdmin,
        },

        // Farmácia Menu (Distribuído por cargo)
        {
            title: 'Ponto de Venda (POS)',
            href: '/dashboard/vendas',
            icon: CreditCard,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'CAIXA', 'ATENDENTE', 'FARMACEUTICO', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Gestão de Caixa',
            href: '/dashboard/caixa',
            icon: DollarSign,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'CAIXA', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Compras e Logística',
            href: '/dashboard/compras',
            icon: Truck,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'FARMACEUTICO', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Gestão de Faturamento',
            href: '/dashboard/pedidos',
            icon: ShoppingBag,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'CAIXA', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Estoque & Produtos',
            href: '/dashboard/produtos',
            icon: Package,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'FARMACEUTICO', 'ATENDENTE', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Kardex (Movimentos)',
            href: '/dashboard/kardex',
            icon: BarChart3,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'FARMACEUTICO', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Contas Correntes',
            href: '/dashboard/clientes',
            icon: CreditCard,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'CAIXA', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Financeiro & Fluxo',
            href: '/dashboard/financeiro',
            icon: DollarSign,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Recursos Humanos',
            href: '/dashboard/usuarios',
            icon: Users,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Análise de Vendas',
            href: '/dashboard/relatorios',
            icon: BarChart3,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'CAIXA', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Minhas Comissões',
            href: '/dashboard/relatorios/comissoes',
            icon: Users,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'CAIXA', 'ATENDENTE', 'FARMACEUTICO', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },
        {
            title: 'Gestão de Entregas',
            href: '/dashboard/entregas',
            icon: Truck,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'ATENDENTE', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
        },

        // Fornecedores
        {
            title: 'Fornecedores',
            href: '/dashboard/fornecedores',
            icon: Users,
            show: (isFarmacia || isAdmin) && ['GERENTE', 'FARMACEUTICO', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || ''),
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
            title: 'Minha Farmácia',
            href: '/dashboard/configuracoes',
            icon: Settings,
            show: isFarmacia && ['GERENTE', 'FARMACIA'].includes(user?.cargo || ''),
        },
        {
            title: 'Suporte & Ajuda',
            href: '/dashboard/suporte',
            icon: Users,
            show: true
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
