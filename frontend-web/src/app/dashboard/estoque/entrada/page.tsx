'use client';

import { useState, useEffect } from 'react';
import {
    PackagePlus, Search, Plus, Trash2, Save, FileText,
    Calendar, DollarSign, Truck, AlertTriangle, QrCode
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProdutoSelecionado {
    produto_id: number;
    produto_nome: string;
    quantidade: number;
    custo_unitario: number;
    lote: string;
    validade: string;
}

export default function NovaEntradaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Dados para Selects
    const [fornecedores, setFornecedores] = useState<any[]>([]);
    const [produtosBusca, setProdutosBusca] = useState<any[]>([]);

    // Estado do Formulário (Cabeçalho)
    const [fornecedor, setFornecedor] = useState('');
    const [numeroNota, setNumeroNota] = useState('');
    const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
    const [observacoes, setObservacoes] = useState('');

    // Estado dos Itens
    const [itens, setItens] = useState<ProdutoSelecionado[]>([]);

    // Estado temporário para adição de item
    const [buscaTermo, setBuscaTermo] = useState('');
    const [prodTemp, setProdTemp] = useState<any>(null);
    const [qtdTemp, setQtdTemp] = useState('');
    const [custoTemp, setCustoTemp] = useState('');
    // const [loteTemp, setLoteTemp] = useState(''); // REMOVIDO: Lote automático
    const [validadeTemp, setValidadeTemp] = useState('');

    useEffect(() => {
        carregarFornecedores();
    }, []);

    const carregarFornecedores = async () => {
        try {
            const res = await api.get('/fornecedores/');
            setFornecedores(res.data.results || res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const buscarProdutos = async (termo: string) => {
        if (termo.length < 2) return;
        try {
            const res = await api.get(`/produtos/catalogo/busca/?q=${termo}`);
            setProdutosBusca(res.data.results || res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const adicionarItem = () => {
        if (!prodTemp || !qtdTemp || !custoTemp) {
            toast.error('Preencha produto, quantidade e custo.');
            return;
        }

        const novoItem: ProdutoSelecionado = {
            produto_id: prodTemp.produto.id,
            produto_nome: prodTemp.produto.nome,
            quantidade: parseInt(qtdTemp),
            custo_unitario: parseFloat(custoTemp),
            lote: 'AUTO', // Placeholder, backend gera
            validade: validadeTemp
        };

        setItens([...itens, novoItem]);

        // Limpar campos de item
        setProdTemp(null);
        setBuscaTermo('');
        setQtdTemp('');
        setCustoTemp('');
        setValidadeTemp('');
        setProdutosBusca([]);
    };

    const removerItem = (index: number) => {
        const novos = [...itens];
        novos.splice(index, 1);
        setItens(novos);
    };

    const calcularTotal = () => {
        return itens.reduce((acc, item) => acc + (item.quantidade * item.custo_unitario), 0);
    };

    const finalizarEntrada = async () => {
        if (!fornecedor || !numeroNota || itens.length === 0) {
            toast.error('Preencha fornecedor, número da nota e adicione itens.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                fornecedor: fornecedor,
                numero_nota: numeroNota,
                data_emissao: dataEmissao,
                observacoes: observacoes,
                itens: itens.map(i => ({
                    produto: i.produto_id,
                    quantidade: i.quantidade,
                    preco_custo_unitario: i.custo_unitario,
                    lote: 'AUTO', // Backend irá ignorar e gerar
                    data_validade: i.validade || null
                }))
            };

            await api.post('/produtos/entradas/', payload);

            toast.success('Entrada registrada com sucesso!');
            toast.success('Lotes gerados automaticamente pelo sistema.');

            router.push('/dashboard/estoque');

        } catch (error) {
            console.error(error);
            toast.error('Erro ao finalizar entrada.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <PackagePlus className="text-blue-600" size={32} />
                    Nova Entrada de Estoque
                </h1>
                <p className="text-gray-500 mt-1">Registre compras. Os lotes serão gerados automaticamente para controle único.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Esquerda: Dados da Nota */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                            <FileText size={18} /> Dados da Nota Fiscal
                        </h3>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Fornecedor</label>
                            <select
                                value={fornecedor}
                                onChange={e => setFornecedor(e.target.value)}
                                className="w-full p-2 border border-blue-100 bg-blue-50/30 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecione...</option>
                                {fornecedores.map(f => (
                                    <option key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Número da Nota</label>
                            <input
                                type="text"
                                value={numeroNota}
                                onChange={e => setNumeroNota(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: NF-00123"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Data Emissão</label>
                            <input
                                type="date"
                                value={dataEmissao}
                                onChange={e => setDataEmissao(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Observações</label>
                            <textarea
                                value={observacoes}
                                onChange={e => setObservacoes(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Itens */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Adicionar Produto */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                            <Plus size={18} /> Adicionar Produtos
                        </h3>

                        {/* Busca */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={buscaTermo}
                                onChange={e => {
                                    setBuscaTermo(e.target.value);
                                    buscarProdutos(e.target.value);
                                }}
                                placeholder="Buscar produto..."
                                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {produtosBusca.length > 0 && !prodTemp && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl rounded-lg mt-1 z-10 max-h-60 overflow-y-auto">
                                    {produtosBusca.map((item: any) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setProdTemp(item);
                                                setBuscaTermo(item.produto?.nome || item.nome);
                                                setProdutosBusca([]);
                                            }}
                                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-50"
                                        >
                                            <span className="font-bold text-gray-800">{item.produto?.nome || item.nome}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Campos da Linha */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Quantidade</label>
                                <input
                                    type="number"
                                    value={qtdTemp}
                                    onChange={e => setQtdTemp(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Custo Unit.</label>
                                <input
                                    type="number"
                                    value={custoTemp}
                                    onChange={e => setCustoTemp(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                                />
                            </div>

                            {/* CAMPO DE LOTE REMOVIDO - MOSTRANDO INFO VISUAL */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">Lote (Sistema)</label>
                                <div className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-xs flex items-center gap-1 cursor-not-allowed">
                                    <QrCode size={14} /> Automático
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Validade</label>
                                <input
                                    type="date"
                                    value={validadeTemp}
                                    onChange={e => setValidadeTemp(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={adicionarItem}
                            disabled={!prodTemp}
                            className="w-full py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                            ADICIONAR À LISTA
                        </button>
                    </div>

                    {/* Lista */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-black text-gray-500 uppercase">Produto</th>
                                    <th className="text-center py-3 px-4 text-xs font-black text-gray-500 uppercase">Qtd</th>
                                    <th className="text-center py-3 px-4 text-xs font-black text-gray-500 uppercase">Lote</th>
                                    <th className="text-right py-3 px-4 text-xs font-black text-gray-500 uppercase">Total</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {itens.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-sm">{item.produto_nome}</p>
                                        </td>
                                        <td className="py-3 px-4 text-center font-bold">{item.quantidade}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">AUTO</span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold">
                                            {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(item.quantidade * item.custo_unitario)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => removerItem(idx)} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            CANCELAR
                        </button>
                        <button
                            onClick={finalizarEntrada}
                            disabled={loading || itens.length === 0}
                            className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={18} />
                            FINALIZAR ENTRADA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
