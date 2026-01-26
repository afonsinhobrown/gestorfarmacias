'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import {
    Truck,
    MapPin,
    Box,
    CheckCircle,
    Navigation,
    Clock,
    DollarSign,
    RefreshCcw,
    AlertCircle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function EntregadorDashboard() {
    const { user } = useAuthStore();
    const [disponiveis, setDisponiveis] = useState<any[]>([]);
    const [minhas, setMinhas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'disponiveis' | 'ativas'>('disponiveis');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dispRes, minhasRes] = await Promise.all([
                api.get('/entregas/disponiveis/'),
                api.get('/entregas/minhas/')
            ]);
            setDisponiveis(dispRes.data);
            setMinhas(minhasRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao sincronizar entregas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.tipo_usuario === 'ENTREGADOR') {
            fetchData();
        }
    }, [user]);

    const aceitarEntrega = async (id: number) => {
        try {
            await api.post(`/entregas/aceitar/${id}/`);
            toast.success("Entrega aceita com sucesso!");
            fetchData();
            setView('ativas');
        } catch (error) {
            toast.error("Erro ao aceitar entrega.");
        }
    };

    if (loading && disponiveis.length === 0) return <div className="p-10 text-center font-black text-gray-400 uppercase tracking-widest animate-pulse">Buscando novas rotas...</div>;

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            {/* Header Logística */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Truck className="text-blue-600" size={32} />
                        Centro Logístico
                    </h1>
                    <p className="text-gray-500 font-medium">Benvindo, {user?.first_name}. Você tem {disponiveis.length} rotas disponíveis hoje.</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setView('disponiveis')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'disponiveis' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        DISPONÍVEIS ({disponiveis.length})
                    </button>
                    <button
                        onClick={() => setView('ativas')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === 'ativas' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        MINHAS ENTREGAS ({minhas.filter(m => m.status !== 'ENTREGUE').length})
                    </button>
                    <button onClick={fetchData} className="p-2.5 text-gray-400 hover:text-blue-600 transition-colors">
                        <RefreshCcw size={18} />
                    </button>
                </div>
            </div>

            {view === 'disponiveis' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {disponiveis.length === 0 ? (
                        <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-center">
                            <Box size={48} className="mx-auto mb-4 text-gray-100" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Não há pedidos prontos no momento.<br />Fique atento ao aplicativo.</p>
                        </div>
                    ) : (
                        disponiveis.map((pedido) => (
                            <div key={pedido.pedido_id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{pedido.farmacia}</p>
                                            <h3 className="font-black text-gray-900 text-lg">Fat. {pedido.numero}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">Ganhos</p>
                                            <p className="text-xl font-black text-green-600">{formatPrice(pedido.taxa_entrega)}</p>
                                        </div>
                                    </div>

                                    <div className="py-4 border-y border-dashed space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                            <p className="text-sm font-bold text-gray-700">Origem: {pedido.bairro_origem}</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                                            <p className="text-sm font-bold text-gray-700">Destino: {pedido.bairro_destino}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => aceitarEntrega(pedido.pedido_id)}
                                        className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-blue-600 shadow-lg shadow-gray-200 hover:shadow-blue-200 transition-all uppercase tracking-widest text-xs"
                                    >
                                        ACEITAR ROTA
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {minhas.map((entrega) => (
                        <div key={entrega.id} className={`bg-white p-6 rounded-3xl shadow-sm border transition-all ${entrega.status === 'ENTREGUE' ? 'opacity-60 grayscale' : 'border-blue-100 shadow-blue-50'}`}>
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className={`p-4 rounded-2xl ${entrega.status === 'ENTREGUE' ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
                                        <Navigation size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900">Entrega #{entrega.numero}</h4>
                                        <p className="text-xs font-bold text-blue-600 uppercase mb-1">{entrega.farmacia}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <MapPin size={12} /> {entrega.endereco_entrega}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</p>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${entrega.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {entrega.status}
                                        </span>
                                    </div>

                                    {entrega.status !== 'ENTREGUE' && (
                                        <div className="flex gap-2">
                                            <div className="p-3 bg-gray-900 text-white rounded-2xl text-center">
                                                <p className="text-[8px] font-black opacity-50 mb-1">CÓD. COLETA</p>
                                                <p className="font-mono font-black text-lg leading-none">{entrega.codigo_coleta}</p>
                                            </div>
                                            <button className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                                                FINALIZAR
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
