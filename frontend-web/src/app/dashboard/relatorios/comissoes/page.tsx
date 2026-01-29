'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Users, BarChart3, Calendar, Award, TrendingUp, Search } from 'lucide-react';
import { toast } from 'sonner';

interface VendedorComissao {
    vendedor_id: number;
    nome: string;
    total_vendas: number;
    quantidade_vendas: number;
    comissao: number;
    percentual: number;
}

export default function ComissoesPage() {
    const [relatorio, setRelatorio] = useState<VendedorComissao[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    useEffect(() => {
        fetchComissoes();
    }, []);

    const fetchComissoes = async () => {
        setLoading(true);
        try {
            let url = '/pedidos/comissoes/';
            const params = new URLSearchParams();
            if (dataInicio) params.append('data_inicio', dataInicio);
            if (dataFim) params.append('data_fim', dataFim);

            const res = await api.get(`${url}?${params.toString()}`);
            setRelatorio(res.data.vendedores || []);
        } catch (error: any) {
            console.error('Erro ao buscar comissões:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Erro ao carregar relatório de comissões.';
            toast.error(errorMsg);

            // Se for erro de usuário sem farmácia, mostrar mensagem específica
            if (errorMsg.includes('farmácia')) {
                toast.error('Configure sua farmácia primeiro em /register/farmacia', { duration: 5000 });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestão de Comissões</h1>
                    <p className="text-sm text-gray-500 font-medium">Acompanhe a performance da equipe e o cálculo de incentivos (2% sobre vendas pagas).</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Período de Início</label>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Período de Fim</label>
                        <input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-bold transition-all"
                        />
                    </div>
                </div>
                <button
                    onClick={fetchComissoes}
                    className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all h-[42px]"
                >
                    Gerar Relatório
                </button>
            </div>

            {/* Rankings / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                        Calculando performance...
                    </div>
                ) : relatorio.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed text-gray-400 font-bold">
                        Nenhuma venda registrada para comissão no período.
                    </div>
                ) : (
                    relatorio.map((v, idx) => (
                        <div key={v.vendedor_id} className={`bg-white p-6 rounded-3xl shadow-sm border transition-all hover:shadow-xl ${idx === 0 ? 'border-amber-200' : 'border-gray-100'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${idx === 0 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {idx === 0 ? <Award size={24} /> : <Users size={24} />}
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {idx === 0 ? 'TOP PERFORMANCE' : `#${idx + 1}`}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-gray-900 mb-1">{v.nome}</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase">{v.quantidade_vendas} vendas concluídas</p>

                            <div className="my-6 space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Volume Total</span>
                                    <span className="font-bold text-gray-900">{formatPrice(v.total_vendas)}</span>
                                </div>
                                <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${idx === 0 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                        style={{ width: `${(v.total_vendas / relatorio[0].total_vendas) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className={`mt-4 p-4 rounded-2xl flex justify-between items-center ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-gray-900 text-white'}`}>
                                <div>
                                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">Comissão a Pagar</p>
                                    <p className="text-xl font-black">{formatPrice(v.comissao)}</p>
                                </div>
                                <TrendingUp size={24} className="opacity-20" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                <div className="flex gap-4">
                    <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-emerald-900 uppercase tracking-tighter">Resumo de Incentivos</h4>
                        <p className="text-sm text-emerald-700 font-medium">As comissões são calculadas apenas sobre vendas com status ENTREGUE e PAGAMENTO COMPROVADO. Devoluções e cancelamentos não geram bônus.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
