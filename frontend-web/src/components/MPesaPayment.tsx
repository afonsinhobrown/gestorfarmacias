'use client';

import { useState } from 'react';
import { Smartphone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface MPesaPaymentProps {
    pedidoId: number;
    valor: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function MPesaPayment({ pedidoId, valor, onSuccess, onCancel }: MPesaPaymentProps) {
    const [telefone, setTelefone] = useState('');
    const [loading, setLoading] = useState(false);
    const [pagamentoId, setPagamentoId] = useState<number | null>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

    const formatarTelefone = (value: string) => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '');

        // Formata: 84 123 4567
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 5) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
        return `${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5, 9)}`;
    };

    const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatarTelefone(e.target.value);
        setTelefone(formatted);
    };

    const iniciarPagamento = async () => {
        const telefoneLimpo = telefone.replace(/\s/g, '');

        if (telefoneLimpo.length < 9) {
            toast.error('Número de telefone inválido');
            return;
        }

        setLoading(true);
        setStatus('processing');

        try {
            const res = await api.post('/pagamentos/mpesa/iniciar/', {
                pedido_id: pedidoId,
                telefone: telefoneLimpo
            });

            setPagamentoId(res.data.pagamento_id);
            toast.success(res.data.mensagem);

            // Iniciar polling para verificar status
            iniciarVerificacaoStatus(res.data.pagamento_id);

        } catch (error: any) {
            console.error(error);
            setStatus('failed');
            toast.error(error.response?.data?.erro || 'Erro ao iniciar pagamento');
            setLoading(false);
        }
    };

    const iniciarVerificacaoStatus = (id: number) => {
        let tentativas = 0;
        const maxTentativas = 30; // 30 tentativas = 1 minuto

        const interval = setInterval(async () => {
            tentativas++;

            try {
                const res = await api.get(`/pagamentos/mpesa/status/${id}/`);

                if (res.data.status === 'CONFIRMADO') {
                    clearInterval(interval);
                    setStatus('success');
                    setLoading(false);
                    toast.success('Pagamento confirmado!');
                    setTimeout(() => onSuccess(), 2000);
                }
                else if (res.data.status === 'FALHOU') {
                    clearInterval(interval);
                    setStatus('failed');
                    setLoading(false);
                    toast.error('Pagamento falhou');
                }
                else if (tentativas >= maxTentativas) {
                    clearInterval(interval);
                    setStatus('failed');
                    setLoading(false);
                    toast.error('Tempo esgotado. Verifique seu celular.');
                }
            } catch (error) {
                console.error('Erro ao verificar status:', error);
            }
        }, 2000); // Verifica a cada 2 segundos
    };

    return (
        <div className="bg-white rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone size={40} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento M-Pesa</h2>
                <p className="text-3xl font-black text-green-600">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor)}
                </p>
            </div>

            {status === 'idle' && (
                <>
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Número de Telefone M-Pesa
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                +258
                            </span>
                            <input
                                type="tel"
                                value={telefone}
                                onChange={handleTelefoneChange}
                                className="w-full pl-16 pr-4 py-4 border-2 border-gray-300 rounded-xl text-lg font-medium focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                placeholder="84 123 4567"
                                maxLength={12}
                                disabled={loading}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Digite o número registado no M-Pesa
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-900 font-medium mb-2">📱 Como funciona:</p>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Clique em "Pagar com M-Pesa"</li>
                            <li>Receberá um PUSH no seu celular</li>
                            <li>Digite seu PIN do M-Pesa</li>
                            <li>Aguarde a confirmação</li>
                        </ol>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={iniciarPagamento}
                            disabled={loading || telefone.replace(/\s/g, '').length < 9}
                            className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                'Pagar com M-Pesa'
                            )}
                        </button>
                    </div>
                </>
            )}

            {status === 'processing' && (
                <div className="text-center py-8">
                    <Loader2 size={64} className="animate-spin text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Aguardando confirmação...</h3>
                    <p className="text-gray-600 mb-4">
                        Verifique seu celular e digite o PIN do M-Pesa
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            ⏱️ Não feche esta janela até confirmar o pagamento
                        </p>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className="text-center py-8">
                    <CheckCircle2 size={64} className="text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h3>
                    <p className="text-gray-600">Redirecionando...</p>
                </div>
            )}

            {status === 'failed' && (
                <div className="text-center py-8">
                    <XCircle size={64} className="text-red-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pagamento Falhou</h3>
                    <p className="text-gray-600 mb-6">Tente novamente ou escolha outro método</p>
                    <button
                        onClick={() => {
                            setStatus('idle');
                            setTelefone('');
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                    >
                        Tentar Novamente
                    </button>
                </div>
            )}
        </div>
    );
}
