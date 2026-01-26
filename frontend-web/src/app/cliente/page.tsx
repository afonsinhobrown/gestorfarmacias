'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Package, MapPin, Clock, User, LogOut, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function ClienteDashboard() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.tipo_usuario !== 'CLIENTE') {
            router.push('/login');
            return;
        }

        fetchPedidos();
    }, [user, router]);

    const fetchPedidos = async () => {
        try {
            const res = await api.get('/pedidos/meus-pedidos/');
            setPedidos(res.data.results || res.data || []);
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            'PENDENTE': 'bg-yellow-100 text-yellow-800',
            'CONFIRMADO': 'bg-blue-100 text-blue-800',
            'EM_TRANSITO': 'bg-purple-100 text-purple-800',
            'ENTREGUE': 'bg-green-100 text-green-800',
            'CANCELADO': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Minha Conta</h1>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/busca" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                            <ShoppingBag size={18} />
                            Continuar Comprando
                        </Link>
                        <button onClick={handleLogout} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <LogOut size={18} />
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Package className="text-blue-600" size={24} />
                            <h3 className="font-bold text-gray-700">Total de Pedidos</h3>
                        </div>
                        <p className="text-3xl font-black text-gray-900">{pedidos.length}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-yellow-600" size={24} />
                            <h3 className="font-bold text-gray-700">Em Andamento</h3>
                        </div>
                        <p className="text-3xl font-black text-gray-900">
                            {pedidos.filter(p => ['PENDENTE', 'CONFIRMADO', 'EM_TRANSITO'].includes(p.status)).length}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Package className="text-green-600" size={24} />
                            <h3 className="font-bold text-gray-700">Entregues</h3>
                        </div>
                        <p className="text-3xl font-black text-gray-900">
                            {pedidos.filter(p => p.status === 'ENTREGUE').length}
                        </p>
                    </div>
                </div>

                {/* Pedidos List */}
                <div className="bg-white rounded-xl border shadow-sm">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-800">Meus Pedidos</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Carregando pedidos...</div>
                    ) : pedidos.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 mb-4">Você ainda não fez nenhum pedido</p>
                            <Link href="/busca" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                                Fazer Primeiro Pedido
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {pedidos.map((pedido) => (
                                <div key={pedido.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-gray-900">Pedido #{pedido.numero_pedido}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(pedido.status)}`}>
                                                    {pedido.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(pedido.data_criacao).toLocaleDateString('pt-MZ', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">
                                                {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(pedido.total)}
                                            </p>
                                        </div>
                                    </div>

                                    {pedido.endereco_entrega && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                                            <span>{pedido.endereco_entrega}</span>
                                        </div>
                                    )}

                                    {pedido.itens && pedido.itens.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <p className="text-sm font-medium text-gray-700">Itens:</p>
                                            {pedido.itens.map((item: any, idx: number) => (
                                                <div key={idx} className="text-sm text-gray-600 flex justify-between">
                                                    <span>{item.quantidade}x {item.produto_nome || 'Produto'}</span>
                                                    <span className="font-medium">
                                                        {new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2 }).format(item.preco_unitario * item.quantidade)} MT
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
