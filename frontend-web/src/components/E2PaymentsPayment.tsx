'use client';

import { useState } from 'react';
import { CreditCard, Smartphone, Wallet, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface E2PaymentsProps {
    pedidoId: number;
    valor: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function E2PaymentsPayment({ pedidoId, valor, onSuccess, onCancel }: E2PaymentsProps) {
    const [metodo, setMetodo] = useState<'mpesa' | 'emola' | 'card'>('mpesa');
    const [telefone, setTelefone] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

    const formatarTelefone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 5) return `${numbers.slice(0, 2)} ${numbers.slice(2)}`;
        return `${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5, 9)}`;
    };

    const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTelefone(formatarTelefone(e.target.value));
    };

    const iniciarPagamento = async () => {
        const telefoneLimpo = telefone.replace(/\s/g, '');

        if (telefoneLimpo.length < 9) {
            toast.error('Número inválido');
            return;
        }

        setLoading(true);
        setStatus('processing');

        try {
            const res = await api.post('/pagamentos/e2payments/iniciar/', {
                pedido_id: pedidoId,
                telefone: telefoneLimpo,
                metodo: metodo
            });

            toast.success(res.data.mensagem);

            // Polling
            const pagamentoId = res.data.pagamento_id;
            let tentativas = 0;
            const maxTentativas = 30;

            const interval = setInterval(async () => {
                tentativas++;

                try {
                    const statusRes = await api.get(`/pagamentos/e2payments/status/${pagamentoId}/`);

                    if (statusRes.data.status === 'CONFIRMADO') {
                        clearInterval(interval);
                        setStatus('success');
                        setLoading(false);
                        toast.success('Pagamento confirmado!');
                        setTimeout(() => onSuccess(), 2000);
                    }
                    else if (statusRes.data.status === 'FALHOU' || tentativas >= maxTentativas) {
                        clearInterval(interval);
                        setStatus('failed');
                        setLoading(false);
                        toast.error('Pagamento falhou');
                    }
                } catch (error) {
                    console.error(error);
                }
            }, 2000);

        } catch (error: any) {
            console.error(error);
            setStatus('failed');
            toast.error(error.response?.data?.erro || 'Erro ao iniciar pagamento');
            setLoading(false);
        }
    };

    const metodos = [
        { id: 'mpesa', nome: 'M-Pesa', icon: Smartphone, cor: 'green' },
        { id: 'emola', nome: 'e-Mola', icon: Wallet, cor: 'blue' },
        { id: 'card', nome: 'Cartão', icon: CreditCard, cor: 'purple' }
    ];

    return (
        <div className="bg-white rounded-2xl p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha o Método</h2>
                <p className="text-3xl font-black text-green-600">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor)}
                </p>
            </div>

            {status === 'idle' && (
                <>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {metodos.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMetodo(m.id as any)}
                                className={`p-4 rounded-xl border-2 transition-all ${metodo === m.id
                                        ? `border-${m.cor}-600 bg-${m.cor}-50`
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <m.icon size={32} className={`mx-auto mb-2 ${metodo === m.id ? `text-${m.cor}-600` : 'text-gray-400'}`} />
                                <p className="text-xs font-bold">{m.nome}</p>
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Número de Telefone</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">+258</span>
                            <input
                                type="tel"
                                value={telefone}
                                onChange={handleTelefoneChange}
                                className="w-full pl-16 pr-4 py-4 border-2 border-gray-300 rounded-xl text-lg font-medium focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                placeholder="84 123 4567"
                                maxLength={12}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button
                            onClick={iniciarPagamento}
                            disabled={loading || telefone.replace(/\s/g, '').length < 9}
                            className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Pagar'}
                        </button>
                    </div>
                </>
            )}

            {status === 'processing' && (
                <div className="text-center py-8">
                    <Loader2 size={64} className="animate-spin text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Aguardando confirmação...</h3>
                    <p className="text-gray-600">Verifique seu celular</p>
                </div>
            )}

            {status === 'success' && (
                <div className="text-center py-8">
                    <CheckCircle2 size={64} className="text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Pagamento Confirmado!</h3>
                </div>
            )}

            {status === 'failed' && (
                <div className="text-center py-8">
                    <XCircle size={64} className="text-red-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Pagamento Falhou</h3>
                    <button onClick={() => setStatus('idle')} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold">
                        Tentar Novamente
                    </button>
                </div>
            )}
        </div>
    );
}
