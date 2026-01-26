'use client';

import { useState, useEffect } from 'react';
import {
    AlertTriangle, Search, Save, Settings, ArrowLeft
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AjusteEstoquePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Busca
    const [busca, setBusca] = useState('');
    const [resultados, setResultados] = useState<any[]>([]);
    const [estoqueSelecionado, setEstoqueSelecionado] = useState<any>(null);

    // Formulario
    const [quantidade, setQuantidade] = useState('');
    const [tipo, setTipo] = useState('SAIDA'); // SAIDA ou ENTRADA
    const [motivo, setMotivo] = useState('QUEBRA');

    const buscarEstoque = async (termo: string) => {
        if (termo.length < 2) return;
        try {
            const res = await api.get(`/produtos/meu-estoque/?q=${termo}`); // Assumindo que meu-estoque filtra
            // Se meu-estoque não filtra query params, faço filtro local ou crio endpoint.
            // O meu-estoque lista tudo, vou filtrar no front se for necessário, mas ideal seria back.
            // Vou usar o endpoint de listagem que já fiz na página EstoquePage
            setResultados(res.data.results || res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Debounce busca manual
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (busca) buscarEstoque(busca);
        }, 500);
        return () => clearTimeout(timeout);
    }, [busca]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!estoqueSelecionado || !quantidade) {
            toast.error('Selecione um produto e informe a quantidade.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/produtos/ajuste/', {
                estoque_id: estoqueSelecionado.id,
                quantidade: parseInt(quantidade),
                tipo: tipo,
                motivo: motivo
            });

            toast.success('Ajuste realizado com sucesso!');
            router.push('/dashboard/estoque');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao realizar ajuste. Verifique o estoque disponível.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-800 flex items-center gap-2 mb-4"
            >
                <ArrowLeft size={18} /> Voltar para Estoque
            </button>

            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <Settings className="text-gray-600" size={32} />
                    Ajuste Manual e Perdas
                </h1>
                <p className="text-gray-500 mt-1">Correção de estoque, registro de quebras, roubos ou vencimentos.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Seleção de Produto */}
                    <div className="space-y-2">
                        <label className="font-bold text-gray-700">1. Buscar Produto no Estoque</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={busca}
                                onChange={e => {
                                    setBusca(e.target.value);
                                    if (!e.target.value) { setResultados([]); setEstoqueSelecionado(null); }
                                }}
                                placeholder="Digite nome, lote ou código..."
                                className="w-full pl-10 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            {/* Resultados */}
                            {resultados.length > 0 && !estoqueSelecionado && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-lg mt-1 z-10 max-h-60 overflow-y-auto">
                                    {resultados.map((item: any) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                setEstoqueSelecionado(item);
                                                setBusca(`${item.produto_nome} - Lote: ${item.lote}`);
                                                setResultados([]); // Fechar lista
                                            }}
                                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-50 last:border-0"
                                        >
                                            <p className="font-bold text-gray-800">{item.produto_nome}</p>
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>Lote: {item.lote}</span>
                                                <span className="font-mono">Estoque Atual: {item.quantidade}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {estoqueSelecionado && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center text-sm text-blue-800">
                                <span><b>Produto Selecionado:</b> {estoqueSelecionado.produto_nome} (Lote: {estoqueSelecionado.lote})</span>
                                <button type="button" onClick={() => { setEstoqueSelecionado(null); setBusca(''); }} className="text-blue-500 underline text-xs">Trocar</button>
                            </div>
                        )}
                    </div>

                    {/* Tipo e Motivo */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="font-bold text-gray-700">2. Tipo de Movimento</label>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setTipo('SAIDA')}
                                    className={`flex-1 py-2 font-bold rounded-lg text-sm transition-all ${tipo === 'SAIDA' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                                >
                                    SAÍDA (-)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTipo('ENTRADA')}
                                    className={`flex-1 py-2 font-bold rounded-lg text-sm transition-all ${tipo === 'ENTRADA' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
                                >
                                    ENTRADA (+)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="font-bold text-gray-700">3. Motivo</label>
                            <select
                                value={motivo}
                                onChange={e => setMotivo(e.target.value)}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="VENDA_MANUAL">Venda Balcão (Sem Receita)</option>
                                <option value="PERDA">Perda Operacional</option>
                                <option value="QUEBRA">Quebra / Avaria</option>
                                <option value="VENCIMENTO">Vencimento de Produto</option>
                                <option value="ROUBO">Roubo / Furto</option>
                                <option value="INVENTARIO">Correção de Inventário</option>
                                <option value="USO_INTERNO">Uso Interno</option>
                            </select>
                        </div>
                    </div>

                    {/* Alerta de Vencimento/Perda */}
                    {(motivo === 'QUEBRA' || motivo === 'VENCIMENTO' || motivo === 'ROUBO') && tipo === 'SAIDA' && (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 text-red-800 text-sm">
                            <AlertTriangle size={20} className="shrink-0" />
                            <p>Esta operação será registrada automaticamente como <b>PREJUÍZO FINANCEIRO</b> nos relatórios.</p>
                        </div>
                    )}

                    {/* Quantidade */}
                    <div className="space-y-2">
                        <label className="font-bold text-gray-700">4. Quantidade Ajustada</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={quantidade}
                            onChange={e => setQuantidade(e.target.value)}
                            className="w-full p-4 text-2xl font-black text-center border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                        />
                        {estoqueSelecionado && tipo === 'SAIDA' && (
                            <p className="text-center text-xs text-gray-500">Máximo disponível: {estoqueSelecionado.quantidade}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${tipo === 'SAIDA' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                    >
                        {loading ? 'PROCESSANDO...' : (
                            <>
                                <Save size={20} />
                                CONFIRMAR AJUSTE
                            </>
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
}
