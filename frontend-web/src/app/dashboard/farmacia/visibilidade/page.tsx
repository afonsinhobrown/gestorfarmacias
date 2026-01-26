'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { TrendingUp, Check, Upload, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Plano {
    id: number;
    nome: string;
    duracao_dias: number;
    preco: string;
    descricao: string;
    ordem_prioridade: number;
}

interface Assinatura {
    id: number;
    plano_detalhes: Plano;
    status: string;
    data_inicio: string;
    data_fim: string;
    dias_restantes: number;
}

export default function AumentarVisibilidadeFarmacia() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [planos, setPlanos] = useState<Plano[]>([]);
    const [assinaturaAtiva, setAssinaturaAtiva] = useState<Assinatura | null>(null);
    const [planoSelecionado, setPlanoSelecionado] = useState<number | null>(null);
    const [comprovativo, setComprovativo] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (!user || user.tipo_usuario !== 'FARMACIA') {
            router.push('/login');
            return;
        }
        fetchDados();
    }, [user, router]);

    const fetchDados = async () => {
        try {
            const [planosRes, assinaturaRes] = await Promise.all([
                api.get('/prioridade/planos/'),
                api.get('/prioridade/minha-assinatura/').catch(() => ({ data: null }))
            ]);

            setPlanos(planosRes.data);
            setAssinaturaAtiva(assinaturaRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleAssinar = async () => {
        if (!planoSelecionado) {
            toast.error('Selecione um plano');
            return;
        }

        if (!comprovativo) {
            toast.error('Envie o comprovativo de pagamento');
            return;
        }

        setEnviando(true);

        try {
            const formData = new FormData();
            formData.append('plano', planoSelecionado.toString());
            formData.append('comprovativo_pagamento', comprovativo);

            const plano = planos.find(p => p.id === planoSelecionado);
            formData.append('valor_pago', plano?.preco || '0');

            await api.post('/prioridade/assinar/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Solicitação enviada! Aguarde aprovação do admin.');
            fetchDados();
            setPlanoSelecionado(null);
            setComprovativo(null);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Erro ao enviar solicitação');
        } finally {
            setEnviando(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
                        <TrendingUp size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2">Aumentar Visibilidade</h1>
                    <p className="text-gray-600 text-lg">Apareça em destaque para mais clientes</p>
                </div>

                {/* Assinatura Ativa */}
                {assinaturaAtiva && (
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8 mb-8 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Star size={24} className="fill-current" />
                                    <h2 className="text-2xl font-bold">Plano Ativo</h2>
                                </div>
                                <p className="text-lg opacity-90">{assinaturaAtiva.plano_detalhes.nome}</p>
                                <p className="text-sm opacity-75 mt-2">
                                    {assinaturaAtiva.dias_restantes} dias restantes
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm opacity-75">Válido até</p>
                                <p className="text-xl font-bold">
                                    {new Date(assinaturaAtiva.data_fim).toLocaleDateString('pt-MZ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Planos Disponíveis */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {planos.map((plano) => (
                        <div
                            key={plano.id}
                            onClick={() => !assinaturaAtiva && setPlanoSelecionado(plano.id)}
                            className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all cursor-pointer ${planoSelecionado === plano.id
                                    ? 'border-blue-600 shadow-2xl scale-105'
                                    : 'border-transparent hover:border-blue-300 hover:shadow-xl'
                                } ${assinaturaAtiva ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {plano.duracao_dias === 30 && (
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                                    MAIS POPULAR
                                </div>
                            )}

                            <h3 className="text-2xl font-black text-gray-900 mb-2">{plano.duracao_dias} dias</h3>
                            <p className="text-4xl font-black text-blue-600 mb-4">
                                {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(parseFloat(plano.preco))}
                            </p>
                            <p className="text-gray-600 text-sm mb-4">{plano.descricao}</p>

                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <Check size={16} className="text-green-600" />
                                    Aparece em destaque
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <Check size={16} className="text-green-600" />
                                    Badge "Recomendado"
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-700">
                                    <Check size={16} className="text-green-600" />
                                    Mais visibilidade
                                </li>
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Formulário de Pagamento */}
                {planoSelecionado && !assinaturaAtiva && (
                    <div className="bg-white rounded-2xl p-8 shadow-xl">
                        <h2 className="text-2xl font-bold mb-6">Finalizar Assinatura</h2>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                            <h3 className="font-bold text-blue-900 mb-3">Dados para Transferência:</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Banco:</span>
                                    <span className="font-bold">BIM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Conta:</span>
                                    <span className="font-bold">1234567890</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">NIB:</span>
                                    <span className="font-bold">000123456789012345678</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Titular:</span>
                                    <span className="font-bold">GestorFarma Lda</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Upload size={16} className="inline mr-1" />
                                Comprovativo de Pagamento *
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setComprovativo(e.target.files?.[0] || null)}
                                className="w-full p-3 border rounded-lg"
                            />
                            {comprovativo && (
                                <p className="text-sm text-green-600 mt-2">✓ {comprovativo.name}</p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setPlanoSelecionado(null)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAssinar}
                                disabled={enviando || !comprovativo}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50"
                            >
                                {enviando ? 'Enviando...' : 'Enviar Solicitação'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
