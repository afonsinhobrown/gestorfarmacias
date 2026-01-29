'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Users, Plus, Edit2, Trash2, Mail, Phone, Shield, UserCheck, UserX, Search } from 'lucide-react';

interface Funcionario {
    id: number;
    nome: string;
    cargo: string;
    salario_base: string;
    telefone: string;
    email: string;
    data_admissao: string;
    ativo: boolean;
    usuario: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
    } | null;
}

const CARGOS = [
    { value: 'FARMACEUTICO', label: 'Farmacêutico' },
    { value: 'ATENDENTE', label: 'Atendente de Balcão' },
    { value: 'CAIXA', label: 'Operador de Caixa' },
    { value: 'GERENTE', label: 'Gerente' },
    { value: 'ENTREGADOR', label: 'Entregador' },
    { value: 'LIMPEZA', label: 'Auxiliar de Limpeza' },
    { value: 'GUARDA', label: 'Guarda/Segurança' },
    { value: 'OUTRO', label: 'Outro' }
];

export default function UsuariosPage() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [busca, setBusca] = useState('');

    const [formData, setFormData] = useState({
        nome: '',
        cargo: 'ATENDENTE',
        salario_base: '',
        telefone: '',
        email: '',
        data_admissao: new Date().toISOString().split('T')[0],
        criar_usuario: false,
        senha_usuario: ''
    });

    useEffect(() => {
        fetchFuncionarios();
    }, []);

    const fetchFuncionarios = async () => {
        try {
            const res = await api.get('/rh/funcionarios/');
            // DRF returns results in a 'results' field when pagination is enabled
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setFuncionarios(data);
        } catch (error) {
            console.error('Erro ao buscar funcionários:', error);
            toast.error('Erro ao carregar funcionários');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                salario_base: parseFloat(formData.salario_base)
            };

            if (editingId) {
                await api.put(`/rh/funcionarios/${editingId}/`, payload);
                toast.success('Funcionário atualizado com sucesso!');
            } else {
                await api.post('/rh/funcionarios/', payload);
                toast.success('Funcionário cadastrado com sucesso!');
            }

            fetchFuncionarios();
            handleCloseModal();
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            const errorMsg = error.response?.data?.error || 'Erro ao salvar funcionário';
            toast.error(errorMsg);
        }
    };

    const handleEdit = (func: Funcionario) => {
        setEditingId(func.id);
        setFormData({
            nome: func.nome,
            cargo: func.cargo,
            salario_base: func.salario_base,
            telefone: func.telefone,
            email: func.email,
            data_admissao: func.data_admissao,
            criar_usuario: false,
            senha_usuario: ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja remover este funcionário?')) return;

        try {
            await api.delete(`/rh/funcionarios/${id}/`);
            toast.success('Funcionário removido com sucesso!');
            fetchFuncionarios();
        } catch (error) {
            toast.error('Erro ao remover funcionário');
        }
    };

    const handleToggleStatus = async (id: number, ativo: boolean) => {
        try {
            await api.patch(`/rh/funcionarios/${id}/`, { ativo: !ativo });
            toast.success(`Funcionário ${!ativo ? 'ativado' : 'desativado'} com sucesso!`);
            fetchFuncionarios();
        } catch (error) {
            toast.error('Erro ao alterar status');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            nome: '',
            cargo: 'ATENDENTE',
            salario_base: '',
            telefone: '',
            email: '',
            data_admissao: new Date().toISOString().split('T')[0],
            criar_usuario: false,
            senha_usuario: ''
        });
    };

    const filteredFuncionarios = funcionarios.filter(f =>
        f.nome.toLowerCase().includes(busca.toLowerCase()) ||
        f.email.toLowerCase().includes(busca.toLowerCase()) ||
        f.telefone.includes(busca)
    );

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <Users size={32} className="text-blue-600" />
                        Gestão de Usuários
                    </h1>
                    <p className="text-gray-600 mt-1">Gerencie funcionários e permissões de acesso</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
                >
                    <Plus size={20} />
                    Novo Funcionário
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por nome, email ou telefone..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Funcionário</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Cargo</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Contato</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Salário</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Acesso</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-gray-600 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-gray-600 font-medium">Carregando...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredFuncionarios.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    Nenhum funcionário cadastrado
                                </td>
                            </tr>
                        ) : (
                            filteredFuncionarios.map((func) => (
                                <tr key={func.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-gray-900">{func.nome}</p>
                                            <p className="text-xs text-gray-500">Desde {new Date(func.data_admissao).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                            {CARGOS.find(c => c.value === func.cargo)?.label || func.cargo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail size={14} className="text-gray-400" />
                                                <span className="text-gray-700">{func.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone size={14} className="text-gray-400" />
                                                <span className="text-gray-700">{func.telefone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{parseFloat(func.salario_base).toLocaleString('pt-BR', { style: 'currency', currency: 'MZN' })}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {func.usuario ? (
                                            <div className="flex items-center gap-2">
                                                <Shield size={16} className="text-emerald-600" />
                                                <span className="text-xs font-bold text-emerald-700">Tem Acesso</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Sem acesso</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleStatus(func.id, func.ativo)}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${func.ativo
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {func.ativo ? <UserCheck size={14} /> : <UserX size={14} />}
                                            {func.ativo ? 'Ativo' : 'Inativo'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(func)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(func.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-black text-gray-900">
                                {editingId ? 'Editar Funcionário' : 'Novo Funcionário'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo *</label>
                                    <input
                                        type="text"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Cargo *</label>
                                    <select
                                        value={formData.cargo}
                                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        {CARGOS.map(cargo => (
                                            <option key={cargo.value} value={cargo.value}>{cargo.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Salário Base *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.salario_base}
                                        onChange={(e) => setFormData({ ...formData, salario_base: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Telefone *</label>
                                    <input
                                        type="tel"
                                        value={formData.telefone}
                                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Data de Admissão *</label>
                                    <input
                                        type="date"
                                        value={formData.data_admissao}
                                        onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {(!editingId || !funcionarios.find(f => f.id === editingId)?.usuario) && (
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <input
                                            type="checkbox"
                                            id="criar_usuario"
                                            checked={formData.criar_usuario}
                                            onChange={(e) => setFormData({ ...formData, criar_usuario: e.target.checked })}
                                            className="w-5 h-5 rounded text-blue-600"
                                        />
                                        <label htmlFor="criar_usuario" className="text-sm font-bold text-blue-900">
                                            Criar acesso ao sistema para este funcionário
                                        </label>
                                    </div>

                                    {formData.criar_usuario && (
                                        <div>
                                            <label className="block text-sm font-bold text-blue-900 mb-2">Senha de Acesso *</label>
                                            <input
                                                type="password"
                                                value={formData.senha_usuario}
                                                onChange={(e) => setFormData({ ...formData, senha_usuario: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required={formData.criar_usuario}
                                                minLength={6}
                                            />
                                            <p className="text-xs text-blue-700 mt-1">O email será usado como login</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                                >
                                    {editingId ? 'Atualizar' : 'Cadastrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
