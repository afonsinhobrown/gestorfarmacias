'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, MapPin, Phone, User, Clock, CheckCircle, ShieldCheck, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function PedidoDetalhesPage() {
    const { id } = useParams();
    const router = useRouter();
    const [pedido, setPedido] = useState<any>(null);
    const [mensagens, setMensagens] = useState<any[]>([]);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchPedido();
            fetchMensagens();
            // Polling simples para chat (em prod usar WebSocket/Socket.io)
            const interval = setInterval(fetchMensagens, 5000);
            return () => clearInterval(interval);
        }
    }, [id]);

    const fetchPedido = async () => {
        try {
            const res = await api.get(`/pedidos/${id}/`);
            setPedido(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar pedido');
        } finally {
            setLoading(false);
        }
    };

    const fetchMensagens = async () => {
        try {
            const res = await api.get(`/suporte/mensagens/?pedido=${id}`);
            setMensagens(res.data.results || []);
        } catch (error) {
            console.error("Erro chat", error);
        }
    };

    const enviarMensagem = async (e: any) => {
        e.preventDefault();
        if (!novaMensagem.trim()) return;

        try {
            await api.post('/suporte/mensagens/', {
                pedido: id,
                texto: novaMensagem
            });
            setNovaMensagem('');
            fetchMensagens();
        } catch (error) {
            toast.error('Erro ao enviar mensagem');
        }
    };

    if (loading) return <div>Carregando detalhes...</div>;
    if (!pedido) return <div>Pedido não encontrado.</div>;

    const getStatusColor = (status: string) => {
        const colors: any = {
            'PENDENTE': 'bg-yellow-100 text-yellow-800',
            'CONFIRMADO': 'bg-blue-100 text-blue-800',
            'PREPARANDO': 'bg-purple-100 text-purple-800',
            'PRONTO': 'bg-teal-100 text-teal-800',
            'EM_TRANSITO': 'bg-orange-100 text-orange-800',
            'ENTREGUE': 'bg-green-100 text-green-800',
            'CANCELADO': 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" /> Voltar
            </button>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center print:bg-white print:border-none">
                    <div className="print:flex print:justify-between print:w-full">
                        <div className="hidden print:block">
                            <h2 className="text-2xl font-black text-blue-600">{pedido.farmacia_nome}</h2>
                            <p className="text-xs text-gray-500">{pedido.farmacia_endereco}</p>
                            <p className="text-xs text-gray-500">NUIT: {pedido.farmacia_nuit}</p>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Fatura / Pedido #{pedido.numero_pedido}</h1>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <Clock size={14} />
                                {new Date(pedido.data_criacao).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        <button
                            onClick={() => window.print()}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black transition-all"
                        >
                            IMPRIMIR FATURA
                        </button>
                        <span className={`px-4 py-2 rounded-full font-bold text-sm ${getStatusColor(pedido.status)}`}>
                            {pedido.status}
                        </span>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Detalhes do Cliente */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Cliente / Entrega</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <User className="text-gray-400 mt-1" size={18} />
                                <div>
                                    <p className="font-medium text-gray-900">{pedido.cliente_nome || 'Cliente'}</p>
                                    <p className="text-sm text-gray-500">{pedido.telefone_contato}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="text-gray-400 mt-1" size={18} />
                                <div>
                                    <p className="text-gray-900">{pedido.endereco_entrega}</p>
                                    <p className="text-sm text-gray-500">{pedido.bairro}, {pedido.cidade}</p>
                                    {pedido.referencia && <p className="text-xs text-blue-600 mt-1">Ref: {pedido.referencia}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Codes de Segurança */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-dashed border-gray-300">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShieldCheck size={16} /> Segurança Logística
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            {/* QR Coleta - Para a Farmácia ver e Motoboy scanear */}
                            <div className="text-center">
                                <p className="text-xs font-medium text-gray-500 mb-2">Código de Coleta</p>
                                {pedido.qrcode_coleta ? (
                                    <img src={pedido.qrcode_coleta} alt="QR Coleta" className="w-24 h-24 mx-auto border rounded bg-white p-1" />
                                ) : (
                                    <div className="w-24 h-24 mx-auto bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">N/A</div>
                                )}
                                <p className="text-lg font-mono font-bold mt-2 tracking-widest text-blue-600">{pedido.codigo_coleta || '---'}</p>
                                <p className="text-[10px] text-gray-400 mt-1">Entregue ao Motoboy</p>
                            </div>

                            {/* QR Entrega - Para o Cliente (apenas visualização aqui) */}
                            <div className="text-center opacity-60">
                                <p className="text-xs font-medium text-gray-500 mb-2">Código de Entrega</p>
                                {pedido.qrcode_entrega ? (
                                    <img src={pedido.qrcode_entrega} alt="QR Entrega" className="w-24 h-24 mx-auto border rounded bg-white p-1 blur-[2px] transition-all hover:blur-none" title="Revelar (Segredo do Cliente)" />
                                ) : (
                                    <div className="w-24 h-24 mx-auto bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">N/A</div>
                                )}
                                <p className="text-lg font-mono font-bold mt-2 tracking-widest text-green-600">******</p>
                                <p className="text-[10px] text-gray-400 mt-1">Segredo do Cliente</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Área de Chat */}
                <div className="border-t p-6 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Chat do Pedido</h3>

                    <div className="bg-white border rounded-xl h-64 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {mensagens.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-4">Nenhuma mensagem ainda.</p>
                            ) : (
                                mensagens.map((msg: any) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.remetente_tipo === 'FARMACIA' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-3 rounded-lg max-w-[80%] text-sm ${msg.remetente_tipo === 'FARMACIA'
                                            ? 'bg-blue-100 text-blue-900 rounded-br-none'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                            }`}>
                                            <span className="font-bold text-xs block mb-1 opacity-70">{msg.remetente_nome}</span>
                                            {msg.texto}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1">
                                            {new Date(msg.data_envio).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={enviarMensagem} className="p-3 border-t flex gap-2">
                            <input
                                type="text"
                                value={novaMensagem}
                                onChange={e => setNovaMensagem(e.target.value)}
                                placeholder="Escreva uma mensagem..."
                                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Itens do Pedido */}
                <div className="border-t p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Itens do Pedido</h3>
                    <div className="space-y-3">
                        {pedido.itens?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-dashed last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0">
                                        {/* Imagem do produto se tiver */}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{item.produto_nome}</p>
                                        <p className="text-sm text-gray-500">{item.quantidade}x {formatPrice(parseFloat(item.preco_unitario))}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900">{formatPrice(parseFloat(item.subtotal))}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>{formatPrice(parseFloat(pedido.subtotal))}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Taxa de Entrega</span>
                                <span>{formatPrice(parseFloat(pedido.taxa_entrega))}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                                <span>Total</span>
                                <span>{formatPrice(parseFloat(pedido.total))}</span>
                            </div>
                            <div className="text-right text-xs text-gray-500 mt-1">
                                Pagamento: <span className="font-medium uppercase">{pedido.forma_pagamento}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
