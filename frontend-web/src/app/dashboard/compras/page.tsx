'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
    Package,
    Truck,
    Plus,
    Search,
    FileText,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    ArrowRight,
    Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface OrdemCompra {
    id: number;
    codigo: string;
    fornecedor_nome: string;
    status: string;
    status_display: string;
    data_emissao: string;
    valor_total: string;
}

interface Sugestao {
    id: number;
    nome: string;
    vendido_30d: number;
    stock_atual: number;
    sugestao_compra: number;
}

export default function ComprasPage() {
    const [ordens, setOrdens] = useState<OrdemCompra[]>([]);
    const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSugestoes, setShowSugestoes] = useState(false);

    useEffect(() => {
        carregarOrdens();
    }, []);

    const carregarOrdens = async () => {
        try {
            const res = await api.get('/compras/ordens/');
            setOrdens(res.data.results || res.data);
        } catch (error) {
            toast.error('Erro ao carregar ordens de compra');
        } finally {
            setLoading(false);
        }
    };

    const carregarSugestoes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/compras/ordens/sugerir_compras/');
            setSugestoes(res.data);
            setShowSugestoes(true);
            toast.success('Análise de reposição concluída!');
        } catch (error) {
            toast.error('Erro ao gerar sugestões');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header com Lógica de Inteligência */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-3">
                        <Truck size={36} className="text-blue-600" /> Ciclo de Compras
                    </h1>
                    <p className="text-gray-500 font-medium">Gestão profissional de stock, reposição e fornecedores.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={carregarSugestoes}
                        className="px-6 py-3 bg-blue-50 text-blue-700 font-black text-xs rounded-xl hover:bg-blue-100 transition-all border border-blue-200 flex items-center gap-2 uppercase tracking-widest group"
                    >
                        <Sparkles size={18} className="group-hover:rotate-12 transition-transform" /> Sugestão IA
                    </button>
                    <button className="px-6 py-3 bg-blue-600 text-white font-black text-xs rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest">
                        <Plus size={18} /> Nova Ordem
                    </button>
                </div>
            </div>

            {/* Sugestões de Reposição - DERRUBANDO PRIMAVERA */}
            {showSugestoes && (
                <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden animate-in slide-in-from-top duration-500">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles size={150} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Sugestões de Reposição Inteligente</h2>
                            <button onClick={() => setShowSugestoes(false)} className="text-blue-200 hover:text-white">Ocultar</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sugestoes.map(s => (
                                <div key={s.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all">
                                    <h4 className="font-black text-sm mb-2 uppercase">{s.nome}</h4>
                                    <div className="flex justify-between items-end">
                                        <div className="text-[10px] space-y-1">
                                            <p className="font-bold opacity-70">VENDIDO (30D): <span className="text-blue-200">{s.vendido_30d} UN</span></p>
                                            <p className="font-bold opacity-70">EM STOCK: <span className="text-amber-300">{s.stock_atual} UN</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black opacity-60 uppercase mb-1">Sugestão</p>
                                            <div className="bg-white text-blue-600 px-3 py-1 rounded-full font-black text-xs">
                                                +{s.sugestao_compra} UN
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {sugestoes.length === 0 && <p className="text-sm font-medium italic opacity-70">O stock está otimizado. Nenhuma reposição crítica sugerida.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de Ordens Ativas */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Procurar ordem ou fornecedor..."
                                className="w-full bg-gray-50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-400"><Filter size={20} /></button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordem</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fornecedor</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-12 text-center animate-pulse text-gray-400 font-bold uppercase text-xs tracking-widest">Acedendo ao Arquivo de Compras...</td></tr>
                                ) : ordens.length === 0 ? (
                                    <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic text-sm">Nenhuma ordem de compra registada.</td></tr>
                                ) : ordens.map(o => (
                                    <tr key={o.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <td className="px-8 py-6">
                                            <div className="font-black text-gray-800 text-sm">{o.codigo}</div>
                                            <div className="text-[10px] text-gray-400 font-bold">{new Date(o.data_emissao).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-gray-700 uppercase">{o.fornecedor_nome}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${o.status === 'CONCLUIDA' ? 'bg-emerald-100 text-emerald-700' :
                                                o.status === 'ENVIADA' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {o.status_display}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-gray-900">
                                            {formatPrice(parseFloat(o.valor_total))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Fornecedores e Performance */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-xl">
                        <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                            <CheckCircle2 size={24} className="text-emerald-500" /> KPIs de Logística
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                                    <span>Stock Saudável</span>
                                    <span>--%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[0%]"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                                    <span>Pedidos no Prazo</span>
                                    <span>--%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[0%]"></div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-800">
                                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                                    "A inteligência do GestorFarma recomenda compras baseadas no histórico real de vendas, reduzindo stock parado em até 30%."
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Top Fornecedores</h3>
                        <div className="space-y-4">
                            <div className="py-10 text-center text-gray-400 text-xs italic">
                                Aguardando dados reais de fornecedores...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
