'use client';

import { useState } from 'react';
import { X, UserPlus, Briefcase, DollarSign, User } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface NewEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewEmployeeModal({ isOpen, onClose, onSuccess }: NewEmployeeModalProps) {
    const [loading, setLoading] = useState(false);

    // Form
    const [nome, setNome] = useState('');
    const [cargo, setCargo] = useState('ATENDENTE');
    const [salario, setSalario] = useState('');
    const [telefone, setTelefone] = useState('');
    const [dataAdmissao, setDataAdmissao] = useState(new Date().toISOString().split('T')[0]);

    const CARGOS = [
        { value: 'FARMACEUTICO', label: 'Farmacêutico' },
        { value: 'ATENDENTE', label: 'Atendente' },
        { value: 'CAIXA', label: 'Caixa' },
        { value: 'GERENTE', label: 'Gerente' },
        { value: 'ENTREGADOR', label: 'Entregador' },
        { value: 'LIMPEZA', label: 'Aux. Limpeza' },
        { value: 'GUARDA', label: 'Segurançca' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/rh/funcionarios/', {
                nome,
                cargo,
                salario_base: parseFloat(salario),
                telefone,
                data_admissao: dataAdmissao,
                ativo: true
            });

            toast.success('Funcionário cadastrado com sucesso!');
            onSuccess();
            onClose();

            // Reset
            setNome('');
            setSalario('');
            setTelefone('');

        } catch (error) {
            console.error(error);
            toast.error('Erro ao cadastrar funcionário.');
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
                        <UserPlus className="text-blue-500" size={20} />
                        Novo Funcionário
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <User size={12} /> Nome Completo
                        </label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Briefcase size={12} /> Cargo
                            </label>
                            <select
                                value={cargo}
                                onChange={e => setCargo(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                {CARGOS.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <DollarSign size={12} /> Salário
                            </label>
                            <input
                                type="number"
                                required
                                value={salario}
                                onChange={e => setSalario(e.target.value)}
                                placeholder="0.00"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Telefone</label>
                            <input
                                type="tel"
                                required
                                value={telefone}
                                onChange={e => setTelefone(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Admissão</label>
                            <input
                                type="date"
                                required
                                value={dataAdmissao}
                                onChange={e => setDataAdmissao(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? 'Cadastrando...' : 'SALVAR FUNCIONÁRIO'}
                    </button>
                </form>
            </div>
        </div>
    );
}
