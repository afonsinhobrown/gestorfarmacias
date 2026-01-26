'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { ShoppingBag, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function FarmaciaDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await api.get('/farmacias/dashboard/stats/');
                setStats(res.data);
            } catch (error) {
                console.error("Erro ao carregar dashboard:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const cards = [
        {
            title: 'Vendas Hoje',
            value: loading ? '...' : formatPrice(stats?.vendas_hoje || 0),
            icon: TrendingUp,
            color: 'bg-green-500',
            description: 'Total faturado no dia'
        },
        {
            title: 'Pedidos Pendentes',
            value: loading ? '...' : (stats?.pedidos_pendentes || 0).toString(),
            icon: ShoppingBag,
            color: 'bg-blue-500',
            description: 'Aguardando processamento'
        },
        {
            title: 'Estoque Crítico',
            value: loading ? '...' : ((stats?.estoque_critico || 0) + (stats?.ruptura_stock || 0)).toString(),
            icon: AlertTriangle,
            color: 'bg-yellow-500',
            description: 'Produtos abaixo do mínimo ou ruptura'
        },
        {
            title: 'Entregas Concluídas',
            value: loading ? '...' : (stats?.entregas_concluidas || 0).toString(),
            icon: CheckCircle,
            color: 'bg-indigo-500',
            description: 'Últimas 24 horas'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500">Bem-vindo de volta, {user?.first_name || 'Farmácia'}!</p>
                </div>
                {!loading && (
                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ticket Médio Hoje</p>
                        <p className="text-xl font-black text-blue-600">{formatPrice(stats?.ticket_medio_hoje || 0)}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{card.title}</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{card.value}</h3>
                            <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                        </div>
                        <div className={`p-3 rounded-lg text-white ${card.color}`}>
                            <card.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vendas Recentes */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center justify-between">
                        Últimos Pedidos
                        <span className="text-xs font-normal text-blue-600 hover:underline cursor-pointer">Ver todos</span>
                    </h3>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-gray-400 border-b">
                                    <th className="pb-3 font-medium">Fatura</th>
                                    <th className="pb-3 font-medium">Cliente</th>
                                    <th className="pb-3 font-medium">Valor</th>
                                    <th className="pb-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {stats?.vendas_recentes?.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 font-bold text-blue-600">{v.numero}</td>
                                        <td className="py-3 text-gray-700">{v.cliente}</td>
                                        <td className="py-3 font-black text-gray-900">{formatPrice(v.total)}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${v.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' :
                                                v.status === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {v.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats?.vendas_recentes || stats.vendas_recentes.length === 0) && !loading && (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-gray-400">Nenhuma venda registrada hoje.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mensagens & Avisos */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Mensagens & Alertas Críticos</h3>
                    <div className="flex flex-col gap-3">
                        {stats?.avisos?.length > 0 ? (
                            stats.avisos.map((aviso: any) => (
                                <div key={aviso.id} className={`p-4 rounded-xl text-sm border-2 flex gap-3 ${aviso.tipo === 'RUPTURA' || aviso.tipo === 'EXPIRADO'
                                    ? 'bg-red-50 border-red-100 text-red-800'
                                    : 'bg-amber-50 border-amber-100 text-amber-800'
                                    }`}>
                                    <div className="mt-0.5">
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div>
                                        <p className="font-black uppercase text-[10px] tracking-widest mb-1 opacity-70">{aviso.tipo}</p>
                                        <p className="font-bold mb-1">{aviso.titulo}</p>
                                        <p className="opacity-80 text-xs leading-relaxed">{aviso.mensagem}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center text-gray-400">
                                <CheckCircle size={48} className="mx-auto mb-4 opacity-10" />
                                <p>Tudo em ordem! Sem avisos críticos.</p>
                            </div>
                        )}

                        {!loading && stats?.avisos?.length > 0 && (
                            <button className="mt-2 text-center text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest">
                                Ver todas as notificações
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
