'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, X, Loader2, LayoutGrid, List, Filter, AlertTriangle, CheckCircle2, History } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Estoque {
    id: number;
    produto: number;
    produto_nome: string;
    produto_codigo: string;
    quantidade: number;
    quantidade_minima: number;
    preco_venda: string;
    is_disponivel: boolean;
    data_validade: string;
    local: 'LOJA' | 'ARMAZEM' | 'OUTRO';
    lote: string;
    preco_custo: string;
}

interface ProdutoCatalogo {
    id: number;
    nome: string;
    nome_generico: string;
    fabricante: string;
    tipo: string;
}

interface EstoqueForm {
    produto_id: string;
    preco_venda: string;
    preco_custo: string; // Campo obrigatório
    quantidade: string;
    data_validade: string;
    lote: string;
    local: string;
    preco_venda_avulso?: string;
}

interface MasterProdutoForm {
    nome: string;
    nome_generico: string;
    codigo_barras: string;
    categoria: string;
    tipo: string;
    fabricante: string;
    forma_farmaceutica: string;
    concentracao: string;
    quantidade_embalagem: string;
    unidade_medida: string;
    unidades_por_caixa: string;
    permite_venda_avulsa: boolean;
    percentual_comissao: string;
    is_isento_iva: boolean;
    taxa_iva: string;
    pais_origem?: string;
}

