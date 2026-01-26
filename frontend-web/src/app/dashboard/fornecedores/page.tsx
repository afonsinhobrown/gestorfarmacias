'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Search, Phone, Mail, Building2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface Fornecedor {
    id: number;
    razao_social: string;
    nome_fantasia: string;
    telefone_principal: string;
    email: string;
    nuit: string;
}

export default function FornecedoresPage() {
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        fetchFornecedores();
    }, []);

    const fetchFornecedores = async () => {
        try {
            const res = await api.get('/fornecedores/');
            setFornecedores(res.data.results || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            await api.post('/fornecedores/', data);
            toast.success('Fornecedor cadastrado!');
            setIsModalOpen(false);
            reset();
            fetchFornecedores();
        } catch (error: any) {
            toast.error('Erro ao cadastrar fornecedor.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Fornecedores</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                >
                    <Plus size={18} /> Novo Fornecedor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-gray-500">Carregando...</p>
                ) : fornecedores.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed text-gray-400">
                        Nenhum fornecedor cadastrado.
                    </div>
                ) : (
                    fornecedores.map(f => (
                        <div key={f.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <Building2 size={24} />
                                </div>
                                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                    NUIT: {f.nuit || 'N/A'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{f.nome_fantasia || f.razao_social}</h3>
                            <p className="text-sm text-gray-500 mb-4">{f.razao_social}</p>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} /> {f.telefone_principal}
                                </div>
                                {f.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} /> {f.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Novo Fornecedor</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Razão Social</label>
                                <input {...register('razao_social', { required: true })} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nome Fantasia</label>
                                    <input {...register('nome_fantasia')} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">NUIT</label>
                                    <input {...register('nuit')} className="w-full p-2 border rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Telefone</label>
                                    <input {...register('telefone_principal', { required: true })} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input {...register('email')} type="email" className="w-full p-2 border rounded-lg" />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                    {saving && <Loader2 size={16} className="animate-spin" />} Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
