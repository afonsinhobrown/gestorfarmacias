'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Package, Search, ArrowUpRight, ArrowDownLeft, RefreshCcw, History } from 'lucide-react';

interface Movimentacao {
    id: number;
    data_movimentacao: string;
    produto_nome: string;
    local: string;
    tipo: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA' | 'AJUSTE';
    quantidade: number;
    quantidade_anterior: number;
    quantidade_nova: number;
    motivo: string;
    usuario_nome: string;
}

export default function KardexPage() {
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    useEffect(() => {
        fetchKardex();
    }, []);

    const fetchKardex = async () => {
        setLoading(true);
        try {
            const res = await api.get('/produtos/kardex/');
            setMovimentacoes(res.data.results || res.data);
        } catch (error) {
            console.error('Erro ao buscar Kardex:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = movimentacoes.filter(m =>
        m.produto_nome.toLowerCase().includes(busca.toLowerCase()) ||
        m.motivo.toLowerCase().includes(busca.toLowerCase())
    );

    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'ENTRADA': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1 w-fit"><ArrowUpRight size={10} /> ENTRADA</span>;
            case 'SAIDA': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1 w-fit"><ArrowDownLeft size={10} /> SAÍDA</span>;
            case 'TRANSFERENCIA': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1 w-fit"><RefreshCcw size={10} /> TRANSFERÊNCIA</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-[10px] font-black w-fit">{tipo}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Histórico de Movimentações (Kardex)</h1>
                    <p className="text-sm text-gray-500">Acompanhe todas as entradas, saídas e transferências de estoque.</p>
                </div>
                <button onClick={fetchKardex} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <History className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-4">
                <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 flex-1 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <Search size={18} className="text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Filtrar por nome do produto ou motivo..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-full"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Data/Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Produto</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Local</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Qtd</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Saldo Final</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Motivo</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Usuário</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">Carregando movimentações...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">Nenhuma movimentação registrada.</td>
                                </tr>
                            ) : (
                                filtered.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-medium text-gray-600">
                                            {format(new Date(m.data_movimentacao), 'dd/MM/yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            {m.produto_nome}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${m.local === 'LOJA' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {m.local}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getTipoBadge(m.tipo)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {m.tipo === 'SAIDA' ? '-' : '+'}{m.quantidade}
                                        </td>
                                        <td className="px-6 py-4 font-black text-gray-900 bg-gray-50/50">
                                            {m.quantidade_nova}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                                            {m.motivo}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                                            {m.usuario_nome || 'Sistema'}
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
