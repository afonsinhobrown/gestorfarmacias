'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Building2, User, Mail, Lock, Phone, MapPin, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterFarmaciaPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Dados do Usuário (Dono da Farmácia)
    const [userData, setUserData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirm: '',
        telefone: ''
    });

    // Dados da Farmácia
    const [farmaciaData, setFarmaciaData] = useState({
        nome: '',
        nome_fantasia: '',
        nuit: '',
        alvara: '',
        telefone_principal: '',
        telefone_alternativo: '',
        email: '',
        endereco: '',
        bairro: '',
        cidade: 'Maputo',
        provincia: 'Maputo',
        latitude: '-25.9655',
        longitude: '32.5832'
    });

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleFarmaciaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFarmaciaData({ ...farmaciaData, [e.target.name]: e.target.value });
    };

    const validateStep1 = () => {
        if (!userData.first_name || !userData.last_name || !userData.email || !userData.password) {
            toast.error('Preencha todos os campos obrigatórios');
            return false;
        }
        if (userData.password !== userData.password_confirm) {
            toast.error('As senhas não coincidem');
            return false;
        }
        if (userData.password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!farmaciaData.nome || !farmaciaData.nuit || !farmaciaData.telefone_principal || !farmaciaData.endereco) {
            toast.error('Preencha todos os campos obrigatórios da farmácia');
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateStep2()) return;

        setLoading(true);
        try {
            const payload = {
                // Dados do usuário
                user: {
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    email: userData.email,
                    password: userData.password,
                    telefone: userData.telefone,
                    tipo_usuario: 'FARMACIA'
                },
                // Dados da farmácia
                farmacia: {
                    ...farmaciaData,
                    email: farmaciaData.email || userData.email
                }
            };

            await api.post('/auth/register-farmacia/', payload);

            toast.success('Farmácia cadastrada com sucesso! Faça login para continuar.');
            router.push('/login');
        } catch (error: any) {
            console.error('Erro ao cadastrar:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.detail || 'Erro ao cadastrar farmácia';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
                        <Building2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Cadastrar Nova Farmácia</h1>
                    <p className="text-gray-600">Complete o cadastro para começar a usar o sistema</p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                {step > 1 ? <CheckCircle2 size={20} /> : '1'}
                            </div>
                            <span className="font-bold text-sm">Usuário</span>
                        </div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                2
                            </div>
                            <span className="font-bold text-sm">Farmácia</span>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Dados do Usuário */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <User size={24} className="text-blue-600" />
                                    Dados do Responsável
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome *</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={userData.first_name}
                                            onChange={handleUserChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Sobrenome *</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={userData.last_name}
                                            onChange={handleUserChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                                        <div className="relative">
                                            <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={userData.email}
                                                onChange={handleUserChange}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Telefone</label>
                                        <div className="relative">
                                            <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                name="telefone"
                                                value={userData.telefone}
                                                onChange={handleUserChange}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="+258 84 123 4567"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Senha *</label>
                                        <div className="relative">
                                            <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="password"
                                                name="password"
                                                value={userData.password}
                                                onChange={handleUserChange}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirmar Senha *</label>
                                        <div className="relative">
                                            <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="password"
                                                name="password_confirm"
                                                value={userData.password_confirm}
                                                onChange={handleUserChange}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <Link
                                        href="/login"
                                        className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft size={20} />
                                        Voltar ao Login
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="flex-1 py-3 px-6 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        Próximo Passo →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Dados da Farmácia */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Building2 size={24} className="text-blue-600" />
                                    Dados da Farmácia
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Farmácia *</label>
                                        <input
                                            type="text"
                                            name="nome"
                                            value={farmaciaData.nome}
                                            onChange={handleFarmaciaChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: Farmácia Central"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome Fantasia</label>
                                        <input
                                            type="text"
                                            name="nome_fantasia"
                                            value={farmaciaData.nome_fantasia}
                                            onChange={handleFarmaciaChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">NUIT *</label>
                                        <div className="relative">
                                            <FileText size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                name="nuit"
                                                value={farmaciaData.nuit}
                                                onChange={handleFarmaciaChange}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Alvará</label>
                                        <input
                                            type="text"
                                            name="alvara"
                                            value={farmaciaData.alvara}
                                            onChange={handleFarmaciaChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Telefone Principal *</label>
                                        <div className="relative">
                                            <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                name="telefone_principal"
                                                value={farmaciaData.telefone_principal}
                                                onChange={handleFarmaciaChange}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Endereço *</label>
                                        <div className="relative">
                                            <MapPin size={20} className="absolute left-3 top-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="endereco"
                                                value={farmaciaData.endereco}
                                                onChange={handleFarmaciaChange}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Av. Julius Nyerere, 123"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Bairro</label>
                                        <input
                                            type="text"
                                            name="bairro"
                                            value={farmaciaData.bairro}
                                            onChange={handleFarmaciaChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Cidade</label>
                                        <select
                                            name="cidade"
                                            value={farmaciaData.cidade}
                                            onChange={handleFarmaciaChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Maputo">Maputo</option>
                                            <option value="Matola">Matola</option>
                                            <option value="Beira">Beira</option>
                                            <option value="Nampula">Nampula</option>
                                            <option value="Tete">Tete</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft size={20} />
                                        Voltar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-3 px-6 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Cadastrando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={20} />
                                                Finalizar Cadastro
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-blue-600 font-bold hover:underline">
                            Fazer Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
