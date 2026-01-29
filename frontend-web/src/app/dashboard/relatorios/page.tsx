'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BarChart3,
    PieChart as PieChartIcon,
    TrendingUp,
    Download,
    Calendar as CalendarIcon,
    Filter,
    X,
    DollarSign,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Landmark
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    Legend,
    PieChart,
    Pie
} from 'recharts';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function RelatoriosPage() {
    const [loading, setLoading] = useState(true);
    const [dias, setDias] = useState(30);
    const [report, setReport] = useState<any>(null);
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = `/farmacias/dashboard/report/?periodo=${dias}`;
            if (dataInicio && dataFim) {
                url = `/farmacias/dashboard/report/?data_inicio=${dataInicio}&data_fim=${dataFim}`;
            }
            const res = await api.get(url);
            setReport(res.data);
        } catch (error) {
            console.error("Erro ao carregar relatório:", error);
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

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Filtros de Data Personalizados */}
                    <div className="flex items-center gap-2 bg-white border border-gray-100 p-2 rounded-xl shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase px-1">Início</span>
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => {
                                    setDataInicio(e.target.value);
                                    setDias(0); // Resetar dias pré-definidos
                                }}
                                className="text-xs font-bold border-none focus:ring-0 p-0 h-6"
                            />
                        </div>
                        <div className="w-px h-8 bg-gray-100 mx-1"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase px-1">Fim</span>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={(e) => {
                                    setDataFim(e.target.value);
                                    setDias(0); // Resetar dias pré-definidos
                                }}
                                className="text-xs font-bold border-none focus:ring-0 p-0 h-6"
                            />
                        </div>
                        {(dataInicio && dataFim) && (
                            <button
                                onClick={fetchReport}
                                className="ml-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                title="Aplicar Filtro"
                            >
                                <Filter size={14} />
                            </button>
                        )}
                        {(dataInicio || dataFim) && (
                            <button
                                onClick={() => {
                                    setDataInicio('');
                                    setDataFim('');
                                    setDias(30);
                                }}
                                className="ml-1 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                title="Limpar Filtro"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex bg-white border border-gray-100 p-1 rounded-xl shadow-sm h-[52px] items-center">
                        {[7, 30, 90].map((d) => (
                            <button
                                key={d}
                                onClick={() => {
                                    setDataInicio('');
                                    setDataFim('');
                                    setDias(d);
                                }}
                                className={`px-4 py-2 h-full rounded-lg text-xs font-bold transition-all ${dias === d ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {d}D
                            </button>
                        ))}
                    </div>
                    <Link
                        href="/dashboard/vendas/extrato"
                        className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-3 rounded-xl font-bold transition-all"
                    >
                        VER EXTRATO
                    </Link>
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
                            <PieChartIcon size={24} />
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
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={report?.grafico_dias || []}>
                                <defs>
                                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="data"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                    tickFormatter={(val) => `MT ${val / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [formatPrice(value), '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="receita"
                                    name="Receita"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorReceita)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="despesa"
                                    name="Despesa"
                                    stroke="#dc2626"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorDespesa)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Formas de Pagamento */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-black text-gray-800 mb-6 uppercase tracking-tighter text-center lg:text-left">Distribuição de Receita</h3>

                    <div className="h-[250px] w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={report?.balanco_pagamento || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total"
                                    nameKey="forma_pagamento"
                                >
                                    {(report?.balanco_pagamento || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={['#2563eb', '#10b981', '#f59e0b', '#dc2626', '#8b5cf6'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatPrice(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-3 mt-4">
                        {(report?.balanco_pagamento || []).map((item: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-gray-700 uppercase">
                                    <span className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500'][idx % 5]}`}></div>
                                        {item.forma_pagamento}
                                    </span>
                                    <span>{report?.fluxo_caixa?.total_receita ? Math.round((item.total / report.fluxo_caixa.total_receita) * 100) : 0}%</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 font-black">
                                    <span>{item.qtd} PEDIDOS</span>
                                    <span>{formatPrice(item.total)}</span>
                                </div>
                            </div>
                        ))}
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
            {/* NOVAS SEÇÕES DE ANÁLISE (PCA) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Mais Vendidos */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-600" />
                        Produtos Mais Vendidos
                    </h3>
                    <div className="space-y-4">
                        {report?.mais_vendidos?.map((prod: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                                <div>
                                    <p className="font-bold text-gray-900">{prod.produto__nome}</p>
                                    <p className="text-xs text-gray-500 uppercase font-black">{prod.total_qtd} unidades vendidas</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-blue-600">{formatPrice(prod.total_venda)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Maiores Margens */}
                <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-sm">
                    <h3 className="text-lg font-black text-blue-400 uppercase tracking-tighter mb-6 flex items-center gap-2">
                        <DollarSign size={20} />
                        Maior Margem de Lucro
                    </h3>
                    <div className="space-y-4">
                        {report?.maiores_margens?.map((prod: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-gray-800 rounded-2xl border border-gray-700">
                                <div>
                                    <p className="font-bold">{prod.nome}</p>
                                    <p className="text-xs text-gray-400">Margem: {prod.margem_percentual.toFixed(1)}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-bold">Custo: {formatPrice(prod.preco_custo)}</p>
                                    <p className="font-black text-green-400">Venda: {formatPrice(prod.preco_venda)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Vendas por Vendedor */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
                        <Filter size={20} className="text-purple-600" />
                        Desempenho por Vendedor
                    </h3>
                    <div className="space-y-4">
                        {report?.vendas_vendedor?.map((v: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-purple-50 rounded-2xl">
                                <div>
                                    <p className="font-bold text-gray-900">{v.vendedor__first_name || 'Sistema'} {v.vendedor__last_name || ''}</p>
                                    <p className="text-xs text-purple-600 font-black">{v.count} vendas realizadas</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-gray-900">{formatPrice(v.total_vendas)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Menos Vendidos (Atenção) */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
                        <ArrowDownRight size={20} className="text-red-500" />
                        Atenção: Menos Vendidos
                    </h3>
                    <div className="space-y-2">
                        {report?.menos_vendidos?.map((prod: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0">
                                <span className="text-sm font-medium text-gray-700">{prod.produto__nome}</span>
                                <span className="text-xs font-black text-red-400 bg-red-50 px-2 py-1 rounded-full">{prod.total_qtd} unidades</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
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
