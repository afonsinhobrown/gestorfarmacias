'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { Users, Mail, Phone, Calendar, Shield, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    tipo_usuario: string;
    telefone: string;
    is_active: boolean;
    data_criacao: string;
}

export default function AdminUsersPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserData[]>([]);

    useEffect(() => {
        if (!user || user.tipo_usuario !== 'ADMIN') {
            toast.error('Acesso negado');
            router.push('/login');
            return;
        }
        fetchUsers();
    }, [user, router]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users/');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Carregando usuários...</div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Gestão de Usuários</h1>
                        <p className="text-gray-600">Total: {users.length} usuários cadastrados</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Usuário</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Contato</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Tipo</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Data</th>
                                    <th className="px-6 py-4 text-sm font-bold text-gray-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {item.first_name?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{item.first_name} {item.last_name}</p>
                                                    <p className="text-xs text-gray-500">{item.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Mail size={12} /> {item.email}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Phone size={12} /> {item.telefone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.tipo_usuario === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                                    item.tipo_usuario === 'FARMACIA' ? 'bg-green-100 text-green-700' :
                                                        item.tipo_usuario === 'ENTREGADOR' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-blue-100 text-blue-700'
                                                }`}>
                                                {item.tipo_usuario}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.is_active ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                                    <CheckCircle size={14} /> Ativo
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                                    <XCircle size={14} /> Inativo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(item.data_criacao).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                    <Shield size={18} />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
