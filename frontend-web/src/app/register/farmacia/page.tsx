'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Mail, Lock, User, Phone, MapPin, ArrowLeft, Building2, FileText, Clock } from 'lucide-react';
import api from '@/lib/api';
import { toast, Toaster } from 'sonner';

export default function RegisterFarmaciaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        nome_farmacia: '',
        nuit: '',
        alvara: '',
        endereco: '',
        bairro: '',
        cidade: 'Maputo',
        latitude: '',
        longitude: '',
        horario_abertura: '08:00',
        horario_fechamento: '20:00',
        nome_responsavel: '',
        cargo: 'Proprietário',
        email: '',
        telefone_responsavel: '',
        password: '',
        password_confirm: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.password_confirm) {
            toast.error('As senhas não coincidem!');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres!');
            return;
        }

        setLoading(true);

        try {
            const registerPayload = {
                email: formData.email,
                password: formData.password,
                first_name: formData.nome_responsavel.split(' ')[0] || formData.nome_responsavel,
                last_name: formData.nome_responsavel.split(' ').slice(1).join(' ') || '',
                tipo_usuario: 'FARMACIA',
                telefone: formData.telefone_responsavel,
                farmacia_data: {
                    nome: formData.nome_farmacia,
                    nuit: formData.nuit,
                    endereco: formData.endereco,
                    bairro: formData.bairro,
                    cidade: formData.cidade,
                    latitude: formData.latitude || null,
                    longitude: formData.longitude || null,
                }
            };

            await api.post('/auth/register/farmacia/', registerPayload);
            toast.success('Farmácia cadastrada! Aguardando aprovação.');
            setTimeout(() => router.push('/login'), 2000);

        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.email?.[0] || error.response?.data?.detail || 'Erro ao cadastrar.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 py-12 px-6">
            <Toaster position="top-center" richColors />

            <div className="w-full max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8">
                        <ArrowLeft size={20} />
                        <span>Voltar</span>
                    </Link>

                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                            <Store size={48} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-5xl font-black text-white mb-3">Parceria Empresarial</h1>
                    <p className="text-xl text-blue-200 mb-2">Cadastre sua farmácia na maior rede de Moçambique</p>
                    <p className="text-sm text-blue-300/70">Alcance milhares de clientes e gerencie digitalmente</p>
                </div>

                <div className="flex justify-center gap-4 mb-12">
                    <div className={`flex items-center gap-2 px-6 py-3 rounded-full ${step >= 1 ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                        <Building2 size={20} />
                        <span className="font-bold">Dados da Empresa</span>
                    </div>
                    <div className={`flex items-center gap-2 px-6 py-3 rounded-full ${step >= 2 ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                        <User size={20} />
                        <span className="font-bold">Responsável Legal</span>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    <form onSubmit={handleSubmit}>

                        {step === 1 && (
                            <div className="p-10">
                                <div className="flex items-center gap-3 mb-8 pb-6 border-b-2 border-green-100">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <Building2 size={24} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Informações da Farmácia</h2>
                                        <p className="text-sm text-gray-500">Dados legais e comerciais</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Nome Comercial *</label>
                                        <input type="text" name="nome_farmacia" value={formData.nome_farmacia} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none text-lg" placeholder="Farmácia Central de Maputo" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><FileText size={16} />NUIT *</label>
                                        <input type="text" name="nuit" value={formData.nuit} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none font-mono text-lg" placeholder="400123456" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><FileText size={16} />Alvará Sanitário</label>
                                        <input type="text" name="alvara" value={formData.alvara} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none font-mono text-lg" placeholder="AS/2024/001" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Cidade *</label>
                                        <select name="cidade" value={formData.cidade} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none text-lg" required>
                                            <option value="Maputo">Maputo</option>
                                            <option value="Matola">Matola</option>
                                            <option value="Beira">Beira</option>
                                            <option value="Nampula">Nampula</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Bairro *</label>
                                        <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none text-lg" placeholder="Polana Cimento" required />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><MapPin size={16} />Endereço Completo *</label>
                                        <textarea name="endereco" value={formData.endereco} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none text-lg" placeholder="Av. Eduardo Mondlane, Nº 1234" rows={3} required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><Clock size={16} />Abertura</label>
                                        <input type="time" name="horario_abertura" value={formData.horario_abertura} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none text-lg" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><Clock size={16} />Fechamento</label>
                                        <input type="time" name="horario_fechamento" value={formData.horario_fechamento} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none text-lg" />
                                    </div>
                                </div>

                                <button type="button" onClick={() => setStep(2)} className="w-full mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 shadow-lg">
                                    PRÓXIMO: DADOS DO RESPONSÁVEL →
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="p-10">
                                <div className="flex items-center gap-3 mb-8 pb-6 border-b-2 border-blue-100">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <User size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Responsável Legal</h2>
                                        <p className="text-sm text-gray-500">Proprietário ou gestor autorizado</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Nome Completo *</label>
                                        <input type="text" name="nome_responsavel" value={formData.nome_responsavel} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-lg" placeholder="João António Silva" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Cargo *</label>
                                        <select name="cargo" value={formData.cargo} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-lg" required>
                                            <option value="Proprietário">Proprietário</option>
                                            <option value="Diretor Geral">Diretor Geral</option>
                                            <option value="Gerente">Gerente</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><Phone size={16} />Telefone *</label>
                                        <input type="tel" name="telefone_responsavel" value={formData.telefone_responsavel} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-lg" placeholder="+258 84 123 4567" required />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><Mail size={16} />Email Corporativo *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-lg" placeholder="contato@farmacia.co.mz" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><Lock size={16} />Senha *</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-lg" placeholder="••••••••" minLength={6} required />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><Lock size={16} />Confirmar *</label>
                                        <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-lg" placeholder="••••••••" minLength={6} required />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 py-5 rounded-xl font-bold text-lg hover:bg-gray-200">← VOLTAR</button>
                                    <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg">
                                        {loading ? 'PROCESSANDO...' : 'FINALIZAR CADASTRO ✓'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: '📊', title: 'Gestão Completa', desc: 'Controle estoque e vendas' },
                        { icon: '🚀', title: 'Mais Vendas', desc: 'Milhares de clientes online' },
                        { icon: '💰', title: 'Sem Mensalidade', desc: 'Pague por transação' }
                    ].map((b, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
                            <div className="text-4xl mb-3">{b.icon}</div>
                            <h3 className="font-bold text-white text-lg mb-2">{b.title}</h3>
                            <p className="text-blue-200 text-sm">{b.desc}</p>
                        </div>
                    ))}
                </div>

                <p className="text-center text-sm text-white/50 mt-8">
                    Já tem cadastro? <Link href="/login" className="text-white font-bold hover:underline">Fazer Login</Link>
                </p>
            </div>
        </div>
    );
}
