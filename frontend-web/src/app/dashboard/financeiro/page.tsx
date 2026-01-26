'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign, Users, FileText, Plus, TrendingDown, Calendar,
    CheckCircle, Clock, AlertCircle, Briefcase, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { NewExpenseModal } from '@/components/modals/NewExpenseModal';
import { NewEmployeeModal } from '@/components/modals/NewEmployeeModal';

export default function FinanceiroPage() {
    const [activeTab, setActiveTab] = useState<'despesas' | 'rh'>('despesas');
    const [loading, setLoading] = useState(true);

    // Modais
    const [showNewExpense, setShowNewExpense] = useState(false);
    const [showNewEmployee, setShowNewEmployee] = useState(false);

    // Dados
    const [despesas, setDespesas] = useState<any[]>([]);
    const [funcionarios, setFuncionarios] = useState<any[]>([]);
    const [resumo, setResumo] = useState({ total_pendente: 0, total_pago: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resDespesas, resFunc] = await Promise.all([
                api.get('/financeiro/despesas/'),
                api.get('/rh/funcionarios/')
            ]);
            setDespesas(resDespesas.data.results || resDespesas.data);
            setFuncionarios(resFunc.data.results || resFunc.data);

            // Calcular resumo
            const dList = resDespesas.data.results || resDespesas.data;
            const pendente = dList.filter((d: any) => d.status === 'PENDENTE')
                .reduce((acc: number, d: any) => acc + parseFloat(d.valor), 0);
            const pago = dList.filter((d: any) => d.status === 'PAGO')
                .reduce((acc: number, d: any) => acc + parseFloat(d.valor), 0);

            setResumo({ total_pendente: pendente, total_pago: pago });

        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados financeiros.");
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <DollarSign className="text-green-600" size={32} />
                    Gestão Financeira & RH
                </h1>
                <p className="text-gray-500 font-medium mt-1">Controle de despesas, contas a pagar e funcionários.</p>
            </div>

            <NewExpenseModal
                isOpen={showNewExpense}
                onClose={() => setShowNewExpense(false)}
                onSuccess={fetchData}
            />

            <NewEmployeeModal
                isOpen={showNewEmployee}
                onClose={() => setShowNewEmployee(false)}
                onSuccess={fetchData}
            />

            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Contas a Pagar (Pendentes)</p>
                            <h3 className="text-2xl font-black text-gray-900">{formatMoney(resumo.total_pendente)}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Despesas Pagas (Mês)</p>
                            <h3 className="text-2xl font-black text-gray-900">{formatMoney(resumo.total_pago)}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Funcionários Ativos</p>
                            <h3 className="text-2xl font-black text-gray-900">{funcionarios.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('despesas')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'despesas'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    DESPESAS OPERACIONAIS
                </button>
                <button
                    onClick={() => setActiveTab('rh')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'rh'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    RECURSOS HUMANOS (RH)
                </button>
            </div>

            {/* Conteúdo */}
            {activeTab === 'despesas' ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Minhas Despesas</h2>
                        <button
                            onClick={() => setShowNewExpense(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-sm">
                            <Plus size={16} /> NOVA DESPESA
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-6 text-xs font-black text-gray-400 uppercase">Título</th>
                                    <th className="text-left py-3 px-6 text-xs font-black text-gray-400 uppercase">Categoria</th>
                                    <th className="text-left py-3 px-6 text-xs font-black text-gray-400 uppercase">Vencimento</th>
                                    <th className="text-left py-3 px-6 text-xs font-black text-gray-400 uppercase">Status</th>
                                    <th className="text-right py-3 px-6 text-xs font-black text-gray-400 uppercase">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {despesas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                                            Nenhuma despesa registrada.
                                        </td>
                                    </tr>
                                ) : (
                                    despesas.map((d) => (
                                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6 text-sm font-bold text-gray-800">{d.titulo}</td>
                                            <td className="py-4 px-6 text-sm text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                                                    {d.categoria_nome || 'Geral'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-600">
                                                {new Date(d.data_vencimento).toLocaleDateString('pt-MZ')}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${d.status === 'PAGO' ? 'bg-green-100 text-green-700' :
                                                    d.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right text-sm font-black text-gray-900">
                                                {formatMoney(parseFloat(d.valor))}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Funcionários</h2>
                        <button
                            onClick={() => setShowNewEmployee(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            <Plus size={16} /> NOVO FUNCIONÁRIO
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {funcionarios.length === 0 ? (
                            <div className="col-span-3 text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                                <Users size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Nenhum funcionário cadastrado.</p>
                            </div>
                        ) : (
                            funcionarios.map((f) => (
                                <div key={f.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg">
                                                {f.nome.charAt(0)}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${f.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {f.ativo ? 'ATIVO' : 'INATIVO'}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900">{f.nome}</h3>
                                        <p className="text-sm text-gray-500 font-medium mb-1 flex items-center gap-1">
                                            <Briefcase size={14} /> {f.cargo_display}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <DollarSign size={14} /> {formatMoney(parseFloat(f.salario_base))}
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                                        <button className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 font-bold rounded hover:bg-gray-100 text-xs transition-colors">
                                            EDITAR
                                        </button>
                                        <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100 text-xs transition-colors">
                                            PAGAR
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
