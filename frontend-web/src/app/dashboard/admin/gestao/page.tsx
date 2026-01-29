'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import {
    Store, Building2, Shield, Calendar, Search,
    Plus, Filter, CheckCircle, XCircle, Clock,
    CreditCard, Users, Settings, ArrowRight,
    MapPin, FileText, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Gibagio {
    id: number;
    nome: string;
    codigo: string;
}

interface Licenca {
    id: number;
    tipo: string;
    data_fim: string;
    is_ativa: boolean;
    status_expirada: boolean;
}

interface Farmacia {
    id: number;
    nome: string;
    nuit: string;
    is_ativa: boolean;
    is_verificada: boolean;
    gibagio_nome?: string;
    licenca_ativa?: Licenca;
    endereco: string;
}

export default function SuperAdminGestaoPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
    const [gibagios, setGibagios] = useState<Gibagio[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState<'farmacias' | 'gibagios' | 'licencas'>('farmacias');

    useEffect(() => {
        if (!user || user.tipo_usuario !== 'ADMIN') {
            router.push('/login');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [farmRes, gibRes] = await Promise.all([
                api.get('/farmacias/admin/gestao/'),
                api.get('/farmacias/admin/gibagios/')
            ]);
            setFarmacias(farmRes.data.results || farmRes.data);
            setGibagios(gibRes.data.results || gibRes.data);
        } catch (error) {
            toast.error('Erro ao carregar dados administrativos');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAtiva = async (id: number, current: boolean) => {
        try {
            await api.patch(`/farmacias/admin/gestao/${id}/`, { is_ativa: !current });
            toast.success('Status alterado com sucesso');
            fetchData();
        } catch (error) {
            toast.error('Erro ao alterar status');
        }
    };

    const handleRenovarLicenca = async (id: number) => {
        try {
            await api.post(`/farmacias/admin/gestao/${id}/renovar_licenca/`, { tipo: 'MENSAL' });
            toast.success('Licença renovada por 30 dias!');
            fetchData();
        } catch (error) {
            toast.error('Erro ao renovar licença');
        }
    };

    const filteredFarmacias = farmacias.filter(f =>
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.nuit.includes(searchTerm)
    );

    if (loading) return <div className="p-8 text-center">Carregando painel de controlo...</div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-xl border border-blue-50">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Shield className="text-blue-600" size={36} />
                        Gestão Central Master
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Controlo total de infraestrutura, licenças e entidades regionais</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all flex items-center gap-2">
                        <Plus size={20} /> Nova Gibagio
                    </button>
                    <button className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all">
                        Relatórios Globais
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <Building2 size={24} />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Farmácias</p>
                    <p className="text-3xl font-black text-gray-900">{farmacias.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                        <CheckCircle size={24} />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Licenças Ativas</p>
                    <p className="text-3xl font-black text-gray-900">
                        {farmacias.filter(f => f.licenca_ativa && !f.licenca_ativa.status_expirada).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Expiradas / Trial</p>
                    <p className="text-3xl font-black text-gray-900">
                        {farmacias.filter(f => !f.licenca_ativa || f.licenca_ativa.status_expirada).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                        <MapPin size={24} />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Gibagios Ativas</p>
                    <p className="text-3xl font-black text-gray-900">{gibagios.length}</p>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/50">
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-inner border w-fit">
                        <button
                            onClick={() => setSelectedTab('farmacias')}
                            className={`px-8 py-3 rounded-xl font-bold transition-all ${selectedTab === 'farmacias' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Farmácias
                        </button>
                        <button
                            onClick={() => setSelectedTab('gibagios')}
                            className={`px-8 py-3 rounded-xl font-bold transition-all ${selectedTab === 'gibagios' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Gibagios
                        </button>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, NUIT..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white text-gray-400 text-xs font-black uppercase tracking-[0.2em]">
                                <th className="px-8 py-6 text-left">Entidade</th>
                                <th className="px-8 py-6 text-left">Localização / Gibagio</th>
                                <th className="px-8 py-6 text-left">Estado da Licença</th>
                                <th className="px-8 py-6 text-left">Status Apps</th>
                                <th className="px-8 py-6 text-center">Ações de Gestão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredFarmacias.map(f => (
                                <tr key={f.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black">
                                                {f.nome.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 leading-tight">{f.nome}</p>
                                                <p className="text-xs text-gray-500 font-bold mt-1">NUIT: {f.nuit}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-black self-start">
                                                <MapPin size={12} /> {f.gibagio_nome || 'Sem Gibagio'}
                                            </span>
                                            <span className="text-[11px] text-gray-400 font-bold pl-1">{f.endereco.substring(0, 30)}...</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {f.licenca_ativa ? (
                                            <div className={`p-3 rounded-2xl border ${f.licenca_ativa.status_expirada ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-[10px] font-black uppercase ${f.licenca_ativa.status_expirada ? 'text-red-700' : 'text-emerald-700'}`}>
                                                        {f.licenca_ativa.tipo}
                                                    </span>
                                                    {f.licenca_ativa.status_expirada ? <AlertTriangle size={14} className="text-red-600" /> : <CheckCircle size={14} className="text-emerald-600" />}
                                                </div>
                                                <p className="text-xs font-bold text-gray-700 mt-1">Expira: {new Date(f.licenca_ativa.data_fim).toLocaleDateString()}</p>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Sem Licença</p>
                                                <button
                                                    onClick={() => handleRenovarLicenca(f.id)}
                                                    className="text-xs text-blue-600 font-bold hover:underline mt-1"
                                                >
                                                    Ativar Trial →
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <button
                                            onClick={() => handleToggleAtiva(f.id, f.is_ativa)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${f.is_ativa
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                        >
                                            {f.is_ativa ? 'Ativa no Market' : 'Bloqueada'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button className="p-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                                                <Users size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleRenovarLicenca(f.id)}
                                                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                                title="Renovar Licença"
                                            >
                                                <CreditCard size={18} />
                                            </button>
                                            <button className="p-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                                                <Settings size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Local Entities / Gibagios Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
                    <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                        <MapPin className="text-purple-600" />
                        Unidades Gibagio (Gestão)
                    </h3>
                    <div className="space-y-4">
                        {gibagios.map(g => (
                            <div key={g.id} className="p-5 border-2 border-gray-50 rounded-2xl flex items-center justify-between hover:border-purple-200 transition-all">
                                <div>
                                    <p className="font-black text-gray-900">{g.nome}</p>
                                    <p className="text-xs font-bold text-gray-400">CÓDIGO: {g.codigo}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 text-xs font-bold text-purple-600 bg-purple-50 rounded-xl">Gerir Usuarios</button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600"><Settings size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2rem] shadow-2xl text-white">
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                        <ArrowRight className="text-blue-400" />
                        Quick Actions Master
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white/10 rounded-3xl hover:bg-white/20 transition-all cursor-pointer border border-white/10">
                            <FileText size={32} className="text-blue-400 mb-4" />
                            <p className="font-black text-sm">Gerar Relatório Anual</p>
                        </div>
                        <div className="p-6 bg-white/10 rounded-3xl hover:bg-white/20 transition-all cursor-pointer border border-white/10">
                            <Users size={32} className="text-purple-400 mb-4" />
                            <p className="font-black text-sm">Auditoria de Logins</p>
                        </div>
                        <div className="p-6 bg-white/10 rounded-3xl hover:bg-white/20 transition-all cursor-pointer border border-white/10">
                            <AlertTriangle size={32} className="text-red-400 mb-4" />
                            <p className="font-black text-sm">Bloqueio em Massa</p>
                        </div>
                        <div className="p-6 bg-white/10 rounded-3xl hover:bg-white/20 transition-all cursor-pointer border border-white/10">
                            <Settings size={32} className="text-emerald-400 mb-4" />
                            <p className="font-black text-sm">Configuração Global</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
