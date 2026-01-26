'use client';

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, ArrowLeft, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { toast, Toaster } from 'sonner';

interface ResultadoBusca {
    id: number;
    produto_nome: string;
    produto_descricao: string;
    farmacia_nome: string;
    farmacia_id: number;
    preco_venda: number;
    is_disponivel: boolean;
    produto_imagem: string | null;
}

export default function BuscaPage() {
    const searchParams = useSearchParams();
    const queryInicial = searchParams.get('q') || '';

    const { addItem } = useCartStore();
    // Hook chamado no topo, respeitando as regras do React
    const itemsCount = useCartStore(state => state.items.reduce((acc, item) => acc + item.quantidade, 0));

    // Estados da Busca Principal
    const [query, setQuery] = useState(queryInicial);
    const [loading, setLoading] = useState(false);
    const [resultados, setResultados] = useState<ResultadoBusca[]>([]);

    // Estados do Autocomplete
    const [sugestoes, setSugestoes] = useState<ResultadoBusca[]>([]);
    const [mostrandoSugestoes, setMostrandoSugestoes] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Efeito para buscar resultados principais quando a URL muda
    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setQuery(q);
            realizarBusca(q);
        }
    }, [searchParams]);

    // Busca Principal (Exibe na lista grande)
    const realizarBusca = (termo: string) => {
        setLoading(true);
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/produtos/catalogo/busca/?q=${encodeURIComponent(termo)}`)
            .then(res => {
                // Tratando paginação do Django (res.data.results)
                const lista = Array.isArray(res.data) ? res.data : (res.data.results || []);
                setResultados(lista);
                setMostrandoSugestoes(false);
            })
            .catch(err => console.error("Erro na busca", err))
            .finally(() => setLoading(false));
    };

    // Autocomplete (Busca conforme digita)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.length > 2 && mostrandoSugestoes) {
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/produtos/catalogo/busca/?q=${encodeURIComponent(query)}`)
                    .then(res => {
                        const lista = Array.isArray(res.data) ? res.data : (res.data.results || []);
                        setSugestoes(lista.slice(0, 5)); // Limita a 5 sugestões
                    })
                    .catch(() => setSugestoes([]));
            } else {
                setSugestoes([]);
            }
        }, 300); // Debounce de 300ms

        return () => clearTimeout(timeoutId);
    }, [query, mostrandoSugestoes]);

    // Fechar sugestões ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setMostrandoSugestoes(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const formatarPreco = (valor: number) => {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-center" richColors />
            <nav className="bg-white border-b py-4 px-6 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-blue-600">
                        <ArrowLeft />
                    </Link>

                    {/* Barra de Busca com Autocomplete */}
                    <div className="flex-1 relative" ref={searchRef}>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            window.location.href = `/busca?q=${encodeURIComponent(query)}`;
                        }}>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setMostrandoSugestoes(true);
                                }}
                                onFocus={() => setMostrandoSugestoes(true)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent focus:bg-white"
                                placeholder="Buscar medicamentos (ex: Paracetamol)..."
                                autoComplete="off"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => { setQuery(''); setSugestoes([]); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </form>

                        {/* Dropdown de Sugestões do Autocomplete */}
                        {mostrandoSugestoes && sugestoes.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                                {sugestoes.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            setQuery(s.produto_nome);
                                            window.location.href = `/busca?q=${encodeURIComponent(s.produto_nome)}`;
                                        }}
                                        className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            {s.produto_imagem ? (
                                                <img src={s.produto_imagem} className="w-8 h-8 rounded object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs">💊</div>
                                            )}
                                            <div>
                                                <div className="font-medium text-gray-800">{s.produto_nome}</div>
                                                <div className="text-xs text-gray-500">{s.farmacia_nome}</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-blue-600 text-sm">
                                            {formatarPreco(s.preco_venda)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botão do Carrinho */}
                    <Link href="/carrinho" className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <ShoppingCart size={24} />
                        {itemsCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                {itemsCount}
                            </span>
                        )}
                    </Link>

                </div>
            </nav>

            <main className="flex-1 max-w-6xl mx-auto w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-gray-800">
                        {loading ? 'Buscando...' : `Resultados para "${searchParams.get('q') || ''}"`}
                    </h1>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin text-blue-600 mb-4 text-4xl">⏳</div>
                        <p className="text-gray-500">Buscando nas farmácias próximas...</p>
                    </div>
                ) : resultados.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed">
                        <p className="text-gray-500 text-lg">Nenhum medicamento encontrado.</p>
                        <p className="text-sm text-gray-400 mt-2">Tente buscar por nome genérico ou composicão.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {resultados.map(prod => (
                            <div key={prod.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center group hover:border-blue-400 hover:shadow-md transition-all">
                                <div className="flex gap-4 items-center w-full md:w-auto">
                                    {prod.produto_imagem ? (
                                        <img src={prod.produto_imagem} alt={prod.produto_nome} className="w-20 h-20 object-cover rounded-lg border" />
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl border">💊</div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600">{prod.produto_nome}</h3>
                                        <p className="text-sm text-gray-600 font-medium flex items-center gap-1">
                                            🏥 {prod.farmacia_nome}
                                        </p>
                                        {prod.produto_descricao && (
                                            <p className="text-xs text-gray-400 line-clamp-1 max-w-md mt-1">{prod.produto_descricao}</p>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-flex items-center gap-1 ${prod.is_disponivel ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${prod.is_disponivel ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {prod.is_disponivel ? 'Disponível' : 'Esgotado'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right w-full md:w-auto mt-4 md:mt-0 flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-0 pt-3 md:pt-0">
                                    <div className="font-bold text-2xl text-blue-600">
                                        {formatarPreco(prod.preco_venda)}
                                    </div>
                                    <button
                                        onClick={() => {
                                            addItem({
                                                id: prod.id,
                                                produto_nome: prod.produto_nome,
                                                farmacia_nome: prod.farmacia_nome,
                                                farmacia_id: prod.farmacia_id,
                                                preco: prod.preco_venda,
                                                imagem: prod.produto_imagem
                                            });
                                            toast.success(`${prod.produto_nome} adicionado com sucesso!`, {
                                                style: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
                                                icon: '🛒'
                                            });
                                        }}
                                        disabled={!prod.is_disponivel}
                                        className={`mt-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-all ${prod.is_disponivel
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-200'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        <ShoppingCart size={18} />
                                        ADICIONAR
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
