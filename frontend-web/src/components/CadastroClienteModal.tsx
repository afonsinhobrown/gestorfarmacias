'use client';

import { useState } from 'react';
import { UserPlus, Phone, X, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CadastroClienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (nome: string) => void;
}

export default function CadastroClienteModal({ isOpen, onClose, onSuccess }: CadastroClienteModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome_completo: '',
        telefone: '',
        nuit: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Endpoint correto: /clientes/criar/ (NÃO cria usuário, apenas registro)
            await api.post('/clientes/criar/', formData);

            toast.success('Cliente cadastrado com sucesso!');
            const nomeCliente = formData.nome_completo;
            setFormData({ nome_completo: '', telefone: '', nuit: '' });
            onSuccess(nomeCliente);
            onClose();
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || 'Erro ao cadastrar cliente.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserPlus size={20} className="text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Cadastrar Cliente</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                            ℹ️ <strong>Cadastro simples:</strong> Apenas dados básicos. Sem senha ou login.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                        <input
                            type="text"
                            name="nome_completo"
                            value={formData.nome_completo}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="João Silva"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Phone size={16} />
                            Telefone *
                        </label>
                        <input
                            type="tel"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="+258 84 123 4567"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <CreditCard size={16} />
                            NUIT (Opcional)
                        </label>
                        <input
                            type="text"
                            name="nuit"
                            value={formData.nuit}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="123456789"
                        />
                        <p className="text-xs text-gray-500 mt-1">Número Único de Identificação Tributária</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
