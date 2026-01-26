'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import {
    Search,
    ShoppingCart,
    MapPin,
    Star,
    ArrowRight,
    Clock,
    ShoppingBag,
    Clock8,
    Package
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function ClienteDashboard() {
    const { user } = useAuthStore();
    const [farmacias, setFarmacias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'home' | 'pedidos'>('home');
    const [pedidos, setPedidos] = useState<any[]>([]);

    useEffect(() => {
        const fetchFarmacias = async () => {
            try {
                const res = await api.get('/farmacias/portal/');
                setFarmacias(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        const fetchPedidos = async () => {
            try {
                const res = await api.get('/pedidos/meus/');
                setPedidos(res.data.results || []);
            } catch (error) {
                console.error(error);
            }
        };

        fetchFarmacias();
        fetchPedidos();
    }, []);

    if (loading) return <div className="p-10 text-center uppercase font-black text-gray-400 animate-pulse">Sincronizando farmácias...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Boas vindas */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Vila de Farmácias</h1>
                    <p className="text-gray-500 font-medium">Olá, {user?.first_name}! O que você procura hoje?</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setView('home')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'home' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        EXPLORAR
                    </button>
                    <button
                        onClick={() => setView('pedidos')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'pedidos' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        MEUS PEDIDOS
                    </button>
                </div>
            </div>

            {view === 'home' ? (
                <>
                    {/* Barra de Busca Grande */}
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder="Procure por medicamentos, farmácias ou sintomas..."
                            className="w-full pl-16 pr-8 py-6 bg-white border-2 border-transparent shadow-xl shadow-gray-100 rounded-3xl outline-none focus:border-blue-500 transition-all text-lg font-medium"
                        />
                    </div>

                    {/* Categorias Rápidas (Visual) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {['Gripes', 'Vitaminas', 'Pele', 'Bebê', 'Higiene', 'Dor'].map((cat) => (
                            <button key={cat} className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md hover:border-blue-100 transition-all text-center">
                                <span className="text-xs font-bold text-gray-700">{cat}</span>
                            </button>
                        ))}
                    </div>

                    {/* Lista de Farmácias */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Clock8 className="text-green-500" size={24} />
                            Farmácias Abertas Agora
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {farmacias.map((farmacia) => (
                                <div key={farmacia.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group pointer-events-auto cursor-pointer">
                                    <div className="h-40 bg-gray-100 relative">
                                        {/* Imagem Placeholder de Farmácia */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-4 left-4 flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center font-black text-blue-600">
                                                {farmacia.logo ? <img src={farmacia.logo} alt="Logo" className="w-full h-full object-contain p-1" /> : <Package size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white leading-none">{farmacia.nome}</h3>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                                    <span className="text-[10px] text-white font-bold">{farmacia.nota}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="flex items-start gap-2 text-xs text-gray-500">
                                            <MapPin size={14} className="flex-shrink-0 text-red-500" />
                                            <span>{farmacia.endereco}, {farmacia.bairro}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <span>Entrega: {formatPrice(farmacia.taxa_entrega)}</span>
                                            <span className="text-green-600">Disponível</span>
                                        </div>
                                        <button className="w-full py-3 bg-blue-50 text-blue-600 font-black rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
                                            VER PRODUTOS <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-gray-900">Histórico de Compras</h2>
                    <div className="space-y-4">
                        {pedidos.length === 0 ? (
                            <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 text-center">
                                <ShoppingBag size={48} className="mx-auto mb-4 text-gray-100" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest">Você ainda não fez nenhum pedido.</p>
                            </div>
                        ) : (
                            pedidos.map((pedido) => (
                                <div key={pedido.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <Package className="text-gray-400" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900">Pedido #{pedido.numero_pedido}</h4>
                                            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">{pedido.farmacia_nome}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(pedido.data_criacao).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                                            <p className="text-lg font-black text-gray-900">{formatPrice(parseFloat(pedido.total))}</p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${pedido.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {pedido.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
