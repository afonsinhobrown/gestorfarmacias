'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Lock,
    Unlock,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Clock,
    User,
    Monitor,
    Settings,
    PlusCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

interface Movimento {
    id: number;
    tipo: 'REFORCO' | 'SANGRIA' | 'PAGAMENTO';
    valor: string;
    motivo: string;
    data_hora: string;
}

interface Sessao {
    id: number;
    caixa_nome: string;
    operador_nome: string;
    data_abertura: string;
    valor_abertura: string;
    valor_sistema_dinheiro: string;
    valor_sistema_pos: string;
    valor_sistema_mpesa: string;
    valor_sistema_emola: string;
    valor_sistema_outros: string;
    total_sistema: string;
    valor_declarado_dinheiro: string;
    total_declarado: string;
    diferenca: string;
    status: 'ABERTO' | 'FECHADO';
    movimentos: Movimento[];
}

export default function CaixaPage() {
    const [sessao, setSessao] = useState<Sessao | null>(null);
    const [loading, setLoading] = useState(true);
    const [configuracao, setConfiguracao] = useState<{ terminais: any[] }>({ terminais: [] });

    // Estados para formulários
    const [activeTab, setActiveTab] = useState<'operacional' | 'terminais'>('operacional');
    const { user } = useAuthStore();
    const isGerente = user?.tipo_usuario === 'FARMACIA' || ['GERENTE', 'FARMACIA', 'ADMIN'].includes(user?.cargo?.toUpperCase() || '');

    const [showMovimento, setShowMovimento] = useState(false);
    const [showFechamento, setShowFechamento] = useState(false);
    const [showNovoTerminal, setShowNovoTerminal] = useState(false);

    const [formDataAbertura, setFormDataAbertura] = useState({ caixa_id: '', valor_abertura: '0' });
    const [formDataMovimento, setFormDataMovimento] = useState({ tipo: 'REFORCO', valor: '', motivo: '' });
    const [formDataTerminal, setFormDataTerminal] = useState({ nome: '', codigo: '' });
    const [formDataFecho, setFormDataFecho] = useState({
        valor_declarado_dinheiro: '',
        valor_declarado_pos: '',
        valor_declarado_mpesa: '',
        valor_declarado_emola: '',
        valor_declarado_outros: '0',
        observacoes: ''
    });

    useEffect(() => {
        carregarStatusCaixa();
        carregarTerminais();
    }, []);

    const carregarStatusCaixa = async () => {
        try {
            const res = await api.get('/caixa/sessao/');
            if (res.data.status === 'SEM_SESSAO') {
                setSessao(null);
            } else {
                setSessao(res.data);
                setFormDataFecho(prev => ({
                    ...prev,
                    valor_declarado_pos: res.data.valor_sistema_pos,
                    valor_declarado_mpesa: res.data.valor_sistema_mpesa,
                    valor_declarado_emola: res.data.valor_sistema_emola,
                }));
            }
        } catch (error) {
            toast.error('Erro ao carregar dados do caixa');
        } finally {
            setLoading(false);
        }
    };

    const carregarTerminais = async () => {
        try {
            const res = await api.get('/caixa/terminais/');
            setConfiguracao({ terminais: res.data.results || res.data });
        } catch (error) { }
    };

    const handleAbrirCaixa = async () => {
        if (!formDataAbertura.caixa_id) return toast.error('Selecione um terminal');
        try {
            await api.post('/caixa/sessao/abrir/', formDataAbertura);
            toast.success('Caixa aberto com sucesso!');
            carregarStatusCaixa();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao abrir caixa');
        }
    };

    const handleAddMovimento = async () => {
        try {
            await api.post('/caixa/movimentos/', formDataMovimento);
            toast.success('Movimento registrado!');
            carregarStatusCaixa();
            setShowMovimento(false);
            setFormDataMovimento({ tipo: 'REFORCO', valor: '', motivo: '' });
        } catch (error) { }
    };

    const handleFecharCaixa = async () => {
        try {
            await api.post('/caixa/sessao/fechar/', formDataFecho);
            toast.success('Caixa fechado com sucesso!');
            carregarStatusCaixa();
            setShowFechamento(false);
        } catch (error) { }
    };

    const handleCriarTerminal = async () => {
        if (!formDataTerminal.nome || !formDataTerminal.codigo) return toast.error('Preencha os dados do terminal');
        try {
            await api.post('/caixa/terminais/', formDataTerminal);
            toast.success('Terminal criado com sucesso!');
            setShowNovoTerminal(false);
            setFormDataTerminal({ nome: '', codigo: '' });
            carregarTerminais();
        } catch (error: any) {
            if (error.response?.data) {
                const apiErrors = error.response.data;
                const firstError = Object.values(apiErrors)[0];
                if (Array.isArray(firstError)) {
                    toast.error(firstError[0]);
                } else if (typeof firstError === 'string') {
                    toast.error(firstError);
                } else {
                    toast.error(error.response?.data?.error || 'Erro ao criar terminal');
                }
            } else {
                toast.error('Erro de conexão ou servidor.');
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">Carregando GestorFarma Caixa...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Tabs Selector */}
            {isGerente && (
                <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('operacional')}
                        className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'operacional' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                    >
                        <Monitor size={16} /> OPERACIONAL
                    </button>
                    <button
                        onClick={() => setActiveTab('terminais')}
                        className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'terminais' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                    >
                        <Settings size={16} /> CONFIGURAR TERMINAIS
                    </button>
                </div>
            )}

            {activeTab === 'operacional' ? (
                !sessao ? (
                    /* TELA DE CAIXA FECHADO (ABERTURA) */
                    <div className="max-w-2xl mx-auto mt-6 animate-in slide-in-from-top duration-500">
                        <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="p-10 text-center bg-gray-50 border-b">
                                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Lock size={40} />
                                </div>
                                <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Caixa Fechado</h1>
                                <p className="text-gray-500 mt-2 font-medium">Selecione um terminal para abrir o turno.</p>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Selecione o Terminal</label>
                                    <select
                                        value={formDataAbertura.caixa_id}
                                        onChange={e => setFormDataAbertura({ ...formDataAbertura, caixa_id: e.target.value })}
                                        className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all font-bold text-gray-700"
                                    >
                                        <option value="">--- Selecione um Caixa ---</option>
                                        {configuracao.terminais.map(t => (
                                            <option key={t.id} value={t.id}>{t.nome} ({t.codigo})</option>
                                        ))}
                                    </select>
                                    {configuracao.terminais.length === 0 && (
                                        <p className="text-xs text-amber-600 font-bold flex items-center gap-2">
                                            <AlertTriangle size={14} /> Nenhum terminal cadastrado.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Fundo de Maneio (Abertura)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                                        <input
                                            type="number"
                                            value={formDataAbertura.valor_abertura}
                                            onChange={e => setFormDataAbertura({ ...formDataAbertura, valor_abertura: e.target.value })}
                                            className="w-full p-5 pl-14 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition-all font-black text-3xl text-gray-800"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAbrirCaixa}
                                    disabled={!formDataAbertura.caixa_id}
                                    className="w-full py-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black rounded-3xl shadow-xl transition-all active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-3 text-sm"
                                >
                                    <Unlock size={24} /> ABRIR CAIXA AGORA
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* TELA DE CAIXA ABERTO (OPERACIONAL) */
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest mb-1">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    Turno em Andamento
                                </div>
                                <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">
                                    {sessao.caixa_nome}
                                </h1>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-black bg-white px-3 py-1 rounded-full border shadow-sm uppercase uppercase">
                                        <User size={14} className="text-blue-500" /> {sessao.operador_nome}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-black bg-white px-3 py-1 rounded-full border shadow-sm uppercase">
                                        <Calendar size={14} className="text-blue-500" /> {new Date(sessao.data_abertura).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-black bg-white px-3 py-1 rounded-full border shadow-sm uppercase">
                                        <Clock size={14} className="text-blue-500" /> {new Date(sessao.data_abertura).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowMovimento(true)}
                                    className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-black text-xs rounded-xl hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2 uppercase"
                                >
                                    <ArrowDownCircle size={18} className="text-red-500" /> Reg. Movimento
                                </button>
                                <button
                                    onClick={() => setShowFechamento(true)}
                                    className="px-8 py-3 bg-gray-900 text-white font-black text-xs rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest"
                                >
                                    <Lock size={18} /> Fechar Caixa
                                </button>
                            </div>
                        </div>

                        {/* Grid de Saldos */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Dinheiro (Sistema)</span>
                                <div className="text-2xl font-black text-gray-800">{formatPrice(parseFloat(sessao.valor_sistema_dinheiro))}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">M-Pesa / E-Mola</span>
                                <div className="text-2xl font-black text-emerald-600">
                                    {formatPrice(parseFloat(sessao.valor_sistema_mpesa) + parseFloat(sessao.valor_sistema_emola))}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cartão (POS)</span>
                                <div className="text-2xl font-black text-blue-600">{formatPrice(parseFloat(sessao.valor_sistema_pos))}</div>
                            </div>
                            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl">
                                <span className="text-[10px] font-black text-gray-400/50 uppercase tracking-widest block mb-1">Total Esperado</span>
                                <div className="text-3xl font-black text-white">{formatPrice(parseFloat(sessao.total_sistema))}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Histórico */}
                            <div className="lg:col-span-2 space-y-4">
                                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
                                    <ArrowUpCircle className="text-blue-500" /> Histórico do Turno
                                </h2>
                                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Hora</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Tipo</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Motivo</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {sessao.movimentos.length === 0 ? (
                                                <tr><td colSpan={4} className="p-12 text-center text-gray-400 text-sm italic">Nenhum movimento registrado.</td></tr>
                                            ) : sessao.movimentos.map(m => (
                                                <tr key={m.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{new Date(m.data_hora).toLocaleTimeString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.tipo === 'REFORCO' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                            {m.tipo}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-gray-600">{m.motivo}</td>
                                                    <td className={`px-6 py-4 text-right font-black ${m.tipo === 'REFORCO' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {m.tipo === 'REFORCO' ? '+' : '-'} {formatPrice(parseFloat(m.valor))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                                    <Monitor className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110" size={180} />
                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-4 italic">GestorFarma Intelligence</h3>
                                    <p className="text-blue-100 text-sm font-medium leading-relaxed">
                                        Lembre-se de registar cada saída de dinheiro (sangria) para que o fecho seja exato.
                                        Omitir sangrias causa faltas de caixa!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            ) : (
                /* ABA DE GESTÃO DE TERMINAIS */
                <div className="space-y-6 animate-in slide-in-from-right duration-500">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">Terminais de Venda</h1>
                            <p className="text-gray-500 text-sm font-medium">Configuração de estações físicas (balcão/caixa).</p>
                        </div>
                        <button
                            onClick={() => setShowNovoTerminal(true)}
                            className="px-6 py-3 bg-blue-600 text-white font-black text-xs rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 uppercase tracking-widest"
                        >
                            <PlusCircle size={18} /> Novo Terminal
                        </button>
                    </div>

                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do Terminal</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {configuracao.terminais.length === 0 ? (
                                    <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">Nenhum terminal cadastrado.</td></tr>
                                ) : configuracao.terminais.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-8 py-6 font-black text-blue-600">{t.codigo}</td>
                                        <td className="px-8 py-6 text-sm font-black text-gray-800 uppercase">{t.nome}</td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${t.is_ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                {t.is_ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">Configurar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {showNovoTerminal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-10 space-y-6">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Novo Terminal</h2>
                        <div className="space-y-4">
                            <input
                                placeholder="CÓDIGO (ex: CX01)"
                                value={formDataTerminal.codigo}
                                onChange={e => setFormDataTerminal({ ...formDataTerminal, codigo: e.target.value.toUpperCase() })}
                                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none"
                            />
                            <input
                                placeholder="NOME (ex: Balcão Central)"
                                value={formDataTerminal.nome}
                                onChange={e => setFormDataTerminal({ ...formDataTerminal, nome: e.target.value })}
                                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowNovoTerminal(false)} className="flex-1 py-4 font-black text-gray-400 uppercase">Voltar</button>
                            <button onClick={handleCriarTerminal} className="flex-2 bg-blue-600 text-white font-black px-8 py-4 rounded-xl shadow-lg">CRIAR AGORA</button>
                        </div>
                    </div>
                </div>
            )}

            {showMovimento && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-gray-800">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-10 space-y-6 text-gray-800">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800">Registo de Tesouraria</h2>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button onClick={() => setFormDataMovimento({ ...formDataMovimento, tipo: 'REFORCO' })} className={`flex-1 py-3 text-[10px] font-black rounded-lg ${formDataMovimento.tipo === 'REFORCO' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>REFORÇO (+)</button>
                            <button onClick={() => setFormDataMovimento({ ...formDataMovimento, tipo: 'SANGRIA' })} className={`flex-1 py-3 text-[10px] font-black rounded-lg ${formDataMovimento.tipo === 'SANGRIA' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}>SANGRIA (-)</button>
                        </div>
                        <input
                            type="number"
                            placeholder="Valor..."
                            value={formDataMovimento.valor}
                            onChange={e => setFormDataMovimento({ ...formDataMovimento, valor: e.target.value })}
                            className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-2xl focus:border-blue-500 outline-none"
                        />
                        <textarea
                            placeholder="Motivo..."
                            value={formDataMovimento.motivo}
                            onChange={e => setFormDataMovimento({ ...formDataMovimento, motivo: e.target.value })}
                            className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-500 outline-none h-24"
                        />
                        <button onClick={handleAddMovimento} className={`w-full py-5 font-black text-white rounded-2xl shadow-xl ${formDataMovimento.tipo === 'REFORCO' ? 'bg-emerald-600' : 'bg-red-600'}`}>CONFIRMAR</button>
                    </div>
                </div>
            )}

            {showFechamento && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden my-auto grid grid-cols-1 md:grid-cols-2">
                        <div className="p-12 space-y-8">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-800">Leitura de Fecho</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {['dinheiro', 'pos', 'mpesa', 'emola'].map(field => (
                                    <div key={field} className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase">{field}</label>
                                        <input
                                            type="number"
                                            value={(formDataFecho as any)[`valor_declarado_${field}`]}
                                            onChange={e => setFormDataFecho({ ...formDataFecho, [`valor_declarado_${field}`]: e.target.value })}
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-black focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                            <textarea
                                placeholder="Observações..."
                                className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl font-medium text-sm h-24 focus:border-blue-500 outline-none"
                                value={formDataFecho.observacoes}
                                onChange={e => setFormDataFecho({ ...formDataFecho, observacoes: e.target.value })}
                            />
                            <div className="flex gap-4">
                                <button onClick={() => setShowFechamento(false)} className="flex-1 py-4 font-black text-gray-400 uppercase">Sair</button>
                                <button onClick={handleFecharCaixa} className="flex-2 bg-gray-900 text-white font-black px-8 py-4 rounded-xl shadow-xl">FECHAR TURNO</button>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-12 flex flex-col justify-center border-l space-y-6">
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Resumo do Sistema</h3>
                                <div className="flex justify-between text-sm font-bold text-gray-700"><span>Dinheiro:</span><span>{formatPrice(parseFloat(sessao?.valor_sistema_dinheiro || '0'))}</span></div>
                                <div className="flex justify-between text-sm font-bold text-gray-700"><span>Outros:</span><span>{formatPrice(parseFloat(sessao?.total_sistema || '0') - parseFloat(sessao?.valor_sistema_dinheiro || '0'))}</span></div>
                                <div className="h-px bg-gray-100 my-4" />
                                <div className="flex justify-between text-xl font-black text-gray-900"><span>TOTAL:</span><span>{formatPrice(parseFloat(sessao?.total_sistema || '0'))}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
