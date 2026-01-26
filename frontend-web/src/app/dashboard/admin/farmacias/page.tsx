'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Store, CheckCircle, XCircle, FileText, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Farmacia {
    id: number;
    nome: string;
    nuit: string;
    is_verificada: boolean;
    is_ativa: boolean;
    telefone_principal: string;
    endereco: string;
}

export default function AdminFarmaciasPage() {
    const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFarmacias();
    }, []);

    const fetchFarmacias = async () => {
        try {
            const res = await api.get('/farmacias/'); // Idealmente filtro ?status=ALL ou similar
            setFarmacias(res.data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const aprovarFarmacia = async (id: number) => {
        if (!confirm('Tem certeza que deseja aprovar esta farmácia? Ela poderá começar a vender.')) return;
        try {
            await api.patch(`/farmacias/${id}/`, { is_verificada: true, is_ativa: true });
            toast.success('Farmácia aprovada com sucesso!');
            fetchFarmacias();
        } catch (error) {
            toast.error('Erro ao aprovar.');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Farmácias</h1>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">Farmácia</th>
                            <th className="p-4 font-medium text-gray-500">Documentação</th>
                            <th className="p-4 font-medium text-gray-500">Status</th>
                            <th className="p-4 font-medium text-gray-500">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {farmacias.map(f => (
                            <tr key={f.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{f.nome}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <MapPin size={12} /> {f.endereco}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm text-gray-600">NUIT: <span className="font-mono font-bold">{f.nuit}</span></p>
                                    <button className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                        <FileText size={12} /> Ver Alvará
                                    </button>
                                </td>
                                <td className="p-4">
                                    {f.is_verificada ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                            <CheckCircle size={12} /> Verificada
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold animate-pulse">
                                            Pendente
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {!f.is_verificada && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => aprovarFarmacia(f.id)}
                                                className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
                                            >
                                                Aprovar
                                            </button>
                                            <button className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded hover:bg-red-200 transition-colors">
                                                Rejeitar
                                            </button>
                                        </div>
                                    )}
                                    {f.is_verificada && (
                                        <button className="text-sm text-gray-500 hover:text-gray-700">Detalhes</button>
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
