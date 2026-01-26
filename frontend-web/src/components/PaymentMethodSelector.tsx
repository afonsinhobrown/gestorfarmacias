'use client';

import { useState } from 'react';
import { CreditCard, Smartphone, Building2, Wallet, X } from 'lucide-react';
import MPesaPayment from './MPesaPayment';
import E2PaymentsPayment from './E2PaymentsPayment';

interface PaymentMethodSelectorProps {
    pedidoId: number;
    valor: number;
    onSuccess: () => void;
    onCancel: () => void;
}

type PaymentMethod = 'e2payments' | 'mpesa_direto' | 'dinheiro' | 'transferencia';

export default function PaymentMethodSelector({ pedidoId, valor, onSuccess, onCancel }: PaymentMethodSelectorProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

    const metodos = [
        {
            id: 'e2payments' as PaymentMethod,
            nome: 'M-Pesa (e2Payments)',
            descricao: 'Pagamento via M-Pesa usando e2Payments',
            icon: Smartphone,
            cor: 'green',
            disponivel: true,
            recomendado: true
        },
        {
            id: 'mpesa_direto' as PaymentMethod,
            nome: 'M-Pesa Direto',
            descricao: 'Integração direta com M-Pesa',
            icon: Smartphone,
            cor: 'blue',
            disponivel: true,
            recomendado: false
        },
        {
            id: 'dinheiro' as PaymentMethod,
            nome: 'Dinheiro',
            descricao: 'Pagamento em dinheiro na entrega',
            icon: Wallet,
            cor: 'yellow',
            disponivel: true,
            recomendado: false
        },
        {
            id: 'transferencia' as PaymentMethod,
            nome: 'Transferência Bancária',
            descricao: 'Transferência para conta da farmácia',
            icon: Building2,
            cor: 'purple',
            disponivel: true,
            recomendado: false
        }
    ];

    const handleMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method);
    };

    const handleBack = () => {
        setSelectedMethod(null);
    };

    // Se método selecionado, mostrar componente específico
    if (selectedMethod === 'e2payments') {
        return <E2PaymentsPayment pedidoId={pedidoId} valor={valor} onSuccess={onSuccess} onCancel={handleBack} />;
    }

    if (selectedMethod === 'mpesa_direto') {
        return <MPesaPayment pedidoId={pedidoId} valor={valor} onSuccess={onSuccess} onCancel={handleBack} />;
    }

    if (selectedMethod === 'dinheiro') {
        return (
            <div className="bg-white rounded-2xl p-8 max-w-md mx-auto">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet size={40} className="text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento em Dinheiro</h2>
                    <p className="text-3xl font-black text-yellow-600 mb-4">
                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor)}
                    </p>
                    <p className="text-gray-600">
                        Você pagará em dinheiro quando receber o pedido.
                    </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-900 font-medium mb-2">⚠️ Importante:</p>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Tenha o valor exato ou próximo</li>
                        <li>O motoboy pode não ter troco</li>
                        <li>Confirme o valor antes de receber</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <button onClick={handleBack} className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50">
                        Voltar
                    </button>
                    <button onClick={onSuccess} className="flex-1 px-6 py-4 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700">
                        Confirmar Pedido
                    </button>
                </div>
            </div>
        );
    }

    if (selectedMethod === 'transferencia') {
        return (
            <div className="bg-white rounded-2xl p-8 max-w-md mx-auto">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 size={40} className="text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Transferência Bancária</h2>
                    <p className="text-3xl font-black text-purple-600 mb-4">
                        {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor)}
                    </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-bold text-purple-900 mb-3">Dados para transferência:</p>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-purple-700">Banco:</span>
                            <span className="font-bold text-purple-900">BIM</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-purple-700">Conta:</span>
                            <span className="font-bold text-purple-900">1234567890</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-purple-700">NIB:</span>
                            <span className="font-bold text-purple-900">000123456789012345678</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-purple-700">Titular:</span>
                            <span className="font-bold text-purple-900">Farmácia GestorFarma</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-900 font-medium mb-2">📱 Após transferir:</p>
                    <p className="text-sm text-blue-800">
                        Envie o comprovativo para WhatsApp: <strong>+258 84 000 0000</strong>
                    </p>
                </div>

                <div className="flex gap-3">
                    <button onClick={handleBack} className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50">
                        Voltar
                    </button>
                    <button onClick={onSuccess} className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">
                        Confirmar Pedido
                    </button>
                </div>
            </div>
        );
    }

    // Seletor de métodos
    return (
        <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Escolha o Método de Pagamento</h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>

            <div className="text-center mb-8">
                <p className="text-sm text-gray-600 mb-2">Valor total:</p>
                <p className="text-4xl font-black text-gray-900">
                    {new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor)}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metodos.map((metodo) => (
                    <button
                        key={metodo.id}
                        onClick={() => handleMethodSelect(metodo.id)}
                        disabled={!metodo.disponivel}
                        className={`relative p-6 rounded-xl border-2 transition-all text-left hover:shadow-lg ${metodo.disponivel
                                ? `border-${metodo.cor}-200 hover:border-${metodo.cor}-400 bg-${metodo.cor}-50/30`
                                : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {metodo.recomendado && (
                            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Recomendado
                            </span>
                        )}

                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 bg-${metodo.cor}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                                <metodo.icon size={24} className={`text-${metodo.cor}-600`} />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-1">{metodo.nome}</h3>
                                <p className="text-sm text-gray-600">{metodo.descricao}</p>

                                {!metodo.disponivel && (
                                    <p className="text-xs text-red-600 mt-2">Em breve</p>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                    <strong>💡 Dica:</strong> Pagamentos via M-Pesa são processados instantaneamente e seu pedido é confirmado automaticamente.
                </p>
            </div>
        </div>
    );
}
