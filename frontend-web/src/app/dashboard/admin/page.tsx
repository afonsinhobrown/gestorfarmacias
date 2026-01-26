'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import {
    Users, Building2, Bike, ShoppingCart, DollarSign,
    TrendingUp, Clock, CheckCircle, XCircle, Eye,
    FileText, BarChart3, Package, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface EntregadorPendente {
    id: number;
    usuario: {
        email: string;
        first_name: string;
        last_name: string;
        telefone: string;
    };
    tipo_veiculo: string;
    data_nascimento: string;
    foto_perfil?: string;
    foto_documento?: string;
    foto_veiculo?: string;
    documento_veiculo?: string;
    status_aprovacao: string;
}

interface Stats {
    total_usuarios: number;
    total_farmacias: number;
    total_entregadores: number;
    total_pedidos: number;
    receita_total: number;
    comissao_plataforma: number;
    pedidos_pendentes: number;
    entregadores_pendentes: number;
    farmacias_pendentes: number;
}

export default function AdminDashboardPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [entregadoresPendentes, setEntregadoresPendentes] = useState<EntregadorPendente[]>([]);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'entregadores' | 'financeiro'>('overview');
    const [selectedEntregador, setSelectedEntregador] = useState<EntregadorPendente | null>(null);
    const [motivoRejeicao, setMotivoRejeicao] = useState('');

    useEffect(() => {
        // Verificar se é admin
        if (!user || user.tipo_usuario !== 'ADMIN') {
            toast.error('Acesso negado');
            router.push('/login');
            return;
        }

        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            // Buscar estatísticas
            const statsRes = await api.get('/admin/stats/');
            setStats(statsRes.data);

            // Buscar entregadores pendentes
            const entregadoresRes = await api.get('/admin/entregadores/pendentes/');
            setEntregadoresPendentes(entregadoresRes.data);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleAprovarEntregador = async (id: number) => {
        try {
            await api.post(`/admin/entregadores/${id}/aprovar/`);
            toast.success('Entregador aprovado com sucesso!');
            fetchData();
            setSelectedEntregador(null);
        } catch (error) {
            toast.error('Erro ao aprovar entregador');
        }
    };

    const handleRejeitarEntregador = async (id: number) => {
        if (!motivoRejeicao.trim()) {
            toast.error('Informe o motivo da rejeição');
            return;
        }

        try {
            await api.post(`/admin/entregadores/${id}/rejeitar/`, {
                motivo: motivoRejeicao
            });
            toast.success('Entregador rejeitado');
            fetchData();
            setSelectedEntregador(null);
            setMotivoRejeicao('');
        } catch (error) {
            toast.error('Erro ao rejeitar entregador');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-gray-900 mb-2">Dashboard Administrativo</h1>
                    <p className="text-gray-600">Gestão completa da plataforma</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setSelectedTab('overview')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${selectedTab === 'overview'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        📊 Visão Geral
                    </button>
                    <button
                        onClick={() => setSelectedTab('entregadores')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all relative ${selectedTab === 'entregadores'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        🏍️ Aprovações
                        {entregadoresPendentes.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {entregadoresPendentes.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setSelectedTab('financeiro')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${selectedTab === 'financeiro'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        💰 Financeiro
                    </button>
                </div>

                {/* OVERVIEW TAB */}
                {selectedTab === 'overview' && stats && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Users size={32} className="text-blue-600" />
                                    <span className="text-3xl font-black text-gray-900">{stats.total_usuarios}</span>
                                </div>
                                <p className="text-gray-600 font-medium">Total de Usuários</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Building2 size={32} className="text-green-600" />
                                    <span className="text-3xl font-black text-gray-900">{stats.total_farmacias}</span>
                                </div>
                                <p className="text-gray-600 font-medium">Farmácias Ativas</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <Bike size={32} className="text-purple-600" />
                                    <span className="text-3xl font-black text-gray-900">{stats.total_entregadores}</span>
                                </div>
                                <p className="text-gray-600 font-medium">Entregadores Ativos</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <ShoppingCart size={32} className="text-orange-600" />
                                    <span className="text-3xl font-black text-gray-900">{stats.total_pedidos}</span>
                                </div>
                                <p className="text-gray-600 font-medium">Total de Pedidos</p>
                            </div>
                        </div>

                        {/* Alertas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {stats.entregadores_pendentes > 0 && (
                                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertCircle size={24} className="text-yellow-600" />
                                        <h3 className="font-bold text-yellow-900">Entregadores Pendentes</h3>
                                    </div>
                                    <p className="text-yellow-800 text-2xl font-black">{stats.entregadores_pendentes}</p>
                                    <button
                                        onClick={() => setSelectedTab('entregadores')}
                                        className="mt-3 text-sm text-yellow-700 hover:underline font-bold"
                                    >
                                        Ver agora →
                                    </button>
                                </div>
                            )}

                            {stats.pedidos_pendentes > 0 && (
                                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Clock size={24} className="text-blue-600" />
                                        <h3 className="font-bold text-blue-900">Pedidos Pendentes</h3>
                                    </div>
                                    <p className="text-blue-800 text-2xl font-black">{stats.pedidos_pendentes}</p>
                                </div>
                            )}

                            {stats.farmacias_pendentes > 0 && (
                                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Building2 size={24} className="text-green-600" />
                                        <h3 className="font-bold text-green-900">Farmácias Pendentes</h3>
                                    </div>
                                    <p className="text-green-800 text-2xl font-black">{stats.farmacias_pendentes}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ENTREGADORES TAB */}
                {selectedTab === 'entregadores' && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-2xl font-bold mb-6">Aprovar Cadastros de Entregadores</h2>

                        {entregadoresPendentes.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">Nenhum entregador pendente de aprovação</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {entregadoresPendentes.map((entregador) => (
                                    <div key={entregador.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {entregador.usuario.first_name} {entregador.usuario.last_name}
                                                </h3>
                                                <p className="text-gray-600">{entregador.usuario.email}</p>
                                                <p className="text-gray-600">{entregador.usuario.telefone}</p>
                                                <p className="text-sm text-purple-600 font-bold mt-2">
                                                    {entregador.tipo_veiculo}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedEntregador(entregador)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                                            >
                                                <Eye size={20} />
                                                Ver Detalhes
                                            </button>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleAprovarEntregador(entregador.id)}
                                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={20} />
                                                APROVAR
                                            </button>
                                            <button
                                                onClick={() => setSelectedEntregador(entregador)}
                                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={20} />
                                                REJEITAR
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* FINANCEIRO TAB */}
                {selectedTab === 'financeiro' && stats && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-xl shadow-2xl p-8">
                                <DollarSign size={48} className="mb-4" />
                                <h3 className="text-lg opacity-90 mb-2">Receita Total</h3>
                                <p className="text-4xl font-black">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.receita_total)}
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl shadow-2xl p-8">
                                <TrendingUp size={48} className="mb-4" />
                                <h3 className="text-lg opacity-90 mb-2">Comissão da Plataforma (10%)</h3>
                                <p className="text-4xl font-black">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(stats.comissao_plataforma)}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-xl font-bold mb-4">Relatórios Financeiros</h3>
                            <div className="space-y-3">
                                <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-all text-left flex items-center justify-between">
                                    <span className="font-bold">Transações do Mês</span>
                                    <FileText size={20} />
                                </button>
                                <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-all text-left flex items-center justify-between">
                                    <span className="font-bold">Comissões por Farmácia</span>
                                    <BarChart3 size={20} />
                                </button>
                                <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-all text-left flex items-center justify-between">
                                    <span className="font-bold">Histórico de Pagamentos</span>
                                    <Package size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalhes do Entregador */}
            {selectedEntregador && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
                        <h2 className="text-2xl font-bold mb-6">Detalhes do Entregador</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {selectedEntregador.foto_perfil && (
                                <div>
                                    <p className="font-bold mb-2">Foto de Perfil:</p>
                                    <img src={selectedEntregador.foto_perfil} alt="Perfil" className="w-full rounded-lg" />
                                </div>
                            )}

                            {selectedEntregador.foto_documento && (
                                <div>
                                    <p className="font-bold mb-2">Documento:</p>
                                    <img src={selectedEntregador.foto_documento} alt="Documento" className="w-full rounded-lg" />
                                </div>
                            )}

                            {selectedEntregador.foto_veiculo && (
                                <div>
                                    <p className="font-bold mb-2">Foto do Veículo:</p>
                                    <img src={selectedEntregador.foto_veiculo} alt="Veículo" className="w-full rounded-lg" />
                                </div>
                            )}

                            {selectedEntregador.documento_veiculo && (
                                <div>
                                    <p className="font-bold mb-2">Documento do Veículo:</p>
                                    <img src={selectedEntregador.documento_veiculo} alt="Doc Veículo" className="w-full rounded-lg" />
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="block font-bold mb-2">Motivo da Rejeição (se aplicável):</label>
                            <textarea
                                value={motivoRejeicao}
                                onChange={(e) => setMotivoRejeicao(e.target.value)}
                                className="w-full p-3 border rounded-lg"
                                rows={3}
                                placeholder="Descreva o motivo..."
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setSelectedEntregador(null);
                                    setMotivoRejeicao('');
                                }}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-100"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => handleRejeitarEntregador(selectedEntregador.id)}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
                            >
                                Rejeitar
                            </button>
                            <button
                                onClick={() => handleAprovarEntregador(selectedEntregador.id)}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                            >
                                Aprovar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
