'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Search, Trash2, Plus, CreditCard, User, Minus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Receipt } from '@/components/Receipt';
import CadastroClienteModal from '@/components/CadastroClienteModal';
import ReceitaUploader from '@/components/ReceitaUploader';

interface ProdutoEstoque {
    id: number;
    produto_nome: string;
    preco_venda: string;
    quantidade: number;
    lote: string;
}

interface ItemCarrinho extends ProdutoEstoque {
    qtdVenda: number;
}

export default function VendasPOSPage() {
    const [busca, setBusca] = useState('');
    const [resultados, setResultados] = useState<ProdutoEstoque[]>([]);
    const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
    const [cliente, setCliente] = useState(''); // Nome ou NUIT opcional
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');
    const [recibo, setRecibo] = useState<any>(null); // Dados do recibo após venda
    const [loadingBusca, setLoadingBusca] = useState(false);
    const [finalizando, setFinalizando] = useState(false);
    const [showCadastroCliente, setShowCadastroCliente] = useState(false);
    const [sugestoesClientes, setSugestoesClientes] = useState<any[]>([]);
    const [receitaFile, setReceitaFile] = useState<File | null>(null); // Receita médica

    // Busca produtos no estoque local
    useEffect(() => {
        const timer = setTimeout(() => {
            if (busca.length > 2) {
                buscarProdutos(busca);
            } else if (busca.length === 0) {
                buscarProdutos('');
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [busca]);

    const buscarProdutos = async (query: string) => {
        setLoadingBusca(true);
        try {
            const res = await api.get(`/produtos/meu-estoque/?search=${query}`);
            setResultados(res.data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingBusca(false);
        }
    };

    const adicionarAoCarrinho = (prod: ProdutoEstoque) => {
        // Verifica se tem estoque
        if (prod.quantidade <= 0) {
            toast.error(`"${prod.produto_nome}" está sem estoque!`);
            return;
        }

        setCarrinho(prev => {
            const existente = prev.find(p => p.id === prod.id);
            if (existente) {
                if (existente.qtdVenda >= prod.quantidade) {
                    toast.error('Limite de estoque atingido!');
                    return prev;
                }
                return prev.map(p => p.id === prod.id ? { ...p, qtdVenda: p.qtdVenda + 1 } : p);
            }
            return [...prev, { ...prod, qtdVenda: 1 }];
        });

        // Se estava buscando, limpa para voltar ao catálogo original.
        // Se já estava no catálogo (busca vazia), não faz nada para evitar recarregamento.
        if (busca.length > 0) {
            setBusca('');
        }

        toast.success(`${prod.produto_nome} adicionado`, {
            duration: 1000,
            position: 'bottom-center'
        });
    };

    const removerDoCarrinho = (id: number) => {
        setCarrinho(prev => prev.filter(p => p.id !== id));
    };

    const totalVenda = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco_venda) * item.qtdVenda), 0);

    const finalizarVenda = async () => {
        if (carrinho.length === 0) return;
        setFinalizando(true);
        try {
            // 1. Criar pedido SEM receita (JSON normal)
            const payload = {
                itens: carrinho.map(item => ({
                    estoque_id: item.id,
                    quantidade: item.qtdVenda,
                    preco_unitario: item.preco_venda
                })),
                cliente: cliente || 'Consumidor Final',
                tipo_pagamento: metodoPagamento
            };

            const res = await api.post('/pedidos/venda-balcao/', payload);
            const pedidoId = res.data.id;

            // 2. Se houver receita, fazer upload separado
            if (receitaFile && pedidoId) {
                const formData = new FormData();
                formData.append('receita_medica', receitaFile);

                try {
                    await api.patch(`/pedidos/${pedidoId}/`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                } catch (uploadError) {
                    console.error('Erro ao fazer upload da receita:', uploadError);
                    toast.warning('Venda criada, mas erro ao anexar receita');
                }
            }

            toast.success('Venda realizada!');
            setRecibo(res.data);
            setCarrinho([]);
            setCliente('');
            setReceitaFile(null);
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Erro ao finalizar venda.';
            toast.error(errorMsg);
        } finally {
            setFinalizando(false);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6">
            {/* Área Esquerda: Busca e Resultados */}
            <div className="flex-1 flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Ponto de Venda (POS)</h1>
                    <div className="relative">
                        <input
                            type="text"
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            placeholder="Buscar produto (Nome ou Código de Barras)..."
                            className="w-full pl-12 pr-4 py-4 text-lg bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-700">
                            {busca.length > 0 ? `Resultados para "${busca}"` : 'Produtos em Estoque'}
                        </h2>
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
                            {resultados.length} produtos encontrados
                        </span>
                    </div>

                    {loadingBusca ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-sm font-medium text-gray-600 tracking-wide uppercase">Sincronizando estoque...</p>
                        </div>
                    ) : (
                        <>
                            {resultados.length === 0 ? (
                                <div className="text-center py-24 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed">
                                    <Search size={48} className="mx-auto mb-4 opacity-5" />
                                    <p className="text-lg font-bold text-gray-500">Nenhum produto encontrado</p>
                                    <p className="text-sm">Tente buscar por outro nome ou código</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {resultados.map(prod => (
                                        <button
                                            key={prod.id}
                                            onClick={() => adicionarAoCarrinho(prod)}
                                            className="group flex flex-col bg-white border border-gray-100 rounded-2xl p-4 text-left transition-all hover:shadow-2xl hover:border-blue-500 hover:-translate-y-1 active:scale-95"
                                        >
                                            <div className="w-full aspect-square bg-gray-50 rounded-xl mb-4 flex items-center justify-center group-hover:bg-blue-50 transition-colors relative overflow-hidden shadow-inner">
                                                <div className="text-blue-500 font-black text-3xl opacity-10 uppercase tracking-tighter">
                                                    {prod.produto_nome.substring(0, 2)}
                                                </div>

                                                {/* Badges de Status */}
                                                {prod.quantidade <= 5 && prod.quantidade > 0 && (
                                                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                                        CRÍTICO
                                                    </div>
                                                )}
                                                {prod.quantidade === 0 && (
                                                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Esgotado</span>
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-blue-600 leading-tight">
                                                {prod.produto_nome}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-gray-500 font-bold mb-4">
                                                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-400">Lote: {prod.lote}</span>
                                                <span className={`px-2 py-0.5 rounded ${prod.quantidade > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {prod.quantidade} UNID
                                                </span>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                                                <span className="text-base font-black text-gray-900 tracking-tight">
                                                    {formatPrice(parseFloat(prod.preco_venda))}
                                                </span>
                                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:rotate-90 transition-all duration-300 group-hover:bg-blue-700 group-hover:shadow-blue-200">
                                                    <Plus size={20} strokeWidth={3} />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Área Direita: Carrinho e Checkout */}
            <div className="w-96 bg-white border-l shadow-xl flex flex-col h-full rounded-l-2xl">
                <div className="p-6 bg-gray-50 border-b">
                    <div className="flex items-center gap-2 text-gray-700 mb-4">
                        <User size={20} />
                        <input
                            type="text"
                            placeholder="Cliente (Opcional)"
                            className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                            value={cliente}
                            onChange={e => setCliente(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <ShoppingCart size={20} /> Carrinho
                        </h2>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                            {carrinho.reduce((acc, i) => acc + i.qtdVenda, 0)} itens
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {carrinho.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                            <div className="flex-1">
                                <div className="font-medium text-sm line-clamp-1">{item.produto_nome}</div>
                                <div className="text-xs text-gray-500">
                                    {item.qtdVenda} x {formatPrice(parseFloat(item.preco_venda))}
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <div className="font-bold text-gray-800">
                                    {formatPrice(parseFloat(item.preco_venda) * item.qtdVenda)}
                                </div>

                                <div className="flex items-center gap-1 bg-white border rounded-lg shadow-sm">
                                    <button
                                        onClick={() => {
                                            if (item.qtdVenda > 1) {
                                                setCarrinho(prev => prev.map(p => p.id === item.id ? { ...p, qtdVenda: p.qtdVenda - 1 } : p));
                                            } else {
                                                removerDoCarrinho(item.id);
                                            }
                                        }}
                                        className="p-1 hover:bg-gray-100 text-gray-600 rounded-l-lg"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="text-xs font-bold w-4 text-center">{item.qtdVenda}</span>
                                    <button
                                        onClick={() => {
                                            if (item.qtdVenda < item.quantidade) {
                                                setCarrinho(prev => prev.map(p => p.id === item.id ? { ...p, qtdVenda: p.qtdVenda + 1 } : p));
                                            } else {
                                                toast.error('Estoque máximo atingido!');
                                            }
                                        }}
                                        className="p-1 hover:bg-gray-100 text-blue-600 rounded-r-lg"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removerDoCarrinho(item.id)}
                                    className="text-red-500 hover:text-red-700 p-1 mt-1 text-xs flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Remover
                                </button>
                            </div>
                        </div>
                    ))}
                    {carrinho.length === 0 && (
                        <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                            <ShoppingCart size={48} className="mb-2 opacity-20" />
                            <p>Caixa Livre</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-900 text-white mt-auto">
                    {/* Campo Cliente com Busca */}
                    <div className="mb-4 relative">
                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                            <span>Cliente (Opcional)</span>
                            <button
                                type="button"
                                onClick={() => setShowCadastroCliente(true)}
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs normal-case font-normal"
                            >
                                <UserPlus size={14} />
                                Cadastrar Novo
                            </button>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={cliente}
                                onChange={async (e) => {
                                    setCliente(e.target.value);
                                    if (e.target.value.length > 2) {
                                        try {
                                            const res = await api.get(`/clientes/?search=${e.target.value}`);
                                            setSugestoesClientes(res.data.results || res.data);
                                        } catch (error) {
                                            console.error(error);
                                        }
                                    } else {
                                        setSugestoesClientes([]);
                                    }
                                }}
                                placeholder="Nome, Telefone ou NUIT"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2 outline-none focus:border-blue-500"
                            />
                            {sugestoesClientes.length > 0 && (
                                <div className="absolute bottom-full left-0 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-2xl mb-1 overflow-hidden z-20">
                                    {sugestoesClientes.map((c: any) => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                setCliente(c.nome_completo || '');
                                                setSugestoesClientes([]);
                                            }}
                                            className="w-full text-left p-3 hover:bg-gray-700 border-b border-gray-700 last:border-0 flex flex-col"
                                        >
                                            <span className="font-bold text-sm">{c.nome_completo}</span>
                                            <span className="text-[10px] text-gray-500">{c.telefone} | {c.email || 'Sem email'}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Busca global de clientes cadastrados</p>
                    </div>

                    {/* Método de Pagamento */}
                    <div className="mb-4">
                        <label className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1 block">Pagamento</label>
                        <select
                            value={metodoPagamento}
                            onChange={e => setMetodoPagamento(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2 outline-none focus:border-blue-500"
                        >
                            <option value="DINHEIRO">Dinheiro (Cash)</option>
                            <option value="POS">POS / Cartão</option>
                            <option value="MPESA">M-Pesa</option>
                            <option value="EMOLA">e-Mola</option>
                        </select>
                    </div>

                    {/* Upload de Receita Médica */}
                    <div className="mb-6">
                        <ReceitaUploader
                            onImageSelect={setReceitaFile}
                            currentImage={receitaFile}
                        />
                    </div>

                    <div className="flex justify-between items-end mb-6">
                        <span className="text-gray-400">Total a Pagar</span>
                        <span className="text-3xl font-bold">{formatPrice(totalVenda)}</span>
                    </div>
                    <button
                        onClick={finalizarVenda}
                        disabled={carrinho.length === 0 || finalizando}
                        className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {finalizando ? (
                            'Processando...'
                        ) : (
                            <>
                                <CreditCard size={24} /> Finalizar Venda
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Modal de Recibo Fiscal Profissional */}
            {recibo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:block">
                    <div className="flex flex-col gap-6 items-center animate-in zoom-in duration-300">

                        {/* Wrapper do Recibo para Impressão */}
                        <div className="print:w-full print:h-full print:absolute print:top-0 print:left-0 text-left">
                            <Receipt
                                pharmacyName={recibo.farmacia?.nome || 'Farmácia GestorFarma'}
                                pharmacyAddress={recibo.farmacia?.endereco || 'Endereço Principal'}
                                nuit={recibo.farmacia?.nuit || 'PENDENTE'}
                                date={new Date(recibo.data).toLocaleDateString('pt-MZ')}
                                orderId={recibo.numero}
                                items={recibo.itens || []}
                                subtotal={recibo.subtotal || recibo.total / 1.16}
                                tax={recibo.tax || recibo.total - (recibo.total / 1.16)}
                                total={recibo.total}
                                qrCodeData={recibo.qrcode || `PEDIDO-${recibo.numero}`}
                            />
                        </div>

                        {/* Botões de Ação (Escondidos na Impressão) */}
                        <div className="flex gap-4 print:hidden">
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2"
                            >
                                <CreditCard size={20} /> IMPRIMIR RECIBO
                            </button>
                            <button
                                onClick={() => setRecibo(null)}
                                className="px-6 py-3 bg-white text-gray-800 rounded-lg font-bold hover:bg-gray-100 shadow-lg"
                            >
                                FECHAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cadastro Cliente */}
            {showCadastroCliente && (
                <CadastroClienteModal
                    isOpen={true}
                    onClose={() => setShowCadastroCliente(false)}
                    onSuccess={(clienteNome) => {
                        setCliente(clienteNome);
                        setShowCadastroCliente(false);
                        toast.success('Cliente cadastrado com sucesso!');
                    }}
                />
            )}
        </div>
    );
}
