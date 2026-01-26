'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Bike, Package, MapPin, Phone, CheckCircle, Clock, LogOut, Navigation } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function MotoboyDashboard() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [entregas, setEntregas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'DISPONIVEIS' | 'MINHAS'>('DISPONIVEIS');

    useEffect(() => {
        if (!user || user.tipo_usuario !== 'ENTREGADOR') {
            router.push('/login');
            return;
        }

        fetchEntregas();
        const interval = setInterval(fetchEntregas, 30000); // Atualiza a cada 30s
        return () => clearInterval(interval);
    }, [user, router, filter]);

    const fetchEntregas = async () => {
        try {
            const endpoint = filter === 'DISPONIVEIS' ? '/entregas/disponiveis/' : '/entregas/minhas/';
            const res = await api.get(endpoint);
            setEntregas(res.data.results || res.data || []);
        } catch (error) {
            console.error('Erro ao buscar entregas:', error);
        } finally {
            setLoading(false);
        }
    };

    const aceitarEntrega = async (entregaId: number) => {
        try {
            await api.post(`/entregas/${entregaId}/aceitar/`);
            toast.success('Entrega aceita! Boa viagem!');
            fetchEntregas();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Erro ao aceitar entrega');
        }
    };

    const finalizarEntrega = async (entregaId: number) => {
        try {
            await api.post(`/entregas/${entregaId}/finalizar/`);
            toast.success('Entrega finalizada com sucesso!');
            fetchEntregas();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Erro ao finalizar entrega');
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            'PENDENTE': 'bg-yellow-100 text-yellow-800',
            'ACEITA': 'bg-blue-100 text-blue-800',
            'EM_TRANSITO': 'bg-purple-100 text-purple-800',
            'ENTREGUE': 'bg-green-100 text-green-800',
            'CANCELADA': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const minhasEntregasHoje = entregas.filter(e =>
        e.status === 'ENTREGUE' &&
        new Date(e.data_entrega).toDateString() === new Date().toDateString()
    ).length;

    const emAndamento = entregas.filter(e => ['ACEITA', 'EM_TRANSITO'].includes(e.status)).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <Bike size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Painel do Motoboy</h1>
                            <p className="text-sm text-gray-500">{user?.first_name} {user?.last_name}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <LogOut size={18} />
                        Sair
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="text-green-600" size={24} />
                            <h3 className="font-bold text-gray-700">Entregas Hoje</h3>
                        </div>
                        <p className="text-3xl font-black text-gray-900">{minhasEntregasHoje}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-blue-600" size={24} />
                            <h3 className="font-bold text-gray-700">Em Andamento</h3>
                        </div>
                        <p className="text-3xl font-black text-gray-900">{emAndamento}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <Package className="text-orange-600" size={24} />
                            <h3 className="font-bold text-gray-700">Disponíveis</h3>
                        </div>
                        <p className="text-3xl font-black text-gray-900">
                            {filter === 'DISPONIVEIS' ? entregas.length : '-'}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-xl border shadow-sm mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setFilter('DISPONIVEIS')}
                            className={`flex-1 px-6 py-4 font-bold transition-colors ${filter === 'DISPONIVEIS'
                                ? 'text-orange-600 border-b-2 border-orange-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Entregas Disponíveis
                        </button>
                        <button
                            onClick={() => setFilter('MINHAS')}
                            className={`flex-1 px-6 py-4 font-bold transition-colors ${filter === 'MINHAS'
                                ? 'text-orange-600 border-b-2 border-orange-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Minhas Entregas
                        </button>
                    </div>
                </div>

                {/* Entregas List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="bg-white p-12 rounded-xl text-center text-gray-500">
                            Carregando entregas...
                        </div>
                    ) : entregas.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl text-center">
                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">
                                {filter === 'DISPONIVEIS'
                                    ? 'Nenhuma entrega disponível no momento'
                                    : 'Você não tem entregas em andamento'}
                            </p>
                        </div>
                    ) : (
                        entregas.map((entrega) => (
                            <div key={entrega.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-gray-900">Pedido #{entrega.pedido_numero || entrega.pedido}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(entrega.status)}`}>
                                                {entrega.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {new Date(entrega.data_criacao).toLocaleString('pt-MZ')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Taxa de Entrega</p>
                                        <p className="text-xl font-bold text-green-600">
                                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(entrega.taxa_entrega || 150)}
                                        </p>
                                    </div>
                                </div>

                                {/* Endereço */}
                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 mb-1">Endereço de Entrega:</p>
                                            <p className="text-gray-700">{entrega.endereco_entrega || 'Não informado'}</p>
                                        </div>
                                        <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                            <Navigation size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Cliente */}
                                {entrega.cliente_nome && (
                                    <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
                                        <Phone size={16} />
                                        <span className="font-medium">{entrega.cliente_nome}</span>
                                        {entrega.cliente_telefone && (
                                            <span>• {entrega.cliente_telefone}</span>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t">
                                    {filter === 'DISPONIVEIS' && entrega.status === 'PENDENTE' && (
                                        <button
                                            onClick={() => aceitarEntrega(entrega.id)}
                                            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors"
                                        >
                                            Aceitar Entrega
                                        </button>
                                    )}

                                    {filter === 'MINHAS' && ['ACEITA', 'EM_TRANSITO'].includes(entrega.status) && (
                                        <button
                                            onClick={() => finalizarEntrega(entrega.id)}
                                            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} />
                                            Finalizar Entrega
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
