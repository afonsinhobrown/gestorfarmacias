'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Truck, MapPin, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Entrega {
    id: number;
    pedido: number;
    entregador_nome?: string;
    status: string;
    endereco_entrega: string;
    data_criacao: string;
    codigo_validacao?: string;
}

export default function EntregasPage() {
    const [entregas, setEntregas] = useState<Entrega[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEntregas();
    }, []);

    const fetchEntregas = async () => {
        try {
            // Como não tem endpoint específico de listagem de entregas para farmácia ainda,
            // vamos listar pedidos com status 'SAIU_PARA_ENTREGA' ou usar um endpoint mockado se falhar
            // Idealmente: GET /entregas/ (filtrado por farmácia)
            // Por enquanto vou deixar vazio para não quebrar, ou tentar buscar entregas se a API permitir

            // Tentativa de buscar entregas (se implementamos endpoint de listagem geral)
            // Se der 404, fallback para array vazio
            try {
                const response = await api.get('/entregas/minhas/'); // Endpoint de entregador, pode falhar pra farmácia
                setEntregas(response.data.results || []);
            } catch (e) {
                // Se falhar (pq endpoint é só pra entregador), mostrar vazio por enquanto
                console.log('Endpoint de entregas restrito ou não implementado para farmácia');
                setEntregas([]);
            }
        } catch (error) {
            console.error('Erro ao buscar entregas', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
            case 'EM_TRANSITO': return 'bg-blue-100 text-blue-800';
            case 'ENTREGUE': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Gestão de Entregas</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="font-semibold text-gray-800">Entregas em Andamento</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando entregas...</div>
                ) : entregas.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Truck className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma entrega ativa</h3>
                        <p className="text-gray-500 mt-1">As entregas aparecerão aqui quando os pedidos saírem para entrega.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {entregas.map((entrega) => (
                            <div key={entrega.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-semibold text-gray-900">Entrega #{entrega.id}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entrega.status)}`}>
                                                {entrega.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={14} /> {entrega.endereco_entrega}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} /> {formatDate(entrega.data_criacao)}
                                            </span>
                                        </div>
                                        {entrega.entregador_nome && (
                                            <p className="text-xs text-gray-500 mt-1">Entregador: {entrega.entregador_nome}</p>
                                        )}
                                    </div>
                                </div>

                                {entrega.codigo_validacao && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Código</p>
                                        <p className="text-xl font-mono font-bold text-gray-900">{entrega.codigo_validacao}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
