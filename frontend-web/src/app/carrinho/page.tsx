'use client';

import { useCartStore } from '@/store/useCartStore';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CarrinhoPage() {
    const { items, removeItem, updateQuantity, total } = useCartStore();
    const router = useRouter();

    const valorTotal = total();

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-400">
                    <ShoppingBag size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Seu carrinho está vazio</h1>
                <p className="text-gray-500 mb-8 max-w-md">Parece que você ainda não adicionou nenhum medicamento. Que tal pesquisar algo?</p>
                <Link
                    href="/busca"
                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                    Buscar Medicamentos
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Simples */}
            <header className="bg-white border-b sticky top-0 z-10 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800">
                        <ArrowLeft />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Carrinho ({items.length})</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">

                {/* Lista de Itens */}
                <div className="md:col-span-2 space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 items-center">
                            {/* Imagem */}
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center border text-2xl">
                                {item.imagem ? (
                                    <img src={item.imagem} className="w-full h-full object-cover rounded-lg" alt={item.produto_nome} />
                                ) : '💊'}
                            </div>

                            {/* Detalhes */}
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">{item.produto_nome}</h3>
                                <p className="text-xs text-gray-500 mb-2">Vendido por: {item.farmacia_nome}</p>
                                <div className="font-bold text-blue-600">
                                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(item.preco)}
                                </div>
                            </div>

                            {/* Controles */}
                            <div className="flex flex-col items-end gap-3">
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-red-400 hover:text-red-600 p-1"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="font-bold text-gray-800 w-4 text-center">{item.quantidade}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm hover:bg-gray-100 text-gray-600"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resumo do Pedido */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
                        <h2 className="font-bold text-lg mb-4 text-gray-800">Resumo</h2>
                        <div className="space-y-2 text-sm text-gray-600 mb-4 border-b pb-4">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valorTotal)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Entrega Estimada</span>
                                <span>Calculado no Checkout</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-bold text-xl text-gray-900 mb-6">
                            <span>Total</span>
                            <span>{new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valorTotal)}</span>
                        </div>

                        <Link
                            href="/checkout"
                            className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            FECHAR PEDIDO
                        </Link>

                        <Link
                            href="/busca"
                            className="block w-full text-center py-3 text-gray-500 hover:text-blue-600 text-sm mt-2 font-medium"
                        >
                            Continuar Comprando
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    );
}
