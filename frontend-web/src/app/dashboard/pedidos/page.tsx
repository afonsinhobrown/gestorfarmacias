'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/utils';
import { Eye, Search } from 'lucide-react';

interface Pedido {
    id: number;
    numero_pedido: string;
    farmacia_nome: string;
    status: string;
    data_criacao: string;
    total: string; // vem como string do DRF DecimalField
    total_itens: number;
    pago: boolean;
}

export default function PedidosPage() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPedidos();
        }, 300);
        return () => clearTimeout(timer);
    }, [busca, statusFiltro]);

    const fetchPedidos = async () => {
        setLoading(true);
        try {
            let url = `/pedidos/?search=${busca}`;
            if (statusFiltro) url += `&status=${statusFiltro}`;
            const response = await api.get(url);
            setPedidos(response.data.results || []);
        } catch (error) {
            console.error('Erro ao buscar pedidos', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMADO': return 'bg-blue-100 text-blue-800';
            case 'ENTREGUE': return 'bg-green-100 text-green-800';
            case 'CANCELADO': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Faturação e Pedidos</h1>
                    <p className="text-gray-500 text-sm">Gerencie vendas, faturas e o histórico de transações.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por fatura ou cliente..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        />
                    </div>

                    <select
                        value={statusFiltro}
                        onChange={(e) => setStatusFiltro(e.target.value)}
                        className="p-2 border border-gray-200 rounded-xl bg-white text-sm font-bold outline-none cursor-pointer"
                    >
                        <option value="">TODOS STATUS</option>
                        <option value="PENDENTE">PENDENTES</option>
                        <option value="ENTREGUE">ENTREGUES</option>
                        <option value="CANCELADO">CANCELADOS</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fatura / Pedido</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Emissão</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Líquido</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pagamento</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && pedidos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-4 text-sm font-medium text-gray-500 uppercase tracking-widest">Sincronizando faturas...</p>
                                    </td>
                                </tr>
                            ) : pedidos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <p className="text-gray-400 font-bold">Nenhuma fatura encontrada com estes critérios.</p>
                                    </td>
                                </tr>
                            ) : (
                                pedidos.map((pedido) => (
                                    <tr key={pedido.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-blue-600 text-sm">{pedido.numero_pedido}</span>
                                                <span className="text-xs text-gray-500 font-medium">{pedido.total_itens} itens comercializados</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            {formatDate(pedido.data_criacao)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${statusColor(pedido.status)}`}>
                                                {pedido.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-gray-900">
                                            {formatPrice(parseFloat(pedido.total))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[10px] font-black rounded uppercase ${pedido.pago ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {pedido.pago ? 'COMPROVADO' : 'PENDENTE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {pedido.receita_medica && (
                                                    <a
                                                        href={pedido.receita_medica}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-all"
                                                        title="Ver receita médica"
                                                    >
                                                        📄 Receita
                                                    </a>
                                                )}
                                                <Link
                                                    href={`/dashboard/pedidos/${pedido.id}`}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 group-hover:bg-blue-600 group-hover:text-white text-gray-600 rounded-lg text-xs font-bold transition-all"
                                                >
                                                    <Eye size={14} /> DETALHES
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
