'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Search, Trash2, Plus, CreditCard, User, Minus, UserPlus, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { Receipt } from '@/components/Receipt';
import CadastroClienteModal from '@/components/CadastroClienteModal';
import ReceitaUploader from '@/components/ReceitaUploader';

interface ProdutoEstoque {
    id: number;
    produto_nome: string;
    preco_venda: string;
    preco_venda_avulso?: string;
    quantidade: number;
    quantidade_minima?: number;
    lote: string;
    permite_venda_avulsa?: boolean;
    unidades_por_caixa?: number;
    quantidade_formatada?: string;
    fabricante?: string;
    pais_origem?: string;
}

interface ItemCarrinho extends ProdutoEstoque {
    qtdVenda: number;
    isAvulso: boolean;
    precoVendaEfetivo: string;
}

export default function VendasPOSPage() {
    const [busca, setBusca] = useState('');
    const [resultados, setResultados] = useState<ProdutoEstoque[]>([]);
    const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
    const [cliente, setCliente] = useState(''); // Nome ou NUIT opcional
    const [clienteId, setClienteId] = useState<number | null>(null);
    const [metodoPagamento, setMetodoPagamento] = useState('DINHEIRO');
    const [recibo, setRecibo] = useState<any>(null); // Dados do recibo após venda
    const [loadingBusca, setLoadingBusca] = useState(false);
    const [finalizando, setFinalizando] = useState(false);
    const [showCadastroCliente, setShowCadastroCliente] = useState(false);
    const [sugestoesClientes, setSugestoesClientes] = useState<any[]>([]);
    const [receitaFile, setReceitaFile] = useState<File | null>(null); // Receita médica

    // Pagamento a Dinheiro
    const totalVenda = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco_venda) * item.qtdVenda), 0);
    const [valorRecebido, setValorRecebido] = useState<string>('');
    const troco = parseFloat(valorRecebido) > 0 ? parseFloat(valorRecebido) - totalVenda : 0;

    // Verificação de Caixa Aberto (Logica Primavera)
    const [caixaAberto, setCaixaAberto] = useState<boolean>(false);
    const [verificandoCaixa, setVerificandoCaixa] = useState(true);

    useEffect(() => {
        verificarCaixa();
    }, []);

    const verificarCaixa = async () => {
        try {
            const res = await api.get('/caixa/sessao/');
            if (res.data.status === 'SEM_SESSAO') {
                setCaixaAberto(false);
                toast.error('Caixa fechado! Abra o caixa para vender.', { duration: 5000 });
            } else {
                setCaixaAberto(true);
            }
        } catch (error: any) {
            console.error('Erro ao verificar caixa:', error.response?.data || error.message);
        } finally {
            setVerificandoCaixa(false);
        }
    };

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
            const data = res.data.results || [];
            setResultados(data);

            // LOGICA AUTO-ADD PARA BARCODE
            if (data.length === 1 && query.length >= 8) {
                const item = data[0];
                if (item.produto_codigo === query || /^\d+$/.test(query)) {
                    adicionarAoCarrinho(item);
                    setBusca('');
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingBusca(false);
        }
    };

    const adicionarAoCarrinho = (prod: ProdutoEstoque, isAvulso: boolean = false) => {
        if (prod.quantidade <= 0) {
            toast.error(`"${prod.produto_nome}" está sem estoque!`);
            return;
        }

        const precoEfetivo = isAvulso && prod.preco_venda_avulso ? prod.preco_venda_avulso : prod.preco_venda;

        setCarrinho(prev => {
            const itemKey = `${prod.id}-${isAvulso}`;
            const existente = prev.find(p => `${p.id}-${p.isAvulso}` === itemKey);

            if (existente) {
                if (existente.qtdVenda >= prod.quantidade) {
                    toast.error('Limite de estoque atingido!');
                    return prev;
                }
                return prev.map(p => `${p.id}-${p.isAvulso}` === itemKey ? { ...p, qtdVenda: p.qtdVenda + 1 } : p);
            }
            return [...prev, { ...prod, qtdVenda: 1, isAvulso, precoVendaEfetivo: precoEfetivo }];
        });

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

    const finalizarVenda = async () => {
        if (carrinho.length === 0) return;
        setFinalizando(true);
        try {
            const payload = {
                itens: carrinho.map(item => ({
                    estoque_id: item.id,
                    quantidade: item.qtdVenda,
                    preco_unitario: item.precoVendaEfetivo,
                    is_avulso: item.isAvulso
                })),
                cliente: cliente || 'Consumidor Final',
                cliente_id: clienteId, // DERRUBANDO PRIMAVERA: Vínculo Real
                tipo_pagamento: metodoPagamento,
                valor_pago: parseFloat(valorRecebido) || totalVenda,
                troco: troco > 0 ? troco : 0
            };

            const res = await api.post('/pedidos/venda-balcao/', payload);
            const pedidoId = res.data.id;

            if (receitaFile && pedidoId) {
                const formData = new FormData();
                formData.append('receita_medica', receitaFile);
                try {
                    await api.patch(`/pedidos/${pedidoId}/`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                } catch (uploadError) {
                    toast.warning('Venda criada, mas erro ao anexar receita');
                }
            }

            toast.success('Venda realizada!');
            setRecibo(res.data);
            setCarrinho([]);
            setCliente('');
            setClienteId(null);
            setReceitaFile(null);
            setValorRecebido('');
        } catch (error: any) {
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
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {resultados.map(prod => {
                                const isCritico = prod.quantidade <= (prod.quantidade_minima || 10);
                                const statusColor = isCritico ? 'bg-rose-500' : 'bg-emerald-500';
                                const statusText = isCritico ? 'CRÍTICO' : 'BOM';
                                const statusMsg = isCritico ? `Stock abaixo do mínimo (${prod.quantidade_minima || 10} un)` : 'Stock em nível saudável';

                                return (
                                    <div
                                        key={prod.id}
                                        className="group flex flex-col bg-white border border-gray-100 rounded-2xl p-4 text-left transition-all hover:shadow-xl hover:border-blue-200 relative"
                                        title={statusMsg}
                                    >
                                        <div className="w-full aspect-square bg-gray-50 rounded-xl mb-4 flex items-center justify-center group-hover:bg-blue-50 transition-colors relative overflow-hidden shadow-inner">
                                            <div className="text-blue-500 font-black text-3xl opacity-10 uppercase tracking-tighter">
                                                {prod.produto_nome.substring(0, 2)}
                                            </div>

                                            <div className={`absolute top-2 right-2 ${statusColor} text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1`}>
                                                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                                {statusText}
                                            </div>

                                            {prod.quantidade === 0 ? (
                                                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                                    <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Esgotado</span>
                                                </div>
                                            ) : (
                                                <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded-lg shadow-sm border border-gray-100">
                                                    <span className="text-[10px] font-black text-gray-700 uppercase">{prod.quantidade_formatada}</span>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-0 leading-tight">
                                            {prod.produto_nome}
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-2">
                                            {prod.fabricante || 'Fabricante N/D'} • {prod.pais_origem || 'Origem N/D'}
                                        </p>

                                        <div className="mt-auto space-y-2">
                                            {/* Preço Normal / Caixa */}
                                            <button
                                                onClick={() => adicionarAoCarrinho(prod, false)}
                                                className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-50 hover:bg-blue-600 group/btn transition-all border border-blue-100"
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className="text-[10px] font-bold text-blue-600 group-hover/btn:text-blue-100 uppercase">CAIXA Toda</span>
                                                    <span className="text-[9px] text-blue-400 group-hover/btn:text-blue-200 mt-[-2px]">-{prod.unidades_por_caixa || 1} un</span>
                                                    <span className="text-sm font-black text-blue-900 group-hover/btn:text-white">
                                                        {formatPrice(parseFloat(prod.preco_venda))}
                                                    </span>
                                                </div>
                                                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover/btn:bg-white group-hover/btn:text-blue-600 transition-colors">
                                                    <Plus size={16} strokeWidth={3} />
                                                </div>
                                            </button>

                                            {/* Preço Avulso (Opcional) */}
                                            {prod.permite_venda_avulsa && (
                                                <button
                                                    onClick={() => adicionarAoCarrinho(prod, true)}
                                                    className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 group/btn transition-all border border-emerald-100"
                                                >
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-[10px] font-bold text-emerald-600 group-hover/btn:text-emerald-100 uppercase">CARTEIRA</span>
                                                        <span className="text-[9px] text-emerald-400 group-hover/btn:text-emerald-200 mt-[-2px]">-1 unit</span>
                                                        <span className="text-sm font-black text-emerald-900 group-hover/btn:text-white">
                                                            {formatPrice(parseFloat(prod.preco_venda_avulso || '0'))}
                                                        </span>
                                                    </div>
                                                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover/btn:bg-white group-hover/btn:text-emerald-600 transition-colors">
                                                        <Plus size={16} strokeWidth={3} />
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay de Loading Inicial (Superando Primavera) */}
            {verificandoCaixa && (
                <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Validando Sessão de Caixa...</p>
                    </div>
                </div>
            )}

            {/* Bloqueio de Caixa Fechado (Logica Primavera) */}
            {!caixaAberto && !verificandoCaixa && (
                <div className="fixed inset-0 z-[60] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                    <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 max-w-md space-y-6">
                        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Lock size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Terminal Bloqueado</h2>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Este terminal de vendas está bloqueado porque não existe um turno de caixa aberto para você.
                        </p>
                        <div className="pt-4">
                            <Link
                                href="/dashboard/caixa"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl uppercase tracking-widest text-xs"
                            >
                                <Unlock size={18} /> Abrir Meu Caixa
                            </Link>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Padrão Fiscal GestorFarma v1.0</p>
                    </div>
                </div>
            )}

            {/* Área Direita: Carrinho e Checkout */}
            <div className="w-96 bg-white border-l shadow-xl flex flex-col h-full rounded-l-2xl">
                <div className="p-3 bg-gray-50 border-b space-y-2">
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="font-bold text-sm flex items-center gap-2 text-gray-800 uppercase tracking-tighter">
                            <ShoppingCart size={18} className="text-blue-600" /> Carrinho
                        </h2>
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] font-black">
                            {carrinho.reduce((acc, i) => acc + i.qtdVenda, 0)} ITENS
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 border-t pt-2 border-gray-200">
                        <div className="relative">
                            <input
                                type="text"
                                value={cliente}
                                onChange={async (e) => {
                                    setCliente(e.target.value);
                                    if (e.target.value === '') setClienteId(null);
                                    if (e.target.value.length > 2) {
                                        try {
                                            const res = await api.get(`/clientes/?search=${e.target.value}`);
                                            setSugestoesClientes(res.data.results || res.data);
                                        } catch (error) { }
                                    } else { setSugestoesClientes([]); }
                                }}
                                placeholder="Cliente (Nome ou NUIT)..."
                                className="w-full bg-white border border-gray-200 text-[11px] rounded-lg p-1.5 outline-none focus:border-blue-500 shadow-sm"
                            />
                            {sugestoesClientes.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-2xl mt-1 overflow-hidden z-20">
                                    {sugestoesClientes.map((c: any) => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                setCliente(c.nome_completo || '');
                                                setClienteId(c.id);
                                                setSugestoesClientes([]);
                                            }}
                                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex justify-between items-center"
                                        >
                                            <span className="font-bold text-[10px] uppercase">{c.nome_completo}</span>
                                            {parseFloat(c.saldo_atual) > 0 && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded font-black">DEVE</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={metodoPagamento}
                                onChange={e => setMetodoPagamento(e.target.value)}
                                className="flex-1 bg-white border border-gray-200 text-[10px] rounded-lg p-1.5 outline-none focus:border-blue-500 shadow-sm font-bold uppercase"
                            >
                                <option value="DINHEIRO">DINHEIRO</option>
                                <option value="POS">CARTÃO</option>
                                <option value="MPESA">M-PESA</option>
                                <option value="EMOLA">E-MOLA</option>
                                <option value="CREDITO">CRÉDITO</option>
                            </select>

                            {metodoPagamento === 'DINHEIRO' && (
                                <input
                                    type="number"
                                    value={valorRecebido}
                                    onChange={e => setValorRecebido(e.target.value)}
                                    placeholder="Pago..."
                                    className="w-24 bg-white border border-gray-200 text-[10px] rounded-lg p-1.5 outline-none focus:border-blue-500 shadow-sm font-bold"
                                />
                            )}
                        </div>
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
                                <div className="font-bold text-gray-800 text-sm">
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
                                                toast.error('Estoque máximo!');
                                            }
                                        }}
                                        className="p-1 hover:bg-gray-100 text-blue-600 rounded-r-lg"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {carrinho.length === 0 && (
                        <div className="text-center text-gray-400 py-10">
                            <ShoppingCart size={40} className="mx-auto mb-2 opacity-10" />
                            <p className="text-xs uppercase font-bold tracking-widest">Caixa Livre</p>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-gray-900 text-white mt-auto rounded-t-2xl shadow-inner">
                    {metodoPagamento === 'DINHEIRO' && troco > 0 && (
                        <div className="mb-2 flex justify-between items-center bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20 text-xs">
                            <span className="font-black text-yellow-400/70 uppercase">Troco</span>
                            <span className="font-black text-yellow-400">{formatPrice(troco)}</span>
                        </div>
                    )}

                    <div className="mb-3">
                        <ReceitaUploader
                            onImageSelect={setReceitaFile}
                            currentImage={receitaFile}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-[9px] font-black text-gray-500 uppercase block">Total</span>
                            <span className="text-xl font-black">{formatPrice(totalVenda)}</span>
                        </div>
                        <button
                            onClick={finalizarVenda}
                            disabled={carrinho.length === 0 || finalizando}
                            className="px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-20 text-white font-black rounded-xl text-xs transition-all shadow-lg active:scale-95"
                        >
                            {finalizando ? '...' : 'FINALIZAR'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modais */}
            {recibo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:block">
                    <div className="flex flex-col gap-6 items-center animate-in zoom-in duration-300">
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
                                qrCodeData={`https://gestorfarma.vercel.app/verify/${recibo.id}`}
                                sellerName={recibo.vendedor_nome}
                                paymentMethod={recibo.tipo_pagamento}
                                paidAmount={recibo.valor_pago}
                                change={recibo.troco}
                            />
                        </div>
                        <div className="flex gap-4 print:hidden">
                            <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2">
                                <CreditCard size={20} /> IMPRIMIR
                            </button>
                            <button onClick={() => setRecibo(null)} className="px-6 py-3 bg-white text-gray-800 rounded-lg font-bold hover:bg-gray-100 shadow-lg">
                                FECHAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCadastroCliente && (
                <CadastroClienteModal
                    isOpen={true}
                    onClose={() => setShowCadastroCliente(false)}
                    onSuccess={(clienteNome) => {
                        setCliente(clienteNome);
                        setShowCadastroCliente(false);
                        toast.success('Cliente cadastrado!');
                    }}
                />
            )}
        </div>
    );
}
