'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
    Users,
    CreditCard,
    Search,
    Plus,
    AlertTriangle,
    History,
    ExternalLink,
    Ban,
    CheckCircle2,
    DollarSign,
    Filter,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

interface Movimento {
    id: number;
    tipo: string;
    tipo_display: string;
    valor: string;
    data_movimento: string;
    data_vencimento: string;
    descricao: string;
    operador_nome: string;
    is_liquidado: boolean;
}

interface Cliente {
    id: number;
    nome_completo: string;
    telefone: string;
    nuit: string | null;
    limite_credito: string;
    saldo_atual: string;
    is_bloqueado: boolean;
    movimentos_recentes: Movimento[];
}

export default function GestaoClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
    const [showLiquidar, setShowLiquidar] = useState(false);
    const [valorLiquidar, setValorLiquidar] = useState('');
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');

    useEffect(() => {
        carregarClientes();
    }, []);

    const carregarClientes = async () => {
        try {
            const res = await api.get('/clientes/');
            setClientes(res.data.results || res.data);
        } catch (error) {
            toast.error('Erro ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleLiquidar = async () => {
        if (!clienteSelecionado || !valorLiquidar) return;
        try {
            await api.post(`/clientes/${clienteSelecionado.id}/liquidar_pagamento/`, {
                valor: parseFloat(valorLiquidar),
                metodo: metodoPagamento
            });
            toast.success('Pagamento registado com sucesso!');
            setShowLiquidar(false);
            setValorLiquidar('');
            carregarClientes(); // Recarregar lista
            // Atualizar cliente selecionado se estiver em foco
            const updatedRes = await api.get(`/clientes/${clienteSelecionado.id}/`);
            setClienteSelecionado(updatedRes.data);
        } catch (error) {
            toast.error('Erro ao processar pagamento');
        }
    };

    const filteredClientes = clientes.filter(c =>
        c.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
        c.telefone.includes(busca)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-3">
                        <Users size={36} className="text-blue-600" /> Contas Correntes
                    </h1>
                    <p className="text-gray-500 font-medium tracking-tight">Gestão de crédito, limites e idade do saldo de clientes.</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white font-black text-xs rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest">
                    <Plus size={18} /> Novo Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* LISTA DE CLIENTES */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Procurar cliente (Nome ou Tel)..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none shadow-sm focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden max-h-[700px] overflow-y-auto">
                        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Carteira de Clientes</h3>
                            <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{filteredClientes.length}</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {filteredClientes.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setClienteSelecionado(c)}
                                    className={`w-full text-left p-6 hover:bg-blue-50 transition-all flex justify-between items-center group ${clienteSelecionado?.id === c.id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}
                                >
                                    <div>
                                        <p className="font-black text-gray-800 uppercase text-sm group-hover:text-blue-700 transition-colors">{c.nome_completo}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-gray-400">{c.telefone}</span>
                                            {parseFloat(c.saldo_atual) > 0 && (
                                                <span className="bg-red-50 text-red-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Dívida</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${parseFloat(c.saldo_atual) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                            {formatPrice(parseFloat(c.saldo_atual))}
                                        </p>
                                        <p className="text-[9px] font-bold text-gray-300 uppercase">Saldo</p>
                                    </div>
                                </button>
                            ))}
                            {filteredClientes.length === 0 && (
                                <div className="p-12 text-center text-gray-400 italic text-sm">Nenhum cliente encontrado.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DETALHES DA CONTA CORRENTE */}
                <div className="xl:col-span-8 space-y-8">
                    {clienteSelecionado ? (
                        <div className="animate-in slide-in-from-right duration-500 space-y-8">
                            {/* Cards de Dashboard do Cliente */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 text-blue-100 group-hover:scale-110 transition-transform"><CreditCard size={100} /></div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dívida Total</p>
                                        <h3 className={`text-3xl font-black ${parseFloat(clienteSelecionado.saldo_atual) > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                            {formatPrice(parseFloat(clienteSelecionado.saldo_atual))}
                                        </h3>
                                        <div className="mt-4 flex items-center gap-2">
                                            <button
                                                onClick={() => setShowLiquidar(true)}
                                                className="bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-lg shadow-emerald-100"
                                            >
                                                Liquidar Saldo
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Limite de Crédito</p>
                                    <h3 className="text-3xl font-black text-gray-800">{formatPrice(parseFloat(clienteSelecionado.limite_credito))}</h3>
                                    <div className="mt-4 space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-gray-400 uppercase">Utilizado</span>
                                            <span className="text-blue-600">{((parseFloat(clienteSelecionado.saldo_atual) / parseFloat(clienteSelecionado.limite_credito)) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${(parseFloat(clienteSelecionado.saldo_atual) / parseFloat(clienteSelecionado.limite_credito)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900 p-8 rounded-[32px] shadow-xl text-white">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Situação de Risco</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        {clienteSelecionado.is_bloqueado ? (
                                            <>
                                                <Ban className="text-red-500" size={24} />
                                                <h3 className="text-xl font-black uppercase text-red-500">BLOQUEADO</h3>
                                            </>
                                        ) : parseFloat(clienteSelecionado.saldo_atual) > parseFloat(clienteSelecionado.limite_credito) ? (
                                            <>
                                                <AlertTriangle className="text-amber-500" size={24} />
                                                <h3 className="text-xl font-black uppercase text-amber-500">EXCEDIDO</h3>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="text-emerald-500" size={24} />
                                                <h3 className="text-xl font-black uppercase text-emerald-500">CONFORMADO</h3>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-4 leading-relaxed italic">
                                        {clienteSelecionado.is_bloqueado ? "Cliente impedido de realizar compras a prazo." : "Limite e pagamentos dentro dos parâmetros configurados."}
                                    </p>
                                </div>
                            </div>

                            {/* Extrato de Conta Corrente */}
                            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
                                <div className="p-8 border-b bg-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <History className="text-blue-600" size={24} />
                                        <h3 className="text-lg font-black uppercase tracking-tighter">Extrato de Conta Corrente</h3>
                                    </div>
                                    <button className="text-[10px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1">
                                        Ver Tudo <ExternalLink size={12} />
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Operador</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimento</th>
                                                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {clienteSelecionado.movimentos_recentes.map(m => (
                                                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="text-xs font-bold text-gray-800">{new Date(m.data_movimento).toLocaleString()}</div>
                                                        <div className="text-[9px] text-gray-400 font-bold uppercase">{m.operador_nome}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${m.tipo === 'DEBITO' ? 'bg-red-50 text-red-600' :
                                                                m.tipo === 'CREDITO' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {m.tipo_display}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-xs font-medium text-gray-600">{m.descricao}</td>
                                                    <td className="px-8 py-6">
                                                        {m.data_vencimento ? (
                                                            <div className={`flex items-center gap-1.5 text-xs font-black ${new Date(m.data_vencimento) < new Date() && !m.is_liquidado ? 'text-red-500' : 'text-gray-500'}`}>
                                                                <Calendar size={12} /> {new Date(m.data_vencimento).toLocaleDateString()}
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td className={`px-8 py-6 text-right font-black ${m.tipo === 'DEBITO' ? 'text-red-600' : 'text-emerald-600'}`}>
                                                        {m.tipo === 'DEBITO' ? '-' : '+'} {formatPrice(parseFloat(m.valor))}
                                                    </td>
                                                </tr>
                                            ))}
                                            {clienteSelecionado.movimentos_recentes.length === 0 && (
                                                <tr><td colSpan={5} className="p-12 text-center text-gray-400 italic text-sm">Nenhum movimento registado para este cliente.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-gray-50/50 rounded-[60px] border-2 border-dashed border-gray-100 space-y-6">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-200 shadow-sm"><Users size={48} /></div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tighter">Selecione um Cliente</h3>
                                <p className="text-gray-400 text-sm font-medium">Clique num cliente ao lado para ver o extrato e gerir o crédito.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE LIQUIDAÇÃO (PAGAMENTO) */}
            {showLiquidar && clienteSelecionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl animate-in zoom-in duration-500 overflow-hidden">
                        <div className="p-10 text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-125 transition-transform">
                                <DollarSign size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none">Receber Pagamento</h2>
                            <p className="text-gray-500 font-medium">Abatendo dívida de <span className="text-blue-600 font-black uppercase">{clienteSelecionado.nome_completo}</span></p>
                        </div>

                        <div className="p-10 pt-0 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor a Pagar (MT)</label>
                                <input
                                    type="number"
                                    value={valorLiquidar}
                                    onChange={e => setValorLiquidar(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-[24px] outline-none focus:border-emerald-500 transition-all font-black text-4xl text-center text-emerald-600"
                                />
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => setValorLiquidar(clienteSelecionado.saldo_atual)} className="text-[9px] font-black text-blue-600 uppercase">Liquidar Tudo</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Método de Recebimento</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['DINHEIRO', 'MPESA', 'EMOLA', 'POS'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setMetodoPagamento(m)}
                                            className={`py-3 rounded-xl text-[10px] font-black transition-all border ${metodoPagamento === m ? 'bg-gray-900 text-white border-transparent' : 'bg-gray-50 text-gray-400 border-gray-100 hovr:bg-gray-100'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setShowLiquidar(false)} className="flex-1 py-4 text-xs font-black text-gray-400 uppercase">Cancelar</button>
                                <button
                                    onClick={handleLiquidar}
                                    className="flex-2 px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    CONFIRMAR <ArrowUpRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
