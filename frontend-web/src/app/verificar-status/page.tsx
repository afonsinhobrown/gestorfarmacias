'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { Search, CheckCircle, Clock, XCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface StatusResponse {
    nome: string;
    email: string;
    telefone: string;
    status_aprovacao: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
    motivo_rejeicao?: string;
    data_cadastro: string;
    data_aprovacao?: string;
    tipo_veiculo: string;
    mensagem: string;
}

export default function VerificarStatusPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<StatusResponse | null>(null);
    const [error, setError] = useState('');

    const handleVerificar = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatus(null);

        try {
            const res = await api.post('/entregas/verificar-status/', { email });
            setStatus(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao verificar status');
            toast.error(err.response?.data?.error || 'Erro ao verificar status');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (statusAprovacao: string) => {
        switch (statusAprovacao) {
            case 'APROVADO':
                return <CheckCircle size={64} className="text-green-600" />;
            case 'PENDENTE':
                return <Clock size={64} className="text-yellow-600" />;
            case 'REJEITADO':
                return <XCircle size={64} className="text-red-600" />;
            default:
                return null;
        }
    };

    const getStatusColor = (statusAprovacao: string) => {
        switch (statusAprovacao) {
            case 'APROVADO':
                return 'from-green-600 to-emerald-600';
            case 'PENDENTE':
                return 'from-yellow-600 to-orange-600';
            case 'REJEITADO':
                return 'from-red-600 to-pink-600';
            default:
                return 'from-gray-600 to-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 py-12">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-gray-900 mb-2">Verificar Status do Cadastro</h1>
                    <p className="text-gray-600">Entregadores: consulte o status da sua solicitação</p>
                </div>

                {/* Formulário */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <form onSubmit={handleVerificar} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail size={16} className="inline mr-1" />
                                Email cadastrado
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Search size={20} />
                            {loading ? 'Verificando...' : 'VERIFICAR STATUS'}
                        </button>
                    </form>
                </div>

                {/* Resultado */}
                {status && (
                    <div className={`bg-gradient-to-r ${getStatusColor(status.status_aprovacao)} text-white rounded-2xl shadow-2xl p-8`}>
                        <div className="text-center mb-6">
                            {getStatusIcon(status.status_aprovacao)}
                            <h2 className="text-3xl font-black mt-4">{status.status_aprovacao}</h2>
                        </div>

                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 space-y-3">
                            <div>
                                <p className="text-sm opacity-75">Nome</p>
                                <p className="text-lg font-bold">{status.nome}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-75">Email</p>
                                <p className="text-lg font-bold">{status.email}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-75">Telefone</p>
                                <p className="text-lg font-bold">{status.telefone}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-75">Tipo de Veículo</p>
                                <p className="text-lg font-bold">{status.tipo_veiculo}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-75">Data do Cadastro</p>
                                <p className="text-lg font-bold">
                                    {new Date(status.data_cadastro).toLocaleDateString('pt-MZ')}
                                </p>
                            </div>
                            {status.data_aprovacao && (
                                <div>
                                    <p className="text-sm opacity-75">Data da Aprovação</p>
                                    <p className="text-lg font-bold">
                                        {new Date(status.data_aprovacao).toLocaleDateString('pt-MZ')}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 bg-white/30 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-lg">{status.mensagem}</p>
                        </div>

                        {status.motivo_rejeicao && (
                            <div className="mt-4 bg-red-900/50 backdrop-blur-sm rounded-xl p-4">
                                <p className="font-bold mb-2">Motivo da Rejeição:</p>
                                <p>{status.motivo_rejeicao}</p>
                            </div>
                        )}

                        {status.status_aprovacao === 'APROVADO' && (
                            <div className="mt-6 text-center">
                                <Link
                                    href="/login"
                                    className="inline-block px-8 py-3 bg-white text-green-600 rounded-lg font-bold hover:shadow-lg transition-all"
                                >
                                    FAZER LOGIN
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                        <XCircle size={48} className="text-red-600 mx-auto mb-3" />
                        <p className="text-red-800 font-bold">{error}</p>
                        <Link
                            href="/cadastrar"
                            className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
                        >
                            FAZER CADASTRO
                        </Link>
                    </div>
                )}

                {/* Link voltar */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-purple-600 hover:underline">
                        ← Voltar para início
                    </Link>
                </div>
            </div>
        </div>
    );
}
