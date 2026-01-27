'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { User, Building2, Bike, Shield, Lock, Mail } from 'lucide-react';
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

    const tipos = [
        {
            tipo: 'CLIENTE' as TipoUsuario,
            nome: 'Cliente',
            descricao: 'Comprar medicamentos',
            icon: User,
            cor: 'blue',
            rota: '/cliente'
        },
        {
            tipo: 'FARMACIA' as TipoUsuario,
            nome: 'Farmácia',
            descricao: 'Vender e gerenciar',
            icon: Building2,
            cor: 'green',
            rota: '/dashboard/vendas'
        },
        {
            tipo: 'ENTREGADOR' as TipoUsuario,
            nome: 'Entregador',
            descricao: 'Fazer entregas',
            icon: Bike,
            cor: 'purple',
            rota: '/motoboy'
        },
        {
            tipo: 'ADMIN' as TipoUsuario,
            nome: 'Administrador',
            descricao: 'Gerenciar plataforma',
            icon: Shield,
            cor: 'red',
            rota: '/dashboard/admin'
        }
    ];

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tipoSelecionado) {
            toast.error('Selecione o tipo de usuário');
            return;
        }

        setLoading(true);

        try {
            // Login normal via API
            const res = await api.post('/auth/login/', { email, password });

            // Verificar se o tipo de usuário corresponde
            const tipoEsperado = tipoSelecionado;
            if (res.data.user.tipo_usuario !== tipoEsperado) {
                toast.error(`Esta conta não é de ${tipos.find(t => t.tipo === tipoSelecionado)?.nome}`);
                return;
            }

            login(res.data.user, res.data.access);

            const tipoConfig = tipos.find(t => t.tipo === tipoSelecionado);
            toast.success(`Bem-vindo, ${res.data.user.nome}!`);
            router.push(tipoConfig?.rota || '/');

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const cores: any = {
        blue: 'from-blue-600 to-blue-700',
        green: 'from-green-600 to-green-700',
        purple: 'from-purple-600 to-purple-700',
        red: 'from-red-600 to-red-700'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-5xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-gray-900 mb-2">GestorFarma</h1>
                    <p className="text-gray-600 text-lg">Bem-vindo de volta! Selecione como deseja entrar:</p>
                </div>

                {!tipoSelecionado ? (
                    /* Seleção de Tipo */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tipos.filter(t => t.tipo !== 'CLIENTE').map((tipo) => (
                            <button
                                key={tipo.tipo}
                                onClick={() => setTipoSelecionado(tipo.tipo)}
                                className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-gray-300 hover:shadow-2xl transition-all group"
                            >
                                <div className={`w-16 h-16 bg-gradient-to-br ${cores[tipo.cor]} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                    <tipo.icon size={32} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{tipo.nome}</h3>
                                <p className="text-sm text-gray-600">{tipo.descricao}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    /* Formulário de Login */
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
                        <button
                            onClick={() => setTipoSelecionado(null)}
                            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
                        >
                            ← Voltar
                        </button>

                        <div className="text-center mb-6">
                            {(() => {
                                const tipoConfig = tipos.find(t => t.tipo === tipoSelecionado);
                                const IconComponent = tipoConfig?.icon;

                                return (
                                    <>
                                        <div className={`w-20 h-20 bg-gradient-to-br ${tipoConfig?.cor ? cores[tipoConfig.cor] : 'from-gray-600 to-gray-700'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                            {IconComponent && <IconComponent size={40} className="text-white" />}
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Login como {tipoConfig?.nome}
                                        </h2>
                                    </>
                                );
                            })()}
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail size={16} className="inline mr-1" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Lock size={16} className="inline mr-1" />
                                    Senha
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 bg-gradient-to-r ${tipoSelecionado ? cores[tipos.find(t => t.tipo === tipoSelecionado)?.cor || 'blue'] : 'from-gray-600 to-gray-700'} text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50`}
                            >
                                {loading ? 'Entrando...' : 'ENTRAR'}
                            </button>
                        </form>

                        {/* Credenciais de Teste */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Credenciais de Teste:</p>
                            <div className="space-y-1">
                                {tipoSelecionado === 'ADMIN' && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-bold">Login:</span> admin@gestorfarma.com / admin123
                                    </p>
                                )}
                                {tipoSelecionado === 'FARMACIA' && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-bold">Login:</span> farmacia@gestorfarma.com / farmacia123
                                    </p>
                                )}
                                {tipoSelecionado === 'ENTREGADOR' && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-bold">Login:</span> entregador@gestorfarma.com / entregador123
                                    </p>
                                )}
                                {tipoSelecionado === 'CLIENTE' && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-bold">Login:</span> cliente@gestorfarma.com / cliente123
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Não tem conta?{' '}
                                <Link href="/cadastrar" className="text-blue-600 font-bold hover:underline">
                                    Cadastre-se
                                </Link>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
