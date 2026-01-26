'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Edit2, Check, ArrowRight, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    estoque: any;
    onUpdate?: () => void;
}

export default function ProductHistoryModal({ isOpen, onClose, estoque, onUpdate }: Props) {
    const [historico, setHistorico] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Reajuste
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [novoPreco, setNovoPreco] = useState('');
    const [savingPrice, setSavingPrice] = useState(false);

    useEffect(() => {
        if (isOpen && estoque) {
            fetchHistorico();
            setNovoPreco(estoque.preco_venda?.toString() || '');
            setIsEditingPrice(false);
        }
    }, [isOpen, estoque]);

    const fetchHistorico = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/produtos/meu-estoque/${estoque.id}/historico/`);
            setHistorico(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar histórico.');
        } finally {
            setLoading(false);
        }
    };

    const handleSalvarPreco = async () => {
        if (!novoPreco || parseFloat(novoPreco) <= 0) {
            toast.error('Preço inválido.');
            return;
        }

        setSavingPrice(true);
        try {
            await api.post('/produtos/reajuste/', {
                estoque_id: estoque.id,
                novo_preco: parseFloat(novoPreco)
            });
            toast.success('Preço reajustado com sucesso!');
            setIsEditingPrice(false);
            fetchHistorico(); // Atualizar histórico para mostrar o ajuste
            if (onUpdate) onUpdate(); // Atualizar lista pai
        } catch (error) {
            console.error(error);
            toast.error('Erro ao reajustar preço.');
        } finally {
            setSavingPrice(false);
        }
    };

    if (!isOpen || !estoque) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Clock size={24} className="text-purple-600" />
                            Histórico do Produto
                        </h2>
                        <div className="mt-2">
                            <p className="font-bold text-gray-800 text-lg">{estoque.produto_nome}</p>
                            <div className="flex gap-3 text-xs text-gray-500 font-mono mt-1">
                                <span>Lote: {estoque.lote}</span>
                                <span>Validade: {estoque.data_validade ? new Date(estoque.data_validade).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Preço e Reajuste */}
                <div className="p-6 bg-purple-50 border-b border-purple-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-purple-600 uppercase">Preço de Venda Atual</p>
                            {!isEditingPrice ? (
                                <p className="text-2xl font-black text-gray-900">{formatPrice(estoque.preco_venda)}</p>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={novoPreco}
                                        onChange={e => setNovoPreco(e.target.value)}
                                        className="w-32 p-1 text-xl font-bold border-b-2 border-purple-500 bg-transparent outline-none text-gray-900"
                                        autoFocus
                                    />
                                    <span className="text-sm font-bold text-gray-500">MTn</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isEditingPrice ? (
                        <button
                            onClick={() => setIsEditingPrice(true)}
                            className="px-4 py-2 bg-white border border-purple-200 text-purple-700 font-bold rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Edit2 size={16} /> Reajustar Preço
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setIsEditingPrice(false); setNovoPreco(estoque.preco_venda); }}
                                className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSalvarPreco}
                                disabled={savingPrice}
                                className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingPrice ? 'Salvando...' : <><Check size={18} /> Confirmar</>}
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabela Kardex */}
                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="text-left py-3 px-6 text-xs font-black text-gray-500 uppercase">Data</th>
                                <th className="text-center py-3 px-6 text-xs font-black text-gray-500 uppercase">Tipo</th>
                                <th className="text-left py-3 px-6 text-xs font-black text-gray-500 uppercase">Detalhes / Motivo</th>
                                <th className="text-center py-3 px-6 text-xs font-black text-gray-500 uppercase">Qtd</th>
                                <th className="text-left py-3 px-6 text-xs font-black text-gray-500 uppercase">Usuário</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Carregando histórico...</td></tr>
                            ) : historico.length === 0 ? (
                                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Nenhuma movimentação registrada.</td></tr>
                            ) : (
                                historico.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            {new Date(mov.data_movimentacao).toLocaleDateString()}
                                            <div className="text-xs text-gray-400">{new Date(mov.data_movimentacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-black uppercase ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' :
                                                    mov.tipo === 'SAIDA' ? 'bg-red-100 text-red-700' :
                                                        mov.tipo === 'AJUSTE' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-600'
                                                }`}>
                                                {mov.tipo === 'ENTRADA' && <TrendingUp size={12} />}
                                                {mov.tipo === 'SAIDA' && <TrendingDown size={12} />}
                                                {mov.tipo}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-bold text-gray-800">{mov.motivo}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{mov.referencia_externa}</p>
                                        </td>
                                        <td className="py-4 px-6 text-center text-sm font-bold">
                                            {mov.quantidade > 0 ? (
                                                <span className={mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}>
                                                    {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.quantidade}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-xs text-gray-500">
                                            {mov.usuario_nome || 'Sistema'}
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
