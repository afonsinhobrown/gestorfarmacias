'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { User, Lock, Mail, Server, RefreshCcw, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();

    // Estados
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [apiUrl, setApiUrl] = useState('');

    // Adicionar log
    const addLog = (msg: string) => {
        setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
        console.log(msg);
    };

    useEffect(() => {
        // Mostrar qual API está configurada
        setApiUrl(api.defaults.baseURL || 'Indefinido');
        addLog(`Iniciando Login Page.`);
        addLog(`API Base URL Atual: ${api.defaults.baseURL}`);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        addLog('Tentando autenticar...');

        try {
            addLog(`POST ${apiUrl}/auth/login/ com email: ${email}`);

            const res = await api.post('/auth/login/', { email, password });

            addLog('Resposta recebida: ' + res.status);

            if (res.status === 200 || res.status === 201) {
                const userData = res.data.user; // Ajuste conforme payload real do backend
                const token = res.data.access;

                if (!userData || !token) {
                    throw new Error('Token ou Dados de Usuário ausentes na resposta.');
                }

                addLog(`Login SUCESSO! Usuário: ${userData.first_name} (${userData.tipo_usuario})`);

                // Salvar no Store
                login(userData, token);
                toast.success(`Bem-vindo, ${userData.first_name || 'Usuário'}!`);

                // Redirecionamento Baseado no Tipo
                const rotas: any = {
                    'ADMIN': '/dashboard/admin',
                    'FARMACIA': '/dashboard/vendas', // ou /dashboard/farmacia
                    'CLIENTE': '/cliente',
                    'ENTREGADOR': '/motoboy'
                };

                const destino = rotas[userData.tipo_usuario] || '/';
                addLog(`Redirecionando para: ${destino}`);

                // Pequeno delay para ler logs se quiser
                setTimeout(() => {
                    router.push(destino);
                }, 1000);
            }

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail
                || error.response?.data?.erro
                || error.message
                || 'Erro desconhecido';

            addLog(`ERRO: ${msg}`);
            if (error.response) {
                addLog(`Status: ${error.response.status}`);
                addLog(`URL Tentada: ${error.config?.url}`);
                addLog(`BaseURL usada: ${error.config?.baseURL}`);
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const limparSessao = () => {
        localStorage.clear();
        addLog('LocalStorage limpo. Recarregando página...');
        setTimeout(() => window.location.reload(), 500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-xl overflow-hidden">

                {/* Lado Esquerdo - Formulário */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 mb-2">Acesso Seguro</h1>
                        <p className="text-gray-500">Faça login para gerenciar sua farmácia.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                                    placeholder="ex: admin@gestorfarma.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Senha de Acesso</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-200"
                        >
                            {loading ? <RefreshCcw className="animate-spin" /> : <LogIn />}
                            {loading ? 'Validando...' : 'ENTRAR NO SISTEMA'}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-between text-sm">
                        <Link href="/cadastrar" className="text-blue-600 font-bold hover:underline">
                            Criar nova conta
                        </Link>
                        <button onClick={limparSessao} className="text-red-500 font-bold hover:text-red-700 flex items-center gap-1">
                            Resetar App
                        </button>
                    </div>
                </div>

                {/* Lado Direito - Debug e Info */}
                <div className="bg-gray-900 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20 -ml-32 -mb-32"></div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold mb-6 backdrop-blur-sm border border-white/10">
                            <Server size={12} className="text-green-400" />
                            Ambiente: {process.env.NODE_ENV?.toUpperCase()}
                        </div>

                        <h2 className="text-2xl font-bold mb-4">Console de Diagnóstico</h2>
                        <div className="bg-black/30 rounded-xl p-4 h-[300px] overflow-y-auto font-mono text-xs space-y-2 border border-white/5 scrollbar-thin scrollbar-thumb-white/20">
                            {debugLogs.length === 0 && (
                                <p className="text-gray-500 italic">Aguardando ações...</p>
                            )}
                            {debugLogs.map((log, i) => (
                                <div key={i} className="border-b border-white/5 pb-1 last:border-0 text-gray-300 break-all">
                                    {log}
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 text-[10px] text-gray-500">API Target: {apiUrl}</p>
                        <p className="text-[10px] text-gray-500 break-all">Build URL: {process.env.NEXT_PUBLIC_API_URL}</p>
                    </div>

                    <div className="relative z-10 mt-6">
                        <p className="text-gray-400 text-sm">Problemas com login? Verifique o console acima para identificar erros de conexão ou credenciais.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