export default function ProdutosPage() {
    const [estoque, setEstoque] = useState<Estoque[]>([]);
    const [catalogo, setCatalogo] = useState<ProdutoCatalogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'ESTOQUE' | 'CATALOGO'>('ESTOQUE');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [busca, setBusca] = useState('');
    const [saving, setSaving] = useState(false);
    const [localFiltro, setLocalFiltro] = useState<'TODOS' | 'LOJA' | 'ARMAZEM'>('TODOS');
    const [statusFiltro, setStatusFiltro] = useState<'TODOS' | 'CRITICO' | 'ATENCAO' | 'BOM'>('TODOS');
    const [editingEstoque, setEditingEstoque] = useState<Estoque | null>(null);
    const [editingMaster, setEditingMaster] = useState<any | null>(null);

    // Estados para Transferência
    const [transferData, setTransferData] = useState({
        estoque_origem_id: '',
        quantidade: 1,
        destino: 'ARMAZEM'
    });

    const { register, handleSubmit, reset } = useForm<EstoqueForm>({
        defaultValues: {
            local: 'LOJA'
        }
    });

    const handleTransfer = async () => {
        if (!transferData.estoque_origem_id || transferData.quantidade <= 0) {
            toast.error('Dados de transferência inválidos');
            return;
        }

        setSaving(true);
        try {
            await api.post('/produtos/transferencia/', {
                estoque_id: transferData.estoque_origem_id,
                quantidade: transferData.quantidade,
                destino: transferData.destino
            });
            toast.success('Transferência concluída com sucesso!');
            setIsTransferModalOpen(false);
            fetchEstoque();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao transferir estoque');
        } finally {
            setSaving(false);
        }
    };
    const masterForm = useForm<MasterProdutoForm>({
        defaultValues: {
            tipo: 'MEDICAMENTO',
            unidade_medida: 'UNIDADE',
            unidades_por_caixa: '1',
            is_isento_iva: false,
            taxa_iva: '16.00'
        }
    });

    useEffect(() => {
        fetchEstoque();
        fetchCatalogo();
    }, []);

    const fetchEstoque = async () => {
        try {
            const response = await api.get('/produtos/meu-estoque/');
            setEstoque(response.data.results || []);
        } catch (error) {
            console.error('Erro ao buscar estoque', error);
            // Não mostra toast aqui para não spamar se for só 404 inicial
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogo = async () => {
        try {
            const response = await api.get('/produtos/catalogo/');
            setCatalogo(response.data.results || []);
        } catch (error) {
            console.error('Erro ao buscar catálogo', error);
        }
    };

    const onSubmit = async (data: EstoqueForm) => {
        setSaving(true);
        try {
            const payload = {
                produto: parseInt(data.produto_id),
                preco_venda: parseFloat(data.preco_venda),
                preco_custo: parseFloat(data.preco_custo),
                quantidade: parseInt(data.quantidade),
                data_validade: data.data_validade,
                lote: data.lote,
                local: data.local,
                is_disponivel: true
            };

            if (editingEstoque) {
                await api.patch(`/produtos/meu-estoque/${editingEstoque.id}/`, payload);
                toast.success('Estoque atualizado!');
            } else {
                await api.post('/produtos/meu-estoque/', payload);
                toast.success('Produto adicionado ao estoque!');
            }

            setIsModalOpen(false);
            setEditingEstoque(null);
            reset();
            fetchEstoque();
        } catch (error: any) {
            toast.error('Erro ao salvar estoque');
        } finally {
            setSaving(false);
        }
    };

    const onDeleteEstoque = async (id: number) => {
        if (!confirm('Deseja remover este item do estoque?')) return;
        try {
            await api.delete(`/produtos/meu-estoque/${id}/`);
            toast.success('Item removido');
            fetchEstoque();
        } catch (error) {
            toast.error('Erro ao remover item');
        }
    };

    const onMasterSubmit = async (data: MasterProdutoForm) => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                unidades_por_caixa: parseInt(data.unidades_por_caixa),
                taxa_iva: parseFloat(data.taxa_iva || '16.00'),
                is_ativo: true,
                categoria: parseInt(data.categoria || '1')
            };

            if (editingMaster) {
                await api.patch(`/produtos/catalogo/${editingMaster.id}/`, payload);
                toast.success('Catálogo atualizado!');
            } else {
                await api.post('/produtos/catalogo/', payload);
                toast.success('Produto cadastrado no catálogo!');
            }

            setIsMasterModalOpen(false);
            setEditingMaster(null);
            masterForm.reset();
            fetchCatalogo();
        } catch (error: any) {
            toast.error('Erro ao salvar no catálogo');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('ESTOQUE')}
                        className={`text-2xl font-bold pb-2 transition-all ${activeTab === 'ESTOQUE' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Gestão de Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('CATALOGO')}
                        className={`text-2xl font-bold pb-2 transition-all ${activeTab === 'CATALOGO' ? 'text-emerald-600 border-b-4 border-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Catálogo Global
                    </button>
                </div>

                <div className="flex gap-2">
                    {activeTab === 'ESTOQUE' ? (
                        <button
                            onClick={() => { setEditingEstoque(null); reset(); setIsModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all shadow-blue-100"
                        >
                            <Plus size={18} />
                            Adicionar ao Stock
                        </button>
                    ) : (
                        <button
                            onClick={() => { setEditingMaster(null); masterForm.reset(); setIsMasterModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm transition-all shadow-emerald-100"
                        >
                            <Plus size={18} />
                            Novo no Catálogo
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros e Controles */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border self-start">
                    <button
                        onClick={() => setLocalFiltro('TODOS')}
                        className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${localFiltro === 'TODOS' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        TODOS
                    </button>
                    <button
                        onClick={() => setLocalFiltro('LOJA')}
                        className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${localFiltro === 'LOJA' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        LOJA
                    </button>
                    <button
                        onClick={() => setLocalFiltro('ARMAZEM')}
                        className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${localFiltro === 'ARMAZEM' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        ARMAZÉM
                    </button>
                </div>

                {activeTab === 'ESTOQUE' && (
                    <div className="flex items-center gap-2">
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border">
                            <button
                                onClick={() => setStatusFiltro('TODOS')}
                                className={`px-3 py-2 text-[10px] font-black rounded-lg transition-all ${statusFiltro === 'TODOS' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                                title="Filtrar Todos"
                            >
                                <Filter size={14} className="inline mr-1" /> TODOS
                            </button>
                            <button
                                onClick={() => setStatusFiltro('CRITICO')}
                                className={`px-3 py-2 text-[10px] font-black rounded-lg transition-all ${statusFiltro === 'CRITICO' ? 'bg-red-100 text-red-700' : 'text-gray-400'}`}
                                title="Stock Baixo"
                            >
                                CRÍTICO
                            </button>
                            <button
                                onClick={() => setStatusFiltro('ATENCAO')}
                                className={`px-3 py-2 text-[10px] font-black rounded-lg transition-all ${statusFiltro === 'ATENCAO' ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}
                                title="Validade Próxima"
                            >
                                ATENÇÃO
                            </button>
                        </div>

                        <div className="flex bg-white p-1 rounded-xl shadow-sm border ml-2">
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                                title="Visualização em Grade"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                                title="Visualização em Lista"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="relative flex-1 max-w-sm w-full">
                    <input
                        type="text"
                        placeholder={activeTab === 'ESTOQUE' ? "Buscar por nome ou código..." : "Buscar por nome, genérico, tipo..."}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400 text-sm"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
            </div>

            {activeTab === 'ESTOQUE' ? (
                <>
                    {loading ? (
                        <p className="text-center text-gray-500 py-10">Carregando...</p>
                    ) : (
                        (() => {
                            const filteredEstoque = estoque
                                .filter(item => localFiltro === 'TODOS' || item.local === localFiltro)
                                .filter(item => {
                                    const isCritico = item.quantidade <= (item.quantidade_minima || 10);
                                    const isExpiring = item.data_validade && (new Date(item.data_validade).getTime() - new Date().getTime()) < (90 * 24 * 60 * 60 * 1000);

                                    if (statusFiltro === 'CRITICO') return isCritico;
                                    if (statusFiltro === 'ATENCAO') return isExpiring && !isCritico;
                                    if (statusFiltro === 'BOM') return !isCritico && !isExpiring;
                                    return true;
                                })
                                .filter(item =>
                                    item.produto_nome.toLowerCase().includes(busca.toLowerCase()) ||
                                    item.produto_codigo?.includes(busca)
                                );

                            if (filteredEstoque.length === 0) {
                                return (
                                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                                        <p className="text-gray-500">Nenhum produto em stock com estes filtros.</p>
                                    </div>
                                );
                            }

                            return viewMode === 'GRID' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredEstoque.map((item) => {
                                        const isCritico = item.quantidade <= (item.quantidade_minima || 10);
                                        const isExpiring = item.data_validade && (new Date(item.data_validade).getTime() - new Date().getTime()) < (90 * 24 * 60 * 60 * 1000);
                                        const statusColor = isCritico ? 'bg-rose-600' : isExpiring ? 'bg-amber-500' : 'bg-green-500';

                                        let statusMsg = "Stock Saudável";
                                        if (isCritico) statusMsg = `CRÍTICO: Stock abaixo do mínimo (${item.quantidade_minima || 10})`;
                                        else if (isExpiring) statusMsg = "ATENÇÃO: Validade próxima (inferior a 90 dias)";

                                        return (
                                            <div key={item.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5 flex flex-col justify-between group relative overflow-hidden" title={statusMsg}>
                                                <div className={`absolute top-0 left-0 w-1 h-full ${statusColor}`} />
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full w-fit uppercase ${item.local === 'LOJA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                {item.local}
                                                            </span>
                                                            <span className={`px-2 py-0.5 text-xs font-black rounded-full w-fit ${isCritico ? 'bg-rose-100 text-rose-700' : isExpiring ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                                {item.quantidade} un
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-1.5">
                                                                {isCritico && <AlertTriangle size={12} className="text-rose-600 animate-pulse" />}
                                                                <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-bold">{item.lote}</span>
                                                        </div>
                                                    </div>
                                                    <h3 className="mt-3 font-semibold text-gray-900 line-clamp-2" title={item.produto_nome}>
                                                        {item.produto_nome}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">Ref: {item.produto_codigo || 'N/A'}</p>

                                                    <div className="mt-4">
                                                        <p className="text-sm text-gray-500 font-medium">Preço Venda</p>
                                                        <p className="text-lg font-black text-blue-600">{formatPrice(parseFloat(item.preco_venda))}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-5 flex gap-2 pt-4 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setTransferData({ ...transferData, estoque_origem_id: item.id.toString(), destino: item.local === 'LOJA' ? 'ARMAZEM' : 'LOJA' });
                                                            setIsTransferModalOpen(true);
                                                        }}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-blue-600 bg-blue-100/50 rounded-lg hover:bg-blue-100 uppercase tracking-tighter"
                                                    >
                                                        Transferir
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingEstoque(item);
                                                            reset({
                                                                produto_id: item.produto.toString(),
                                                                preco_venda: item.preco_venda,
                                                                preco_custo: item.preco_custo,
                                                                quantidade: item.quantidade.toString(),
                                                                data_validade: item.data_validade,
                                                                lote: item.lote,
                                                                local: item.local
                                                            });
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="flex items-center justify-center p-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteEstoque(item.id)}
                                                        className="flex items-center justify-center p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Produto</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 text-center">Local</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 text-right">Qtd</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 text-right">Preço</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredEstoque.map((item) => {
                                                const isCritico = item.quantidade <= (item.quantidade_minima || 10);
                                                const isExpiring = item.data_validade && (new Date(item.data_validade).getTime() - new Date().getTime()) < (90 * 24 * 60 * 60 * 1000);

                                                let statusMsg = "Stock Saudável";
                                                if (isCritico) statusMsg = `CRÍTICO: Stock abaixo do mínimo (${item.quantidade_minima || 10})`;
                                                else if (isExpiring) statusMsg = "ATENÇÃO: Validade próxima (inferior a 90 dias)";

                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group" title={statusMsg}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-3 h-3 rounded-full ${isCritico ? 'bg-rose-600' : isExpiring ? 'bg-amber-500' : 'bg-green-500'}`} />
                                                                <span className={`text-[10px] font-black uppercase ${isCritico ? 'text-rose-700' : isExpiring ? 'text-amber-700' : 'text-green-700'}`}>
                                                                    {isCritico ? 'Crítico' : isExpiring ? 'Atenção' : 'Bom'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-gray-900">{item.produto_nome}</p>
                                                            <p className="text-[10px] text-gray-400 font-mono">Lote: {item.lote} | Val: {item.data_validade || '-'}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg uppercase ${item.local === 'LOJA' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                                {item.local}
                                                            </span>
                                                        </td>
                                                        <td className={`px-6 py-4 text-right font-black ${isCritico ? 'text-red-600' : 'text-gray-900'}`}>
                                                            {item.quantidade}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-blue-600">
                                                            {formatPrice(parseFloat(item.preco_venda))}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => { setEditingEstoque(item); reset({ produto_id: item.produto.toString(), preco_venda: item.preco_venda, preco_custo: item.preco_custo, quantidade: item.quantidade.toString(), data_validade: item.data_validade, lote: item.lote, local: item.local }); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
                                                                <button onClick={() => onDeleteEstoque(item.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()
                    )}
                </>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Produto / Genérico</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Fabricante</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-center">Cat/Tipo</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {catalogo
                                .filter(p =>
                                    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
                                    p.nome_generico?.toLowerCase().includes(busca.toLowerCase()) ||
                                    p.tipo?.toLowerCase().includes(busca.toLowerCase()) ||
                                    p.fabricante?.toLowerCase().includes(busca.toLowerCase())
                                )
                                .map((p: any) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{p.nome}</p>
                                            <p className="text-xs text-gray-500 uppercase">{p.nome_generico || 'Sem Genérico'}</p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-1">{p.codigo_barras}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{p.fabricante || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-black text-gray-600 uppercase">
                                                {p.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => {
                                                        setEditingMaster(p);
                                                        masterForm.reset({
                                                            ...p,
                                                            taxa_iva: p.taxa_iva?.toString() || '16.00',
                                                            unidades_por_caixa: p.unidades_por_caixa?.toString() || '1',
                                                            categoria: p.categoria?.id?.toString() || p.categoria?.toString() || '1'
                                                        });
                                                        setIsMasterModalOpen(true);
                                                    }}
                                                    className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingEstoque ? 'Editar Item no Stock' : 'Adicionar ao Stock'}
                            </h2>
                            <button onClick={() => { setIsModalOpen(false); setEditingEstoque(null); }} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
                                <select
                                    {...register('produto_id', { required: true })}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                >
                                    <option value="">Selecione...</option>
                                    {catalogo.map(prod => (
                                        <option key={prod.id} value={prod.id}>
                                            {prod.nome} ({prod.fabricante})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço Custo (MT)</label>
                                    <input
                                        type="number" step="0.01"
                                        {...register('preco_custo', { required: true })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço Venda (MT)</label>
                                    <input
                                        type="number" step="0.01"
                                        {...register('preco_venda', { required: true })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-emerald-600 mb-1 uppercase tracking-wider text-[10px]">Preço Carteira/Avulso (Opcional)</label>
                                <input
                                    type="number" step="0.01"
                                    {...register('preco_venda_avulso')}
                                    className="w-full rounded-lg border-emerald-200 bg-emerald-50 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border font-bold text-emerald-700"
                                    placeholder="0.00"
                                />
                                <p className="text-[9px] text-emerald-600 mt-1 italic font-medium tracking-tight">Defina o preço de 1 unidade individual se desejar vender fracionado.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        {...register('quantidade', { required: true })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                                    <input
                                        type="date"
                                        {...register('data_validade', { required: true })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                                    <select
                                        {...register('local', { required: true })}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    >
                                        <option value="LOJA">Loja (Exposto)</option>
                                        <option value="ARMAZEM">Armazém (Stock)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lote (Opcional)</label>
                                    <input
                                        type="text"
                                        {...register('lote')}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        placeholder="Deixe vazio para auto-gerar"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Cadastro Mestre (Catálogo) */}
            {isMasterModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingMaster ? 'Editar Produto do Catálogo' : 'Novo Produto no Catálogo'}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {editingMaster ? 'Atualize as informações técnicas deste medicamento.' : 'Cadastre o medicamento mestre para todas as farmácias.'}
                                </p>
                            </div>
                            <button onClick={() => { setIsMasterModalOpen(false); setEditingMaster(null); }} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={masterForm.handleSubmit(onMasterSubmit)} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Nome Comercial</label>
                                    <input
                                        type="text"
                                        {...masterForm.register('nome', { required: true })}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border text-lg font-medium"
                                        placeholder="Digite o nome do produto..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Código de Barras</label>
                                    <input
                                        type="text"
                                        {...masterForm.register('codigo_barras', { required: true })}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                        placeholder="Leia ou digite o EAN..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Nome Genérico</label>
                                    <input
                                        type="text"
                                        {...masterForm.register('nome_generico')}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                        placeholder="Princípio ativo..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Fabricante / Marca</label>
                                    <input
                                        type="text"
                                        {...masterForm.register('fabricante')}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                        placeholder="Nome do laboratório..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">País de Origem</label>
                                    <input
                                        type="text"
                                        {...masterForm.register('pais_origem')}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                        placeholder="Ex: Portugal, Moçambique..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Categoria</label>
                                    <select
                                        {...masterForm.register('categoria', { required: true })}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                    >
                                        <option value="">Selecione...</option>
                                        {/* Categorias devem ser carregadas da API */}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Natureza (Tipo)</label>
                                    <select
                                        {...masterForm.register('tipo', { required: true })}
                                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                    >
                                        <option value="MEDICAMENTO">Medicamento</option>
                                        <option value="SUPLEMENTO">Suplemento</option>
                                        <option value="COSMETICO">Cosmético</option>
                                        <option value="HIGIENE">Higiene</option>
                                        <option value="EQUIPAMENTO">Equipamento</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Apresentação e Unidades</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Unid. Medida</label>
                                        <select
                                            {...masterForm.register('unidade_medida', { required: true })}
                                            className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                        >
                                            <option value="UNIDADE">Unidade</option>
                                            <option value="CAIXA">Caixa</option>
                                            <option value="CARTELA">Cartela/Blister</option>
                                            <option value="FRASCO">Frasco</option>
                                            <option value="ML">Mililitros</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Quantas Unidades/Carteiras na Caixa?</label>
                                        <input
                                            type="number"
                                            {...masterForm.register('unidades_por_caixa')}
                                            className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                            placeholder="Ex: 4"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Define quantas carteiras/strips existem dentro de 1 caixa.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Comissão (%)</label>
                                        <input
                                            type="number" step="0.01"
                                            {...masterForm.register('percentual_comissao')}
                                            className="w-full rounded-xl border-emerald-200 bg-emerald-50 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 border font-bold text-emerald-700"
                                            placeholder="Ex: 2.00"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3 justify-center pt-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="avulso_check"
                                                {...masterForm.register('permite_venda_avulsa')}
                                                className="w-5 h-5 rounded text-blue-600 border-gray-300"
                                            />
                                            <div className="flex flex-col">
                                                <label htmlFor="avulso_check" className="text-xs font-bold text-gray-700 uppercase">Permitir Venda de Carteira?</label>
                                                <span className="text-[9px] text-gray-400">Ativa a venda fracionada no balcão</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isento_check"
                                                {...masterForm.register('is_isento_iva')}
                                                className="w-5 h-5 rounded text-blue-600 border-gray-300"
                                            />
                                            <label htmlFor="isento_check" className="text-xs font-bold text-gray-700 uppercase">Isento IVA</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsMasterModalOpen(false)}
                                    className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl font-bold uppercase text-xs transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    Finalizar Cadastro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Transferência */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b bg-blue-600 text-white">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black uppercase tracking-widest">Transferir Stock</h3>
                                <button onClick={() => setIsTransferModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <p className="text-xs opacity-80 mt-1">Mover produtos entre Loja e Armazém</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Quantidade a Mover</label>
                                <input
                                    type="number"
                                    value={transferData.quantidade}
                                    onChange={(e) => setTransferData({ ...transferData, quantidade: parseInt(e.target.value) })}
                                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-4 border text-2xl font-black"
                                    max="5000"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Destino</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTransferData({ ...transferData, destino: 'LOJA' })}
                                        className={`py-3 rounded-xl font-bold text-xs uppercase border-2 transition-all ${transferData.destino === 'LOJA' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}
                                    >
                                        LOJA
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTransferData({ ...transferData, destino: 'ARMAZEM' })}
                                        className={`py-3 rounded-xl font-bold text-xs uppercase border-2 transition-all ${transferData.destino === 'ARMAZEM' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'}`}
                                    >
                                        ARMAZÉM
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleTransfer}
                                disabled={saving}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg shadow-gray-200"
                            >
                                {saving ? 'Transferindo...' : 'Confirmar Movimentação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
