'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign } from 'lucide-react';
import ReceitaUploader from '@/components/ReceitaUploader';

interface Produto {
    id: number;
    produto_nome: string;
    preco_venda: string;
    quantidade: number;
}

interface ItemCarrinho extends Produto {
    qtdVenda: number;
}

export default function VendasPage() {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
    const [cliente, setCliente] = useState('');
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');
    const [receitaFile, setReceitaFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProdutos();
    }, []);

    const fetchProdutos = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/v1/produtos/meu-estoque/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            const data = await res.json();
            setProdutos(data.results || data);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    };

    const adicionarAoCarrinho = (produto: Produto) => {
        const index = carrinho.findIndex(item => item.id === produto.id);

        if (index >= 0) {
            const novoCarrinho = [...carrinho];
            if (novoCarrinho[index].qtdVenda < produto.quantidade) {
                novoCarrinho[index].qtdVenda++;
                setCarrinho(novoCarrinho);
            } else {
                alert('Estoque máximo atingido');
            }
        } else {
            setCarrinho([...carrinho, { ...produto, qtdVenda: 1 }]);
        }
    };

    const removerDoCarrinho = (id: number) => {
        setCarrinho(carrinho.filter(item => item.id !== id));
    };

    const alterarQuantidade = (id: number, delta: number) => {
        const novoCarrinho = carrinho.map(item => {
            if (item.id === id) {
                const novaQtd = item.qtdVenda + delta;
                if (novaQtd > 0 && novaQtd <= item.quantidade) {
                    return { ...item, qtdVenda: novaQtd };
                }
            }
            return item;
        });
        setCarrinho(novoCarrinho);
    };

    const total = carrinho.reduce((sum, item) =>
        sum + (parseFloat(item.preco_venda) * item.qtdVenda), 0
    );

    const finalizarVenda = async () => {
        if (carrinho.length === 0) {
            alert('Carrinho vazio');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();

            // Adicionar itens como JSON string
            formData.append('itens', JSON.stringify(
                carrinho.map(item => ({
                    estoque_id: item.id,
                    quantidade: item.qtdVenda,
                    preco_unitario: item.preco_venda
                }))
            ));

            formData.append('cliente', cliente || 'Consumidor Final');
            formData.append('tipo_pagamento', metodoPagamento);

            // Adicionar receita se existir
            if (receitaFile) {
                formData.append('receita_medica', receitaFile);
            }

            const res = await fetch('http://localhost:8000/api/v1/pedidos/venda-balcao/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                alert(`✅ Venda realizada!\nPedido #${data.numero}\nTotal: ${total.toFixed(2)} MT`);
                setCarrinho([]);
                setCliente('');
                setReceitaFile(null);
            } else {
                alert('Erro ao processar venda');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao processar venda');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8" />
                    Ponto de Venda (POS)
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista de Produtos */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">Produtos Disponíveis</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                            {produtos.map(produto => (
                                <div
                                    key={produto.id}
                                    className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                                    onClick={() => adicionarAoCarrinho(produto)}
                                >
                                    <h3 className="font-semibold text-gray-800">{produto.produto_nome}</h3>
                                    <p className="text-sm text-gray-600">Estoque: {produto.quantidade}</p>
                                    <p className="text-lg font-bold text-green-600 mt-2">
                                        {parseFloat(produto.preco_venda).toFixed(2)} MT
                                    </p>
                                    <button className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                                        + Adicionar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Carrinho */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">Carrinho</h2>

                        {/* Cliente */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cliente (Opcional)
                            </label>
                            <input
                                type="text"
                                value={cliente}
                                onChange={(e) => setCliente(e.target.value)}
                                placeholder="Nome do cliente"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Método de Pagamento */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Método de Pagamento
                            </label>
                            <select
                                value={metodoPagamento}
                                onChange={(e) => setMetodoPagamento(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="DINHEIRO">Dinheiro</option>
                                <option value="POS">POS / Cartão</option>
                                <option value="MPESA">M-Pesa</option>
                                <option value="EMOLA">e-Mola</option>
                            </select>
                        </div>

                        {/* Upload de Receita */}
                        <div className="mb-4">
                            <ReceitaUploader
                                onImageSelect={setReceitaFile}
                                currentImage={receitaFile}
                            />
                        </div>

                        {/* Itens do Carrinho */}
                        <div className="border-t pt-4 mb-4 max-h-[200px] overflow-y-auto">
                            {carrinho.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">Carrinho vazio</p>
                            ) : (
                                carrinho.map(item => (
                                    <div key={item.id} className="flex items-center justify-between mb-3 pb-3 border-b">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.produto_nome}</p>
                                            <p className="text-xs text-gray-600">
                                                {item.qtdVenda} x {parseFloat(item.preco_venda).toFixed(2)} MT
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => alterarQuantidade(item.id, -1)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="font-bold">{item.qtdVenda}</span>
                                            <button
                                                onClick={() => alterarQuantidade(item.id, 1)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => removerDoCarrinho(item.id)}
                                                className="p-1 hover:bg-red-100 rounded text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Total e Finalizar */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-bold">TOTAL:</span>
                                <span className="text-2xl font-bold text-green-600">
                                    {total.toFixed(2)} MT
                                </span>
                            </div>

                            <button
                                onClick={finalizarVenda}
                                disabled={loading || carrinho.length === 0}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    'PROCESSANDO...'
                                ) : (
                                    <>
                                        <DollarSign className="w-5 h-5" />
                                        FINALIZAR VENDA
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
