'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { Search, Calendar, Filter, X, Trash2, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Resumo {
    total_faturado: number;
    total_lucro: number;
    margem_media: number;
}

interface VendaExtrato {
    id: number;
    numero: string;
    data: string;
    cliente: string;
    forma_pagamento: string;
    total: number;
    lucro: number;
    margem: number;
}

export default function ExtratoVendasPage() {
    const [vendas, setVendas] = useState<VendaExtrato[]>([]);
    const [resumo, setResumo] = useState<Resumo | null>(null);
    const [loading, setLoading] = useState(true);
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [anulando, setAnulando] = useState<number | null>(null);

    useEffect(() => {
        fetchExtrato();
    }, []);

    const fetchExtrato = async () => {
        setLoading(true);
        try {
            let url = '/pedidos/extrato/';
            const params = new URLSearchParams();
            if (dataInicio) params.append('data_inicio', dataInicio);
            if (dataFim) params.append('data_fim', dataFim);

            const res = await api.get(`${url}?${params.toString()}`);
            setVendas(res.data.vendas || []);
            setResumo(res.data.resumo || null);
        } catch (error) {
            console.error('Erro ao buscar extrato:', error);
            toast.error('Erro ao carregar extrato de vendas.');
        } finally {
            setLoading(false);
        }
    };

    const anularVenda = async (id: number, numero: string) => {
        if (!confirm(`Tem certeza que deseja ANULAR a venda ${numero}?\nIsso devolverá os itens ao estoque.`)) return;

        setAnulando(id);
        try {
            await api.post(`/pedidos/${id}/anular/`, { motivo: 'Anulação via Extrato' });
            toast.success(`Venda ${numero} anulada com sucesso!`);
            fetchExtrato();
        } catch (error: any) {
            toast.error(error.response?.data?.erro || 'Erro ao anular venda.');
        } finally {
            setAnulando(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Extrato de Vendas (Primavera Style)</h1>
                    <p className="text-sm text-gray-500 font-medium">Relatório detalhado de faturamento e margens de lucro por período.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-xs font-bold hover:bg-gray-50 shadow-sm transition-all">
                        <Printer size={16} /> IMPRIMIR
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                        <Download size={16} /> EXPORTAR
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data Início</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data Fim</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="date"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all"
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchExtrato}
                    className="px-8 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all h-[42px] flex items-center gap-2"
                >
                    <Filter size={16} /> Aplicar Filtros
                </button>
            </div>

            {/* Resumo */}
            {resumo && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Comercializado</p>
                        <p className="text-2xl font-black text-gray-900">{formatPrice(resumo.total_faturado)}</p>
                        <div className="mt-2 text-xs font-bold text-green-600 flex items-center gap-1">
                            BRUTO NO PERÍODO
                        </div>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Lucro Real Estimado</p>
                        <p className="text-2xl font-black text-white">{formatPrice(resumo.total_lucro)}</p>
                        <div className="mt-2 text-xs font-bold text-blue-400 flex items-center gap-1 animate-pulse">
                            LUCRO SOBRE CUSTO
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Margem Média</p>
                        <p className="text-2xl font-black text-gray-900">{resumo.margem_media}%</p>
                        <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${resumo.margem_media}%` }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabela de Vendas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Doc / Data</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Cliente / Pagamento</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Valor Venda</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Lucro</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Margem</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-4 text-sm font-medium text-gray-500 uppercase tracking-widest">Gerando extrato...</p>
                                    </td>
                                </tr>
                            ) : vendas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <Search size={48} className="mx-auto text-gray-200 mb-4" />
                                        <p className="text-gray-400 font-bold">Nenhuma venda registrada no período selecionado.</p>
                                    </td>
                                </tr>
                            ) : (
                                vendas.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 text-sm">#{v.numero}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{formatDate(v.data)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-700 text-xs">{v.cliente}</span>
                                                <span className="text-[10px] text-blue-600 font-black tracking-widest">{v.forma_pagamento}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-black text-sm text-gray-900">{formatPrice(v.total)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-sm text-green-600">+{formatPrice(v.lucro)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg">
                                                {v.margem}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => anularVenda(v.id, v.numero)}
                                                    disabled={anulando === v.id}
                                                    className="p-2 text-red-100 group-hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter"
                                                    title="Anular Venda"
                                                >
                                                    <Trash2 size={16} /> {anulando === v.id ? 'ANULANDO...' : 'ANULAR'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="print:hidden bg-blue-50 border-2 border-blue-100 p-6 rounded-2xl">
                <h4 className="text-sm font-black text-blue-700 uppercase tracking-widest mb-1">💡 Dica do Consultor</h4>
                <p className="text-xs text-blue-600 font-medium">Este relatório é usado para conferência diária (fecho de caixa). Os lucros são calculados baseados no preço de custo cadastrado no estoque no momento da venda.</p>
            </div>
        </div>
    );
}
