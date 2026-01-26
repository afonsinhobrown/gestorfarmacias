'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Download,
    Calendar as CalendarIcon,
    Filter,
    DollarSign,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Landmark
} from 'lucide-react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function RelatoriosPage() {
    const [loading, setLoading] = useState(true);
    const [dias, setDias] = useState(30);
    const [report, setReport] = useState<any>(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/farmacias/dashboard/report/?dias=${dias}`);
            setReport(res.data);
        } catch (error) {
            console.error("Erro ao carregar relatório:", error);
            // toast.error("Erro ao carregar dados financeiros."); // Silenciar erro visual se for 500 temporário
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [dias]);

    const handleDownloadPDF = async () => {
        try {
            toast.info('Gerando relatório PDF...');

            const response = await api.get('/pedidos/relatorios/vendas-pdf/', {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_fiscal_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Relatório PDF baixado com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.error('Erro ao gerar relatório PDF');
        }
    };

    if (loading && !report) return <div className="p-10 text-center">Gerando relatório detalhado...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 print:p-0 pb-10">
            {/* Header Relatório */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <BarChart3 className="text-blue-600" size={32} />
                        Gestão Financeira & Fiscal
                    </h1>
                    <p className="text-gray-500 font-medium">Fluxo de caixa completo: Vendas, Despesas e Impostos.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
                        {[7, 30, 90].map((d) => (
                            <button
                                key={d}
                                onClick={() => setDias(d)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dias === d ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {d} DIAS
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                        <Download size={18} /> EXPORTAR PDF
                    </button>
                </div>
            </div>

            {/* Cards de Resumo */}
            {/* Ajuste de grid para 5 colunas em telas larges se couber, ou wrap inteligente */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

                {/* 1. Faturamento */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 group hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-full">Receitas</span>
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Faturamento Bruto</p>
                    <h2 className="text-3xl font-black text-gray-900 mt-1">{formatPrice(report?.fluxo_caixa?.total_receita || 0)}</h2>
                </div>

                {/* 2. IVA (NOVO) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 group hover:border-orange-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                            <Landmark size={24} />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-full">{report?.fluxo_caixa?.taxa_iva}% IVA</span>
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Impostos (Estimado)</p>
                    <h2 className="text-2xl font-black text-orange-600 mt-2">{formatPrice(report?.fluxo_caixa?.total_iva || 0)}</h2>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1" title="Valor incluso no faturamento">Incluso no Bruto</p>
                </div>

                {/* 3. Despesas */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 group hover:border-red-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                            <ArrowDownRight size={24} />
                        </div>
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Despesas & Saídas</p>
                    <h2 className="text-3xl font-black text-red-600 mt-1">{formatPrice(report?.fluxo_caixa?.total_despesa || 0)}</h2>
                    <p className="text-[10px] text-gray-400 mt-1">Operacional e Custos</p>
                </div>

                {/* 4. Lucro */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 group hover:border-green-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Lucro (Caixa)</p>
                    <h2 className={`text-3xl font-black mt-1 ${(report?.fluxo_caixa?.lucro_liquido || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>{formatPrice(report?.fluxo_caixa?.lucro_liquido || 0)}</h2>
                    <p className="text-[10px] text-gray-400 mt-1">Bruto - Despesas</p>
                </div>

                {/* 5. Transações */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                            <PieChart size={24} />
                        </div>
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Transações</p>
                    <h2 className="text-3xl font-black text-gray-900 mt-1">{report?.transacoes?.length || 0}</h2>
                    <p className="text-[10px] text-gray-400 mt-1">Movimentos totais</p>
                </div>
            </div>

            {/* Gráficos e Distribuição */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico de Barras */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-gray-800 mb-8 uppercase tracking-tighter">Fluxo de Caixa Diário</h3>
                    <div className="h-64 flex items-end gap-1.5 md:gap-3">
                        {report?.grafico_dias?.map((dia: any, idx: number) => {
                            const max = Math.max(...report.grafico_dias.map((d: any) => Math.max(d.receita, d.despesa)));
                            const heightReceita = max > 0 ? (dia.receita / max) * 100 : 0;
                            const heightDespesa = max > 0 ? (dia.despesa / max) * 100 : 0;

                            return (
                                <div key={idx} className="flex-1 flex flex-col justify-end gap-1 group relative h-full">
                                    <div className="w-full flex gap-0.5 items-end h-full">
                                        <div style={{ height: `${heightReceita}%` }} className="flex-1 bg-green-200 rounded-t-sm hover:bg-green-500 transition-colors" title={`Receita: ${formatPrice(dia.receita)}`}></div>
                                        <div style={{ height: `${heightDespesa}%` }} className="flex-1 bg-red-200 rounded-t-sm hover:bg-red-500 transition-colors" title={`Despesa: ${formatPrice(dia.despesa)}`}></div>
                                    </div>
                                    <span className="text-[8px] font-bold text-gray-400 mt-2 rotate-45 md:rotate-0 text-center">{dia.data}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Distribuição Receita */}
                <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl flex flex-col">
                    <h3 className="text-lg font-black mb-8 uppercase tracking-tighter text-blue-400">Origem de Vendas</h3>
                    <div className="space-y-6 flex-1">
                        {report?.balanco_pagamento?.map((item: any, idx: number) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : 'bg-red-500'
                                            }`}></div>
                                        {item.forma_pagamento}
                                    </span>
                                    <span>{report?.fluxo_caixa?.total_receita ? Math.round((item.total / report.fluxo_caixa.total_receita) * 100) : 0}%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: `${report?.fluxo_caixa?.total_receita ? (item.total / report.fluxo_caixa.total_receita) * 100 : 0}%` }}
                                        className={`h-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 font-black">
                                    <span>{item.quantidade} PEDIDOS</span>
                                    <span>{formatPrice(item.total)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-800 text-center">
                        <p className="text-xs text-gray-500 font-bold">RELATÓRIO GERADO EM</p>
                        <p className="text-sm font-black">{new Date().toLocaleString('pt-MZ')}</p>
                    </div>
                </div>
            </div>

            {/* Listagem de Movimentos */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">
                        Fluxo de Caixa Detalhado
                    </h3>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {report?.transacoes?.length || 0} movimentos
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-3 px-4 text-xs font-black text-gray-500 uppercase">Data</th>
                                <th className="text-left py-3 px-4 text-xs font-black text-gray-500 uppercase">Descrição</th>
                                <th className="text-left py-3 px-4 text-xs font-black text-gray-500 uppercase">Categoria</th>
                                <th className="text-center py-3 px-4 text-xs font-black text-gray-500 uppercase">Tipo</th>
                                <th className="text-right py-3 px-4 text-xs font-black text-gray-500 uppercase">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {report?.transacoes?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-400">Nenhuma movimentação no período.</td>
                                </tr>
                            ) : (
                                report?.transacoes?.map((t: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-sm text-gray-600 font-medium">
                                            {formatDate(t.data)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-sm font-bold text-gray-800">{t.descricao}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{t.detalhe}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">{t.categoria}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {t.tipo === 'ENTRADA' ? (
                                                <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded uppercase">ENTRADA</span>
                                            ) : (
                                                <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${t.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.tipo}
                                                </span>
                                            )}
                                        </td>
                                        <td className={`py-3 px-4 text-right font-black text-sm ${t.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPrice(t.valor)}
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

function formatDate(dateString: string) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
        return dateString;
    }
}
