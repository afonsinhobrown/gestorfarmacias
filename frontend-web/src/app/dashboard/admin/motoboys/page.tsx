'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Bike, CheckCircle, FileText, User } from 'lucide-react';
import { toast } from 'sonner';

interface Entregador {
    id: number;
    nome_completo: string;
    is_ativo: boolean;
    is_verificado: boolean;
    veiculo_placa: string;
    veiculo_tipo: string;
    telefone: string;
}

export default function AdminMotoboysPage() {
    const [motoboys, setMotoboys] = useState<Entregador[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMotoboys();
    }, []);

    const fetchMotoboys = async () => {
        try {
            const res = await api.get('/entregas/entregadores/');
            setMotoboys(res.data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const aprovarMotoboy = async (id: number) => {
        if (!confirm('Aprovar este entregador?')) return;
        try {
            await api.patch(`/entregas/entregadores/${id}/`, { is_verificado: true, is_ativo: true });
            toast.success('Entregador aprovado!');
            fetchMotoboys();
        } catch (error) {
            toast.error('Erro ao aprovar.');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Motoboys</h1>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">Motoboy</th>
                            <th className="p-4 font-medium text-gray-500">Veículo</th>
                            <th className="p-4 font-medium text-gray-500">Status</th>
                            <th className="p-4 font-medium text-gray-500">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {motoboys.map(m => (
                            <tr key={m.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                            <Bike size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{m.nome_completo}</p>
                                            <p className="text-sm text-gray-500">{m.telefone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="text-gray-900 font-medium uppercase">{m.veiculo_tipo}</p>
                                    <p className="text-xs text-gray-500 font-mono">{m.veiculo_placa}</p>
                                    <button className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                        <FileText size={12} /> Carta Condução
                                    </button>
                                </td>
                                <td className="p-4">
                                    {m.is_verificado ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                            <CheckCircle size={12} /> Verificado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold animate-pulse">
                                            Pendente
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {!m.is_verificado && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => aprovarMotoboy(m.id)}
                                                className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
                                            >
                                                Aprovar
                                            </button>
                                            <button className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200 transition-colors">
                                                Rejeitar
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
