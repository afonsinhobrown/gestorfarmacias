'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Estoque {
    id: number;
    produto: number;
    produto_nome: string;
    produto_codigo: string;
    quantidade: number;
    preco_venda: string;
    is_disponivel: boolean;
    data_validade: string;
}

interface ProdutoCatalogo {
    id: number;
    nome: string;
    nome_generico: string;
    fabricante: string;
}

interface EstoqueForm {
    produto_id: string;
    preco_venda: string;
    preco_custo: string; // Campo obrigatório
    quantidade: string;
    data_validade: string;
    lote: string;
}

export default function ProdutosPage() {
    const [estoque, setEstoque] = useState<Estoque[]>([]);
    const [catalogo, setCatalogo] = useState<ProdutoCatalogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, reset } = useForm<EstoqueForm>();

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
            // Payload corrigido com TODOS os campos obrigatórios
            const payload = {
                produto: parseInt(data.produto_id),
                preco_venda: parseFloat(data.preco_venda),
                preco_custo: parseFloat(data.preco_custo), // Adicionado!
                quantidade: parseInt(data.quantidade),
                data_validade: data.data_validade,
                lote: data.lote,
                is_disponivel: true
            };

            console.log('Enviando payload:', payload); // Debug
            await api.post('/produtos/meu-estoque/', payload);

            toast.success('Produto adicionado com sucesso!');
            setIsModalOpen(false);
            reset();
            fetchEstoque();
        } catch (error: any) {
            console.error('Erro no POST:', error);
            const msg = error.response?.data ? JSON.stringify(error.response.data) : 'Erro desconhecido';
            toast.error(`Falha ao salvar: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Meus Produtos</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all"
                >
                    <Plus size={18} />
                    Adicionar Produto
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-4">
                <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 flex-1 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <Search size={18} className="text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou código de barras..."
                        className="bg-transparent border-none outline-none text-sm w-full"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <p className="col-span-full text-center text-gray-500 py-10">Carregando estoque...</p>
                ) : estoque.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Nenhum produto cadastrado.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 text-blue-600 font-medium hover:underline"
                        >
                            Adicionar agora
                        </button>
                    </div>
                ) : (
                    estoque.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5 flex flex-col justify-between group">
                            <div>
                                <div className="flex justify-between items-start">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${item.quantidade > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.quantidade} un
                                    </span>
                                    <span className={`w-2 h-2 rounded-full ${item.is_disponivel ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                </div>
                                <h3 className="mt-3 font-semibold text-gray-900 line-clamp-2" title={item.produto_nome}>
                                    {item.produto_nome}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Ref: {item.produto_codigo || 'N/A'}</p>

                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">Venda</p>
                                    <p className="text-lg font-bold text-blue-600">{formatPrice(parseFloat(item.preco_venda))}</p>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-2 pt-4 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <Edit2 size={16} />
                                </button>
                                <button className="flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Adicionar ao Estoque</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                                <input
                                    type="text"
                                    {...register('lote', { required: true })}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    placeholder="Lote..."
                                />
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
        </div>
    );
}
