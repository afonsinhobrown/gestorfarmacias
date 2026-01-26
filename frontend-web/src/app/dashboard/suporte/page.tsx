'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    MessageSquare, AlertCircle, CheckCircle, Clock,
    Search, Filter, Plus
} from 'lucide-react';
import Link from 'next/link';

export default function SuportePage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('TODOS');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/suporte/tickets/');
            setTickets(res.data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const ticketsFiltrados = tickets.filter(t =>
        filtro === 'TODOS' ? true : t.status === filtro
    );

    const getPrioridadeColor = (p: string) => {
        switch (p) {
            case 'URGENTE': return 'bg-red-100 text-red-800';
            case 'ALTA': return 'bg-orange-100 text-orange-800';
            case 'MEDIA': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Central de Suporte</h1>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={18} /> Novo Ticket
                </button>
            </div>

            {/* Filtros e Busca */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por assunto ou ID..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['TODOS', 'ABERTO', 'EM_ANALISE', 'FECHADO'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFiltro(status)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${filtro === status
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Tickets */}
            <div className="space-y-3">
                {loading ? (
                    <p className="text-center py-10 text-gray-500">Carregando tickets...</p>
                ) : ticketsFiltrados.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                        <MessageSquare className="mx-auto text-gray-300 mb-2" size={48} />
                        <p className="text-gray-500">Nenhum ticket encontrado.</p>
                    </div>
                ) : (
                    ticketsFiltrados.map((ticket) => (
                        <Link
                            key={ticket.id}
                            href={`/dashboard/suporte/${ticket.id}`}
                            className="block bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow group"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${ticket.status === 'FECHADO' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {ticket.status === 'FECHADO' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getPrioridadeColor(ticket.prioridade)}`}>
                                                {ticket.prioridade}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {ticket.assunto}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                            {ticket.descricao}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${ticket.status === 'ABERTO' ? 'bg-green-100 text-green-700' :
                                            ticket.status === 'EM_ANALISE' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-2 flex items-center justify-end gap-1">
                                        <Clock size={12} /> {new Date(ticket.data_criacao).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
