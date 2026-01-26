'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Bike, CheckCircle, XCircle, Search } from 'lucide-react';
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

export default function MotoboysPage() {
    const [motoboys, setMotoboys] = useState<Entregador[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEntregadores();
    }, []);

    const fetchEntregadores = async () => {
        try {
            // TODO: Backend poderia aceitar filtro 'status=PENDENTE' mas aqui mostrarei todos por enquanto
            const res = await api.get('/entregas/entregadores/');
            setMotoboys(res.data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: number, ativo: boolean) => {
        try {
            await api.patch(`/entregas/entregadores/${id}/`, { is_ativo: !ativo });
            toast.success('Status atualizado!');
            fetchEntregadores();
        } catch (error) {
            toast.error('Erro ao atualizar motoboy');
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
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center">Carregando...</td></tr>
                        ) : motoboys.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum motoboy cadastrado.</td></tr>
                        ) : (
                            motoboys.map(m => (
                                <tr key={m.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                                <Bike size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{m.nome_completo}</p>
                                                <p className="text-sm text-gray-500">{m.telefone || 'Sem contato'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-gray-900 uppercase">{m.veiculo_tipo}</p>
                                        <p className="text-xs text-gray-500 font-mono">{m.veiculo_placa}</p>
                                    </td>
                                    <td className="p-4">
                                        {m.is_ativo ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                <CheckCircle size={12} /> Ativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                <XCircle size={12} /> Inativo
                                            </span>
                                        )}
                                        {!m.is_verificado && (
                                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                                Pendente
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleStatus(m.id, m.is_ativo)}
                                            className="text-sm text-blue-600 hover:underline font-medium"
                                        >
                                            {m.is_ativo ? 'Bloquear' : 'Ativar'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
