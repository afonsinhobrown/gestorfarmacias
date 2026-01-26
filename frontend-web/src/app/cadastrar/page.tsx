'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import CameraCapture from '@/components/CameraCapture';
import { User, Building2, Bike, Mail, Lock, Phone, MapPin, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type TipoCadastro = 'CLIENTE' | 'FARMACIA' | 'ENTREGADOR';

export default function CadastrarPage() {
    const router = useRouter();
    const [tipoSelecionado, setTipoSelecionado] = useState<TipoCadastro | null>(null);
    const [loading, setLoading] = useState(false);

    // Campos comuns
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');

    // Campos específicos Farmácia
    const [nuit, setNuit] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cidade, setCidade] = useState('');
    const [bairro, setBairro] = useState('');

    // Fotos Cliente
    const [fotoPerfilCliente, setFotoPerfilCliente] = useState<File | null>(null);
    const [fotoDocumentoCliente, setFotoDocumentoCliente] = useState<File | null>(null);

    // Campos específicos Motoboy
    const [placaMoto, setPlacaMoto] = useState('');
    const [tipoVeiculo, setTipoVeiculo] = useState('MOTO');
    const [dataNascimento, setDataNascimento] = useState('');
    const [modeloVeiculo, setModeloVeiculo] = useState('');
    const [corVeiculo, setCorVeiculo] = useState('');
    const [estadoVeiculo, setEstadoVeiculo] = useState('');

    // Fotos (apenas para entregador)
    const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
    const [fotoDocumento, setFotoDocumento] = useState<File | null>(null);
    const [fotoVeiculo, setFotoVeiculo] = useState<File | null>(null);
    const [documentoVeiculo, setDocumentoVeiculo] = useState<File | null>(null);

    const tipos = [
        {
            tipo: 'CLIENTE' as TipoCadastro,
            nome: 'Cliente',
            descricao: 'Comprar medicamentos online',
            icon: User,
            cor: 'blue'
        },
        {
            tipo: 'FARMACIA' as TipoCadastro,
            nome: 'Farmácia',
            descricao: 'Vender e gerenciar estoque',
            icon: Building2,
            cor: 'green'
        },
        {
            tipo: 'ENTREGADOR' as TipoCadastro,
            nome: 'Entregador',
            descricao: 'Fazer entregas e ganhar dinheiro',
            icon: Bike,
            cor: 'purple'
        }
    ];

    const handleCadastro = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let endpoint = '';

            switch (tipoSelecionado) {
                case 'CLIENTE':
                    endpoint = '/auth/register/cliente/';

                    if (fotoPerfilCliente || fotoDocumentoCliente) {
                        // Se tem fotos, enviar como FormData
                        const clienteFormData = new FormData();
                        clienteFormData.append('nome', nome);
                        clienteFormData.append('email', email);
                        clienteFormData.append('telefone', telefone);
                        clienteFormData.append('password', password);
                        if (fotoPerfilCliente) clienteFormData.append('foto_perfil', fotoPerfilCliente);
                        if (fotoDocumentoCliente) clienteFormData.append('foto_documento', fotoDocumentoCliente);

                        await api.post(endpoint, clienteFormData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    } else {
                        // Sem fotos, enviar JSON normal
                        const clientePayload = { email, password, nome, telefone };
                        await api.post(endpoint, clientePayload);
                    }
                    break;

                case 'FARMACIA':
                    endpoint = '/auth/register/farmacia/';
                    const farmaciaPayload = {
                        email, password, nome, telefone,
                        nuit, endereco, cidade, bairro
                    };
                    await api.post(endpoint, farmaciaPayload);
                    break;

                case 'ENTREGADOR':
                    // Validar fotos obrigatórias
                    if (!fotoPerfil || !fotoDocumento) {
                        toast.error('Foto de perfil e documento são obrigatórias');
                        setLoading(false);
                        return;
                    }

                    endpoint = '/auth/register/motoboy/';
                    const formData = new FormData();

                    // Dados básicos
                    formData.append('nome', nome);
                    formData.append('email', email);
                    formData.append('telefone', telefone);
                    formData.append('password', password);
                    formData.append('data_nascimento', dataNascimento || '2000-01-01');

                    // Fotos obrigatórias
                    formData.append('foto_perfil', fotoPerfil);
                    formData.append('foto_documento', fotoDocumento);

                    // Veículo
                    formData.append('tipo_veiculo', tipoVeiculo);
                    formData.append('placa_veiculo', placaMoto);
                    formData.append('modelo_veiculo', modeloVeiculo);
                    formData.append('cor_veiculo', corVeiculo);
                    formData.append('estado_veiculo', estadoVeiculo);
                    if (fotoVeiculo) formData.append('foto_veiculo', fotoVeiculo);
                    if (documentoVeiculo) formData.append('documento_veiculo', documentoVeiculo);

                    await api.post(endpoint, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    break;
            }

            toast.success('Cadastro realizado com sucesso! Faça login para continuar.');
            router.push('/login');

        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.detail
                || error.response?.data?.email?.[0]
                || error.response?.data?.error
                || 'Erro ao cadastrar';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const cores: any = {
        blue: 'from-blue-600 to-blue-700',
        green: 'from-green-600 to-green-700',
        purple: 'from-purple-600 to-purple-700'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-gray-900 mb-2">Criar Conta</h1>
                    <p className="text-gray-600 text-lg">Escolha como deseja se cadastrar:</p>
                </div>

                {!tipoSelecionado ? (
                    /* Seleção de Tipo */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tipos.map((tipo) => (
                            <button
                                key={tipo.tipo}
                                onClick={() => setTipoSelecionado(tipo.tipo)}
                                className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-gray-300 hover:shadow-2xl transition-all group"
                            >
                                <div className={`w-20 h-20 bg-gradient-to-br ${cores[tipo.cor]} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                    <tipo.icon size={40} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tipo.nome}</h3>
                                <p className="text-gray-600">{tipo.descricao}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    /* Formulário de Cadastro */
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto">
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
                                        <div className={`w-20 h-20 bg-gradient-to-br ${cores[tipoConfig?.cor]} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                            {IconComponent && <IconComponent size={40} className="text-white" />}
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Cadastro de {tipoConfig?.nome}
                                        </h2>
                                    </>
                                );
                            })()}
                        </div>

                        <form onSubmit={handleCadastro} className="space-y-4">
                            {/* Campos Comuns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <User size={16} className="inline mr-1" />
                                        Nome Completo *
                                    </label>
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone size={16} className="inline mr-1" />
                                        Telefone *
                                    </label>
                                    <input
                                        type="tel"
                                        value={telefone}
                                        onChange={(e) => setTelefone(e.target.value)}
                                        placeholder="84 123 4567"
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail size={16} className="inline mr-1" />
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Lock size={16} className="inline mr-1" />
                                    Senha *
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {/* Fotos para Cliente */}
                            {tipoSelecionado === 'CLIENTE' && (
                                <>
                                    <CameraCapture
                                        label="📸 Foto de Perfil (Opcional)"
                                        onCapture={setFotoPerfilCliente}
                                    />

                                    <CameraCapture
                                        label="🆔 Foto do Documento (Opcional)"
                                        onCapture={setFotoDocumentoCliente}
                                    />
                                </>
                            )}

                            {/* Campos Específicos Farmácia */}
                            {tipoSelecionado === 'FARMACIA' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FileText size={16} className="inline mr-1" />
                                            NUIT *
                                        </label>
                                        <input
                                            type="text"
                                            value={nuit}
                                            onChange={(e) => setNuit(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <MapPin size={16} className="inline mr-1" />
                                            Endereço Completo *
                                        </label>
                                        <input
                                            type="text"
                                            value={endereco}
                                            onChange={(e) => setEndereco(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                                            <input
                                                type="text"
                                                value={cidade}
                                                onChange={(e) => setCidade(e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
                                            <input
                                                type="text"
                                                value={bairro}
                                                onChange={(e) => setBairro(e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Campos Específicos Entregador */}
                            {tipoSelecionado === 'ENTREGADOR' && (
                                <>
                                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-purple-800">
                                            ⚠️ <strong>Importante:</strong> Após o cadastro, aguarde a aprovação do administrador.
                                            Você pode verificar o status em <a href="/verificar-status" className="underline font-bold">Verificar Status</a>.
                                        </p>
                                    </div>

                                    {/* Data de Nascimento */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Calendar size={16} className="inline mr-1" />
                                            Data de Nascimento *
                                        </label>
                                        <input
                                            type="date"
                                            value={dataNascimento}
                                            onChange={(e) => setDataNascimento(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Foto de Perfil */}
                                    <CameraCapture
                                        label="📸 Foto de Perfil *"
                                        onCapture={setFotoPerfil}
                                    />

                                    {/* Foto do Documento */}
                                    <CameraCapture
                                        label="🆔 Foto do Documento de Identidade *"
                                        onCapture={setFotoDocumento}
                                    />

                                    {/* Tipo de Veículo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Bike size={16} className="inline mr-1" />
                                            Tipo de Veículo *
                                        </label>
                                        <select
                                            value={tipoVeiculo}
                                            onChange={(e) => setTipoVeiculo(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        >
                                            <option value="MOTO">Moto</option>
                                            <option value="BICICLETA">Bicicleta</option>
                                            <option value="CARRO">Carro</option>
                                            <option value="A_PE">A pé</option>
                                        </select>
                                    </div>

                                    {/* Dados do Veículo (se não for A_PE) */}
                                    {tipoVeiculo !== 'A_PE' && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                                                    <input
                                                        type="text"
                                                        value={placaMoto}
                                                        onChange={(e) => setPlacaMoto(e.target.value.toUpperCase())}
                                                        placeholder="ABC-1234"
                                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                        maxLength={8}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                                                    <input
                                                        type="text"
                                                        value={modeloVeiculo}
                                                        onChange={(e) => setModeloVeiculo(e.target.value)}
                                                        placeholder="Ex: Honda CG 160"
                                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                                                    <input
                                                        type="text"
                                                        value={corVeiculo}
                                                        onChange={(e) => setCorVeiculo(e.target.value)}
                                                        placeholder="Ex: Preto"
                                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                                                    <select
                                                        value={estadoVeiculo}
                                                        onChange={(e) => setEstadoVeiculo(e.target.value)}
                                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        <option value="Novo">Novo</option>
                                                        <option value="Bom">Bom</option>
                                                        <option value="Regular">Regular</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Foto do Veículo */}
                                            <CameraCapture
                                                label="🏍️ Foto do Veículo *"
                                                onCapture={setFotoVeiculo}
                                            />

                                            {/* Documento do Veículo */}
                                            <CameraCapture
                                                label="📄 Documento do Veículo (TVDE, Seguro)"
                                                onCapture={setDocumentoVeiculo}
                                            />
                                        </>
                                    )}
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 bg-gradient-to-r ${cores[tipos.find(t => t.tipo === tipoSelecionado)?.cor]} text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 mt-6`}
                            >
                                {loading ? 'Cadastrando...' : 'CRIAR CONTA'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Já tem conta?{' '}
                                <Link href="/login" className="text-blue-600 font-bold hover:underline">
                                    Fazer Login
                                </Link>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
