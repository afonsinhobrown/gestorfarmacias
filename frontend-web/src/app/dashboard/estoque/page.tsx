'use client';

import { useState, useEffect } from 'react';
import {
    Package, Search, Plus, AlertTriangle, ArrowDown, ArrowUp,
    Filter, FileText, Settings, BadgeAlert, History
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import ProductHistoryModal from '@/components/modals/ProductHistoryModal';

export default function EstoquePage() {
    const [estoque, setEstoque] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    // Modal Histórico
    const [selectedEstoque, setSelectedEstoque] = useState<any>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    useEffect(() => {
        carregarEstoque();
    }, []);

    const carregarEstoque = async () => {
        setLoading(true);
        try {
            const res = await api.get('/produtos/meu-estoque/');
            setEstoque(res.data.results || res.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar estoque.');
        } finally {
            setLoading(false);
        }
    };

    const filtrarEstoque = () => {
        if (!busca) return estoque;
        return estoque.filter(item =>
            item.produto_nome.toLowerCase().includes(busca.toLowerCase()) ||
            item.lote.toLowerCase().includes(busca.toLowerCase())
        );
    };

    const listaFiltrada = filtrarEstoque();
    const criticos = estoque.filter(e => e.quantidade <= e.quantidade_minima).length;

    const handleRowClick = (item: any) => {
        setSelectedEstoque(item);
        setIsHistoryOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Package className="text-purple-600" size={32} />
                        Gestão de Estoque
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Monitore níveis, historico e faça reajustes de preço.</p>
                </div>

                <div className="flex gap-3">
                    <Link href="/dashboard/estoque/ajuste">
                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                            <Settings size={18} />
                            AJUSTES / PERDAS
                        </button>
                    </Link>
                    <Link href="/dashboard/estoque/entrada">
                        <button className="px-6 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center gap-2">
                            <Plus size={18} />
                            NOVA ENTRADA (NOTA FISCAL)
                        </button>
                    </Link>
                </div>
            </div>

            {/* Alertas */}
            {criticos > 0 && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <AlertTriangle className="text-orange-600" size={24} />
                    </div>
                    <div>
                        <h3 className="text-orange-800 font-bold">Atenção: {criticos} produtos com estoque crítico!</h3>
                        <p className="text-orange-600 text-sm">Realize uma nova compra urgentemente para evitar ruptura.</p>
                    </div>
                </div>
            )}

            {/* Lista */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome do produto, lote..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="w-full pl-10 p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                    </div>
                    <button className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">
                        <Filter size={20} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-6 text-xs font-black text-gray-400 uppercase">Produto</th>
                                <th className="text-center py-3 px-6 text-xs font-black text-gray-400 uppercase">Lote</th>
                                <th className="text-center py-3 px-6 text-xs font-black text-gray-400 uppercase">Validade</th>
                                <th className="text-center py-3 px-6 text-xs font-black text-gray-400 uppercase">Quantidade</th>
                                <th className="text-right py-3 px-6 text-xs font-black text-gray-400 uppercase">Pr. Venda</th>
                                <th className="text-center py-3 px-6 text-xs font-black text-gray-400 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Carregando estoque...</td></tr>
                            ) : listaFiltrada.length === 0 ? (
                                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Nenhum produto encontrado.</td></tr>
                            ) : (
                                listaFiltrada.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                        onClick={() => handleRowClick(item)}
                                        title="Clique para ver histórico e ajustar preço"
                                    >
                                        <td className="py-4 px-6">
                                            <p className="font-bold text-gray-800">{item.produto_nome}</p>
                                            <p className="text-xs text-gray-500">{item.produto_categoria}</p>
                                        </td>
                                        <td className="py-4 px-6 text-center text-sm font-mono text-gray-600">
                                            {item.lote}
                                        </td>
                                        <td className="py-4 px-6 text-center text-sm text-gray-600">
                                            {item.data_validade ? new Date(item.data_validade).toLocaleDateString('pt-MZ') : '-'}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-3 py-1 rounded-lg font-bold text-sm ${item.quantidade === 0 ? 'bg-red-100 text-red-600' :
                                                    item.quantidade <= item.quantidade_minima ? 'bg-orange-100 text-orange-600' :
                                                        'bg-green-100 text-green-600'
                                                }`}>
                                                {item.quantidade}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(item.preco_venda)}
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-400 group-hover:text-purple-600">
                                            <History size={18} className="mx-auto" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                estoque={selectedEstoque}
                onUpdate={carregarEstoque}
            />
        </div>
    );
}
