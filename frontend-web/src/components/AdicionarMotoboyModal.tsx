'use client';

import { useState } from 'react';
import { X, Bike, Phone, User, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface AdicionarMotoboyModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AdicionarMotoboyModal({ onClose, onSuccess }: AdicionarMotoboyModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        placa_moto: '',
        observacoes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome || !formData.telefone) {
            toast.error('Nome e telefone são obrigatórios');
            return;
        }

        setLoading(true);

        try {
            await api.post('/entregas/motoboys/meu/', formData);
            toast.success('Motoboy adicionado com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Erro ao adicionar motoboy');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bike size={24} className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Adicionar Motoboy</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <p className="text-gray-600 mb-6">
                    Adicione um motoboy de sua confiança para fazer suas entregas.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User size={16} className="inline mr-1" />
                            Nome Completo *
                        </label>
                        <input
                            type="text"
                            value={formData.nome}
                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: João Silva"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Phone size={16} className="inline mr-1" />
                            Telefone *
                        </label>
                        <input
                            type="tel"
                            value={formData.telefone}
                            onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: 84 123 4567"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Bike size={16} className="inline mr-1" />
                            Placa da Moto (Opcional)
                        </label>
                        <input
                            type="text"
                            value={formData.placa_moto}
                            onChange={e => setFormData({ ...formData, placa_moto: e.target.value.toUpperCase() })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: ABC-1234"
                            maxLength={8}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observações (Opcional)
                        </label>
                        <textarea
                            value={formData.observacoes}
                            onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            placeholder="Ex: Motoboy de confiança, sempre pontual..."
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            <strong>💡 Dica:</strong> Você poderá escolher este motoboy nas suas próximas entregas.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Adicionando...' : 'Adicionar Motoboy'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
