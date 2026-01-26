'use client';

import { useCartStore } from '@/store/useCartStore';
import { ArrowLeft, MapPin, CreditCard, Truck, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { toast, Toaster } from 'sonner';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pedidoId, setPedidoId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    // Form State
    const [endereco, setEndereco] = useState('');
    const [pagamento, setPagamento] = useState('NUMERARIO'); // NUMERARIO | MPESA | POS
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');

    const valorTotal = total();
    const taxaEntrega = 150; // Taxa fixa por enquanto
    const totalFinal = valorTotal + taxaEntrega;

    // Evitar erro de hidratação
    useEffect(() => {
        setMounted(true);
    }, []);

    // Verificar autenticação ao carregar
    useEffect(() => {
        if (!user && items.length > 0) {
            setShowLoginModal(true);
        }

        // Redirecionar se carrinho vazio
        if (items.length === 0 && !success) {
            router.push('/carrinho');
        }
    }, [user, items, success, router]);

    const handleFinalizarPedido = async () => {
        if (!user) {
            toast.error("Você precisa fazer login para finalizar a compra.");
            setShowLoginModal(true);
            return;
        }

        if (!endereco) {
            toast.error("Por favor, informe o endereço de entrega.");
            return;
        }

        setLoading(true);

        // Pegar farmacia_id do primeiro item (todos itens são da mesma farmácia)
        const farmaciaId = items[0]?.farmacia_id;

        if (!farmaciaId) {
            toast.error('Erro: Farmácia não identificada. Por favor, adicione os produtos novamente.');
            setLoading(false);
            return;
        }

        const payload = {
            farmacia: farmaciaId,
            forma_pagamento: 'DINHEIRO', // Será atualizado após escolha do método
            endereco_entrega: endereco,
            bairro: '',
            cidade: 'Maputo',
            referencia: '',
            telefone_contato: telefone || user?.telefone || '',
            observacoes: '',
            itens: items.map(i => ({
                produto: i.id,
                quantidade: i.quantidade,
                preco_unitario: i.preco,
                observacoes: ''
            }))
        };

        try {
            const response = await api.post('/pedidos/novo/', payload);

            console.log('✅ Pedido criado:', response.data);
            console.log('📝 ID do pedido:', response.data.id);

            // Guardar ID do pedido e abrir modal de pagamento
            setPedidoId(response.data.id);
            setShowPaymentModal(true);

            console.log('🎯 Modal deve abrir agora!');
            console.log('showPaymentModal:', true);
            console.log('pedidoId:', response.data.id);

            toast.success("Pedido criado! Escolha o método de pagamento.");

        } catch (error: any) {
            console.error('Erro completo:', error);
            console.error('Resposta do servidor:', error.response?.data);
            console.error('Payload enviado:', payload);
            toast.error(error.response?.data?.detail || error.response?.data?.error || "Erro ao criar pedido. Verifique os dados.");
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setSuccess(true);
        clearCart();
        setShowPaymentModal(false);
        toast.success("Pagamento confirmado!");
    };

    if (success) {
        return (
            <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={48} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Pedido Recebido!</h1>
                <p className="text-gray-600 mb-8 max-w-md">Sua farmácia já recebeu o pedido e começará a preparar em breve. Acompanhe o status no seu perfil.</p>
                <div className="flex gap-4">
                    <Link
                        href="/busca"
                        className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-50"
                    >
                        Voltar à Loja
                    </Link>
                    <Link
                        href="/dashboard/pedidos" // Assumindo área de cliente
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200"
                    >
                        Meus Pedidos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Toaster position="top-center" richColors />

            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800">
                        <ArrowLeft />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Finalizar Pedido</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">

                {/* Coluna da Esquerda: Dados */}
                <div className="space-y-6">

                    {/* Seção Endereço */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-blue-600">
                            <MapPin />
                            <h2 className="font-bold text-lg">Onde vamos entregar?</h2>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Endereço Completo</label>
                            <textarea
                                value={endereco}
                                onChange={e => setEndereco(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={3}
                                placeholder="Ex: Av. Eduardo Mondlane, Prédio 33, 2º Andar..."
                            ></textarea>
                            <p className="text-xs text-gray-500">Inclua pontos de referência para facilitar.</p>
                        </div>
                    </div>

                    {/* Seção Pagamento */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-green-600">
                            <CreditCard />
                            <h2 className="font-bold text-lg">Como deseja pagar?</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setPagamento('MPESA')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${pagamento === 'MPESA' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}
                            >
                                <span className="font-bold text-red-600">M-Pesa</span>
                                <span className="text-xs text-gray-500">Pagar no Celular</span>
                            </button>

                            <button
                                onClick={() => setPagamento('NUMERARIO')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${pagamento === 'NUMERARIO' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}
                            >
                                <span className="font-bold text-green-600">Numerário</span>
                                <span className="text-xs text-gray-500">Pagar na Entrega</span>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Coluna da Direita: Resumo */}
                <div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
                        <h2 className="font-bold text-lg mb-4 text-gray-800">Resumo da Compra</h2>

                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600 line-clamp-1 flex-1 pr-4">{item.quantidade}x {item.produto_nome}</span>
                                    <span className="font-medium">{new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2 }).format(item.preco * item.quantidade)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 text-sm text-gray-600 mb-4 border-t pt-4">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{mounted ? new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valorTotal) : '...'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1"><Truck size={14} /> Taxa de Entrega</span>
                                <span>{mounted ? new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(taxaEntrega) : '...'}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-bold text-xl text-gray-900 mb-6 border-t pt-4">
                            <span>Total</span>
                            <span className="text-green-600">{mounted ? new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(totalFinal) : '...'}</span>
                        </div>

                        <button
                            onClick={handleFinalizarPedido}
                            disabled={loading || showPaymentModal}
                            className="w-full bg-blue-600 text-white text-center py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Processando...' : showPaymentModal ? 'Aguardando pagamento...' : 'CONFIRMAR PEDIDO'}
                        </button>

                        <p className="text-xs text-center text-gray-400 mt-4">
                            Ao confirmar, você concorda com nossos termos de serviço.
                        </p>
                    </div>
                </div>

            </main>

            {/* Modal de Login Obrigatório */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-2 text-gray-800">Login Necessário</h2>
                        <p className="text-gray-600 mb-6">Para finalizar sua compra, você precisa fazer login ou criar uma conta.</p>

                        <LoginForm onSuccess={() => {
                            setShowLoginModal(false);
                            toast.success("Login realizado! Agora você pode finalizar sua compra.");
                        }} />

                        <button
                            onClick={() => {
                                setShowLoginModal(false);
                                router.push('/carrinho');
                            }}
                            className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Voltar ao Carrinho
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Pagamento */}
            {showPaymentModal && pedidoId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <PaymentMethodSelector
                        pedidoId={pedidoId}
                        valor={totalFinal}
                        onSuccess={handlePaymentSuccess}
                        onCancel={() => setShowPaymentModal(false)}
                    />
                </div>
            )}
        </div>
    );
}

// Componente de Login
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const loginRes = await api.post('/auth/login/', { email, password: senha });
            const token = loginRes.data.access || loginRes.data.token;
            const userRes = await api.get('/auth/me/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            login(userRes.data, token);
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error('Email ou senha incorretos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="seu@email.com"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <input
                    type="password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Entrando...' : 'ENTRAR'}
            </button>
            <p className="text-xs text-center text-gray-500">
                Não tem conta? <a href="/cadastrar" className="text-blue-600 hover:underline">Criar agora</a>
            </p>
        </form>
    );
}
