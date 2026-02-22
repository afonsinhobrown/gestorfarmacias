'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { User, Building2, Bike, Shield, Lock, Mail, ChevronRight, Info, CheckCircle2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type TipoUsuario = 'CLIENTE' | 'FARMACIA' | 'ENTREGADOR' | 'ADMIN';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [tipoSelecionado, setTipoSelecionado] = useState<TipoUsuario | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTestCreds, setShowTestCreds] = useState(false);

    const tipos = [
        {
            tipo: 'FARMACIA' as TipoUsuario,
            nome: 'Farmácia',
            descricao: 'Gestão de Estoque e Vendas',
            icon: Building2,
            color: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            rota: '/dashboard/vendas'
        },
        {
            tipo: 'ADMIN' as TipoUsuario,
            nome: 'Administrador',
            descricao: 'Controlo Master do Sistema',
            icon: Shield,
            color: 'from-blue-600 to-indigo-700',
            bg: 'bg-blue-50',
            text: 'text-blue-700',
            rota: '/dashboard/admin'
        },
        {
            tipo: 'ENTREGADOR' as TipoUsuario,
            nome: 'Entregador',
            descricao: 'Gestão de Entregas e Pedidos',
            icon: Bike,
            color: 'from-purple-500 to-fuchsia-600',
            bg: 'bg-purple-50',
            text: 'text-purple-700',
            rota: '/motoboy'
        },
        {
            tipo: 'CLIENTE' as TipoUsuario,
            nome: 'Cliente',
            descricao: 'Compra de Medicamentos',
            icon: User,
            color: 'from-orange-400 to-red-500',
            bg: 'bg-orange-50',
            text: 'text-orange-700',
            rota: '/cliente'
        }
    ];

    const testCredentials: any = {
        ADMIN: { email: 'admin@gestorfarma.com', pass: 'admin123' },
        FARMACIA: { email: 'farmacia@gestorfarma.com', pass: 'farmacia123' },
        ENTREGADOR: { email: 'entregador@gestorfarma.com', pass: 'entregador123' },
        CLIENTE: { email: 'cliente@gestorfarma.com', pass: 'cliente123' }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tipoSelecionado) return toast.error('Selecione um tipo de acesso.');

        setLoading(true);
        try {
            const res = await api.post('/auth/login/', { email, password });

            if (res.data.user.tipo_usuario !== tipoSelecionado) {
                toast.error(`Esta conta não pertence ao perfil ${tipoSelecionado}.`);
                setLoading(false);
                return;
            }

            login(res.data.user, res.data.access);
            toast.success(`Seja bem-vindo, ${res.data.user.first_name}!`);

            const config = tipos.find(t => t.tipo === tipoSelecionado);
            router.push(config?.rota || '/');
        } catch (error: any) {
            console.error('[LOGIN ERROR]', error);
            const detail = error.response?.data?.detail;
            const nonFieldErrors = error.response?.data?.non_field_errors;
            const message = detail || (Array.isArray(nonFieldErrors) ? nonFieldErrors[0] : null) || 'Credenciais inválidas ou erro no servidor.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const preencherTeste = () => {
        if (!tipoSelecionado) return;
        const creds = testCredentials[tipoSelecionado];
        setEmail(creds.email);
        setPassword(creds.pass);
        toast.info('Credenciais de teste preenchidas!');
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-100">

            {/* Background Decorativo */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-[1100px] flex flex-col md:flex-row bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-gray-100 relative z-10 transition-all duration-500">

                {/* Lado Esquerdo - Info/ Branding */}
                <div className="md:w-[42%] bg-gray-900 p-10 md:p-14 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#3b82f633,transparent)]"></div>

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20 rotate-3">
                            <Building2 size={32} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">
                            A sua Farmácia, <br />
                            <span className="text-blue-400">Totalmente Digital.</span>
                        </h1>
                        <p className="text-gray-400 text-lg font-medium leading-relaxed">
                            Gestão inteligente de estoque, vendas em tempo real e logística integrada numa única plataforma.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                                <CheckCircle2 size={18} className="text-blue-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-300">Inventário Inteligente</p>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-600/20 transition-colors">
                                <CheckCircle2 size={18} className="text-emerald-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-300">Vendas Local e Mobile</p>
                        </div>
                    </div>
                </div>

                {/* Lado Direito - Ação */}
                <div className="flex-1 p-8 md:p-16 flex flex-col">
                    {!tipoSelecionado ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">Para começar,</h2>
                            <p className="text-gray-500 mb-10 font-medium">Como deseja aceder ao sistema hoje?</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {tipos.map((t) => (
                                    <button
                                        key={t.tipo}
                                        onClick={() => setTipoSelecionado(t.tipo)}
                                        className="group p-6 rounded-3xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50 transition-all text-left flex flex-col gap-4 relative overflow-hidden"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${t.color} text-white shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform`}>
                                            <t.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{t.nome}</h3>
                                            <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-tight">{t.descricao}</p>
                                        </div>
                                        <ChevronRight size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                            <button
                                onClick={() => setTipoSelecionado(null)}
                                className="inline-flex items-center gap-2 text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest mb-8 transition-colors"
                            >
                                <ChevronRight className="rotate-180" size={14} /> Voltar à seleção
                            </button>

                            <div className="mb-10 flex items-center gap-6">
                                {(() => {
                                    const config = tipos.find(t => t.tipo === tipoSelecionado);
                                    return (
                                        <>
                                            <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${config?.color} flex items-center justify-center text-white shadow-xl shadow-gray-200`}>
                                                {config && <config.icon size={32} />}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-gray-900">Acesso {config?.nome}</h2>
                                                <p className="text-sm text-gray-400 font-medium">Insira as suas credenciais autorizadas</p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Endereço de Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500/10 focus:bg-white rounded-[1.25rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 shadow-inner"
                                            placeholder="seu@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500/10 focus:bg-white rounded-[1.25rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 shadow-inner"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-5 bg-gray-900 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest hover:bg-black hover:shadow-2xl hover:shadow-gray-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <RefreshCcw className="animate-spin" size={18} />
                                    ) : (
                                        <>Entrar no Sistema <ChevronRight size={18} /></>
                                    )}
                                </button>
                            </form>

                            {/* Painel de Credenciais de Teste */}
                            <div className="mt-8 bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-500 font-bold text-[10px] uppercase tracking-widest">
                                        <Info size={14} className="text-blue-500" /> Modo Demonstração
                                    </div>
                                    <button
                                        onClick={preencherTeste}
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-lg transition-colors"
                                    >
                                        Preencher credenciais
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Login Exemplo</p>
                                        <p className="text-xs font-bold text-gray-600 truncate">{testCredentials[tipoSelecionado].email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Senha</p>
                                        <p className="text-xs font-bold text-gray-600">{testCredentials[tipoSelecionado].pass}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10 text-center space-y-4 relative z-10">
                <p className="text-gray-400 text-sm font-medium">
                    Ainda não tem acesso à plataforma?{' '}
                    <Link href="/cadastrar" className="text-blue-600 font-bold hover:underline">Solicitar Registo</Link>
                </p>
                <div className="flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <span className="text-[10px] font-black uppercase tracking-widest">Secure Payments</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">M-Pesa Integrated</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">GDPR Compliant</span>
                </div>
            </div>
        </div>
    );
}
