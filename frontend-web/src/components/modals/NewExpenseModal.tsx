'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Check, DollarSign, Calendar, Tag, Plus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface NewExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewExpenseModal({ isOpen, onClose, onSuccess }: NewExpenseModalProps) {
    const [loading, setLoading] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);

    // Form
    const [titulo, setTitulo] = useState('');
    const [valor, setValor] = useState('');
    const [categoria, setCategoria] = useState('');
    const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('PENDENTE'); // PENDENTE ou PAGO
    const [isRecorrente, setIsRecorrente] = useState(false);
    const [comprovante, setComprovante] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchCategorias();
        }
    }, [isOpen]);

    const fetchCategorias = async () => {
        try {
            const res = await api.get('/financeiro/categorias/');
            setCategorias(res.data.results || res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('titulo', titulo);
            formData.append('valor', valor);
            formData.append('categoria', categoria);
            formData.append('data_vencimento', dataVencimento);
            formData.append('status', status);
            formData.append('is_recorrente', isRecorrente ? 'true' : 'false');

            if (status === 'PAGO') {
                formData.append('data_pagamento', new Date().toISOString().split('T')[0]);
            }

            if (comprovante) {
                formData.append('comprovante', comprovante);
            }

            await api.post('/financeiro/despesas/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Despesa registrada com sucesso!');
            onSuccess();
            onClose();

            // Reset form
            setTitulo('');
            setValor('');
            setCategoria('');
            setComprovante(null);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao registrar despesa.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-red-500" size={20} />
                        Nova Despesa
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Título e Valor */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Título</label>
                            <input
                                type="text"
                                required
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                placeholder="Ex: Conta de Luz"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Valor (MT)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={valor}
                                onChange={e => setValor(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                            />
                        </div>
                    </div>

                    {/* Categoria */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <Tag size={12} /> Categoria
                        </label>
                        <div className="flex gap-2">
                            <select
                                required
                                value={categoria}
                                onChange={e => setCategoria(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Selecione uma categoria...</option>
                                {categorias.map(c => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={async () => {
                                    const novaCat = prompt("Nome da nova categoria:");
                                    if (novaCat) {
                                        try {
                                            const res = await api.post('/financeiro/categorias/', { nome: novaCat });
                                            setCategorias([...categorias, res.data]);
                                            setCategoria(res.data.id);
                                            toast.success('Categoria criada!');
                                        } catch (e) { toast.error('Erro ao criar categoria'); }
                                    }
                                }}
                                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"
                                title="Criar nova categoria"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Data e Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> Vencimento
                            </label>
                            <input
                                type="date"
                                required
                                value={dataVencimento}
                                onChange={e => setDataVencimento(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setStatus('PENDENTE')}
                                    className={`flex-1 py-1 text-xs font-bold rounded ${status === 'PENDENTE' ? 'bg-white shadow text-yellow-600' : 'text-gray-500'}`}
                                >
                                    PENDENTE
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus('PAGO')}
                                    className={`flex-1 py-1 text-xs font-bold rounded ${status === 'PAGO' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
                                >
                                    JÁ PAGO
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recorrência */}
                    <div className="flex items-center gap-2 py-2">
                        <input
                            type="checkbox"
                            id="recorrente"
                            checked={isRecorrente}
                            onChange={e => setIsRecorrente(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="recorrente" className="text-sm text-gray-700 select-none">
                            Esta é uma despesa fixa mensal (Recorrente)
                        </label>
                    </div>

                    {/* Upload */}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={e => setComprovante(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                            {comprovante ? (
                                <>
                                    <Check className="text-green-500" size={32} />
                                    <span className="text-sm text-green-600 font-medium">{comprovante.name}</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={24} />
                                    <span className="text-xs font-bold uppercase">Anexar Fatura/Recibo (Opcional)</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Botão Salvar */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'REGISTRAR DESPESA'}
                    </button>

                </form>
            </div>
        </div>
    );
}
