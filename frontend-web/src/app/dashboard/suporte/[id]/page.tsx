'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    ArrowLeft, Send, User, CheckCircle,
    Clock, AlertTriangle, Shield
} from 'lucide-react';
import { toast } from 'sonner';

export default function TicketDetalhesPage() {
    const { id } = useParams();
    const router = useRouter();
    const [ticket, setTicket] = useState<any>(null);
    const [novaResposta, setNovaResposta] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchTicket();
    }, [id]);

    const fetchTicket = async () => {
        try {
            const res = await api.get(`/suporte/tickets/${id}/`);
            setTicket(res.data);
        } catch (error) {
            toast.error('Erro ao carregar ticket');
            router.push('/dashboard/suporte');
        } finally {
            setLoading(false);
        }
    };

    const enviarResposta = async (e: any) => {
        e.preventDefault();
        if (!novaResposta.trim()) return;

        try {
            // Nota: Precisaríamos de um endpoint específico para respostas ou nested serializer.
            // Vou assumir um endpoint '/suporte/respostas/' ou que o POST no ticket adiciona resposta.
            // Como meu backend 'TicketSerializer' tinha 'respostas' read_only, preciso criar a 'RespostaTicket' via API.
            // Mas não criei a View específica de RespostaTicket no passo anterior (apenas incluí no serializer).
            // VAMOS CORRIGIR: Vou criar o endpoint de resposta agora no backend rapidinho via tool, 
            // mas para não parar, vou assumir que existe e se falhar corrijo.

            // Melhor: Vou usar o chat message pattern que usei no pedido, mas adaptado.
            // Para simplificar este passo frontend, vou SIMULAR o envio ok?
            // Não, o user quer funcionalidade global. 
            // Vou adicionar a lógica de criação de resposta no backend AGORA MESMO.

            // PAUSA NO FRONTEND, AJUSTE BACKEND NECESSÁRIO.
            // Mas vou deixar o código frontend pronto esperando.
            await api.post(`/suporte/tickets/${id}/responder/`, { texto: novaResposta });

            setNovaResposta('');
            fetchTicket();
            toast.success('Resposta enviada');
        } catch (error) {
            toast.error('Erro ao enviar resposta. (Endpoint pendente)');
        }
    };

    const fecharTicket = async () => {
        if (!confirm('Deseja fechar este ticket?')) return;
        try {
            await api.patch(`/suporte/tickets/${id}/`, { status: 'FECHADO' });
            fetchTicket();
            toast.success('Ticket fechado!');
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (!ticket) return <div>Ticket não encontrado.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" /> Voltar para lista
            </button>

            {/* Cabeçalho do Ticket */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono font-bold">
                                #{ticket.id}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.status === 'ABERTO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {ticket.status}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">{ticket.assunto}</h1>
                    </div>
                    {ticket.status !== 'FECHADO' && (
                        <button
                            onClick={fecharTicket}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                            Fechar Ticket
                        </button>
                    )}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-gray-800 whitespace-pre-wrap">{ticket.descricao}</p>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><User size={14} /> Usuário #{ticket.usuario}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(ticket.data_criacao).toLocaleString()}</span>
                </div>
            </div>

            {/* Timeline de Respostas */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-500 uppercase text-sm tracking-wider">Histórico de Conversa</h3>

                {ticket.respostas?.map((resp: any) => (
                    <div key={resp.id} className="bg-white p-6 rounded-xl shadow-sm border flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <User size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-gray-900">{resp.autor_nome || 'Usuário'}</span>
                                <span className="text-xs text-gray-400">{new Date(resp.data_envio).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{resp.texto}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Formulário de Resposta */}
            {ticket.status !== 'FECHADO' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border sticky bottom-6">
                    <form onSubmit={enviarResposta}>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Sua Resposta</label>
                        <textarea
                            value={novaResposta}
                            onChange={e => setNovaResposta(e.target.value)}
                            className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                            placeholder="Escreva sua resposta para ajudar o usuário..."
                        ></textarea>
                        <div className="flex justify-end mt-3">
                            <button
                                type="submit"
                                disabled={!novaResposta.trim()}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Send size={18} /> Enviar Resposta
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
