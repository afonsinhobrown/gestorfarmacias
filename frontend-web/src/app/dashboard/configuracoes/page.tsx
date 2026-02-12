'use client';

import { useState, useEffect } from 'react';
import { Save, Building2, MapPin, Phone, CreditCard, Mail, Globe, Clock, ShieldCheck, Database } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [farmacia, setFarmacia] = useState<any>({
        nome: '',
        nome_fantasia: '',
        nuit: '',
        alvara: '',
        percentual_iva: 16.00,
        telefone_principal: '',
        email: '',
        website: '',
        endereco: '',
        bairro: '',
        cidade: '',
        provincia: '',
        horario_abertura: '',
        horario_fechamento: '',
        funciona_24h: false,
        taxa_entrega: 0,
        banco_nome: '',
        banco_conta: '',
        banco_nib: '',
        mpesa_numero: '',
        emola_numero: '',
        percentual_comissao_padrao: 0,
        meta_bonus_mensal: 0,
        percentual_bonus_extra: 0,
        logo: null
    });

    useEffect(() => {
        const fetchFarmacia = async () => {
            try {
                const res = await api.get('/farmacias/me/');
                setFarmacia(res.data);
            } catch (error) {
                console.error("Erro ao carregar configurações:", error);
                toast.error("Falha ao carregar dados da farmácia.");
            } finally {
                setLoading(false);
            }
        };
        fetchFarmacia();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFarmacia({ ...farmacia, [name]: val });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Se houver arquivo de logo, usamos FormData
            let data: any = farmacia;

            // Para garantir que enviamos dados limpos ao backend
            const formData = new FormData();
            Object.keys(farmacia).forEach(key => {
                if (key === 'logo' && farmacia[key] instanceof File) {
                    formData.append('logo', farmacia[key]);
                } else if (key !== 'logo' && farmacia[key] !== null) {
                    formData.append(key, farmacia[key]);
                }
            });

            await api.patch('/farmacias/me/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Configurações salvas com sucesso!");

            // Recarregar dados para atualizar URLs de imagem
            const res = await api.get('/farmacias/me/');
            setFarmacia(res.data);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast.error("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Carregando configurações...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configurações Gerais</h1>
                    <p className="text-gray-500">Gerencie a identidade visual, dados fiscais e bancários da sua farmácia.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Coluna Esquerda: Dados Básicos */}
                <div className="md:col-span-2 space-y-6">
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <Building2 className="text-blue-500" size={24} />
                            <h2 className="text-lg font-bold text-gray-800">Identidade da Farmácia</h2>
                        </div>

                        {/* Upload de Logotipo */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Logotipo da Farmácia (Para Relatórios)</label>
                            <div className="flex items-center gap-4">
                                {farmacia.logo && (
                                    <div className="w-20 h-20 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={typeof farmacia.logo === 'string' ? farmacia.logo : URL.createObjectURL(farmacia.logo)}
                                            alt="Logotipo"
                                            className="max-w-full max-h-full object-contain text-[8px]"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setFarmacia({ ...farmacia, logo: file });
                                            }
                                        }}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">PNG ou JPG (Aparecerá nos recibos e faturas)</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome Oficial (Razão Social)</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={farmacia.nome || ''}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border-transparent border-2 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome Fantasia</label>
                                <input
                                    type="text"
                                    name="nome_fantasia"
                                    value={farmacia.nome_fantasia || ''}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border-transparent border-2 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">NUIT (Número Fiscal)</label>
                                <input
                                    type="text"
                                    name="nuit"
                                    value={farmacia.nuit || ''}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border-transparent border-2 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Taxa de IVA (%)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        name="percentual_iva"
                                        value={farmacia.percentual_iva ?? 16}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="w-full p-3 bg-gray-50 border-transparent border-2 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all"
                                    />
                                    <span className="font-bold text-gray-500">%</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <MapPin className="text-red-500" size={24} />
                            <h2 className="text-lg font-bold text-gray-800">Localização e Contato</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Endereço Completo</label>
                                <textarea
                                    name="endereco"
                                    value={farmacia.endereco || ''}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full p-3 bg-gray-50 border-transparent border-2 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Bairro</label>
                                <input name="bairro" value={farmacia.bairro || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cidade</label>
                                <input name="cidade" value={farmacia.cidade || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Telefone Principal</label>
                                <input name="telefone_principal" value={farmacia.telefone_principal || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email de Suporte</label>
                                <input name="email" value={farmacia.email || ''} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl" />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="text-amber-500" size={24} />
                            <h2 className="text-lg font-bold text-gray-800">Comissões e Bónus</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Comissão Padrão (%)</label>
                                <input
                                    type="number"
                                    name="percentual_comissao_padrao"
                                    value={farmacia.percentual_comissao_padrao || 0}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 rounded-xl"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Aplicada se o produto não tiver valor específico.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Meta de Vendas Mensal (MTn)</label>
                                <input
                                    type="number"
                                    name="meta_bonus_mensal"
                                    value={farmacia.meta_bonus_mensal || 0}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 rounded-xl"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Volume para desbloquear bónus extra.</p>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Bónus Extra por Meta Atingida (%)</label>
                                <input
                                    type="number"
                                    name="percentual_bonus_extra"
                                    value={farmacia.percentual_bonus_extra || 0}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 rounded-xl"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Coluna Direita: Dados Bancários e Extras */}
                <div className="space-y-6">
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <CreditCard className="text-green-500" size={24} />
                            <h2 className="text-lg font-bold text-gray-800">Dados de Recebimento</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Banco</label>
                                <input name="banco_nome" value={farmacia.banco_nome || ''} onChange={handleChange} placeholder="BCI, BIM, etc" className="w-full p-2.5 bg-gray-50 rounded-lg text-sm border-2 border-transparent focus:border-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Número de Conta</label>
                                <input name="banco_conta" value={farmacia.banco_conta || ''} onChange={handleChange} className="w-full p-2.5 bg-gray-50 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">NIB</label>
                                <input name="banco_nib" value={farmacia.banco_nib || ''} onChange={handleChange} className="w-full p-2.5 bg-gray-50 rounded-lg text-sm" />
                            </div>
                            <div className="pt-2 border-t">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Conta M-Pesa</label>
                                <input name="mpesa_numero" value={farmacia.mpesa_numero || ''} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-lg text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Conta e-Mola</label>
                                <input name="emola_numero" value={farmacia.emola_numero || ''} onChange={handleChange} className="w-full p-2.5 bg-gray-50 border-2 border-transparent focus:border-yellow-500 rounded-lg text-sm outline-none" />
                            </div>
                        </div>
                    </section>

                    <section className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="text-blue-400" size={24} />
                            <h2 className="text-lg font-bold">Operação</h2>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors">
                                <input
                                    type="checkbox"
                                    name="funciona_24h"
                                    checked={!!farmacia.funciona_24h}
                                    onChange={handleChange}
                                    className="w-5 h-5 accent-blue-500"
                                />
                                <span className="text-sm font-bold">Atendimento 24 Horas</span>
                            </label>

                            {!farmacia.funciona_24h && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-black">Abertura</label>
                                        <input type="time" name="horario_abertura" value={farmacia.horario_abertura || ''} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg text-sm border-none outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-black">Fechamento</label>
                                        <input type="time" name="horario_fechamento" value={farmacia.horario_fechamento || ''} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg text-sm border-none outline-none" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-black">Taxa de Entrega Padrão (MTn)</label>
                                <input type="number" name="taxa_entrega" value={farmacia.taxa_entrega || 0} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg text-sm border-none outline-none mt-1 font-bold" />
                            </div>
                        </div>
                    </section>
                </div>
            </form>
        </div>
    );
}
