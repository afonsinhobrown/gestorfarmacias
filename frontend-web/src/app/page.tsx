'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Pill, ArrowRight, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar Simplificada */}
      <nav className="bg-white border-b py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-600">GestorFarma</h1>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium">
            Entrar
          </Link>
          <Link href="/cadastrar" className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
            Cadastrar
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Encontre o medicamento que você precisa,<br /> perto de você.
            </h2>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto">
              Compare preços em dezenas de farmácias e receba em casa em minutos.
            </p>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-8 relative">
              <input
                type="text"
                placeholder="Qual medicamento você procura? Ex: Paracetamol"
                className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Buscar
              </button>
            </form>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-8">Categorias Populares</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Medicamentos', icon: Pill, color: 'bg-red-100 text-red-600' },
              { name: 'Higiene e Beleza', icon: Star, color: 'bg-purple-100 text-purple-600' },
              { name: 'Mamãe e Bebê', icon: MapPin, color: 'bg-pink-100 text-pink-600' }, // MapPin é só placeholder
              { name: 'Suplementos', icon: ArrowRight, color: 'bg-green-100 text-green-600' },
            ].map((cat, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${cat.color}`}>
                  <cat.icon size={24} />
                </div>
                <h4 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600">{cat.name}</h4>
                <p className="text-sm text-gray-500 mt-1">Ver produtos</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Section */}
        <section className="bg-gray-50 py-16 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h3 className="text-3xl font-bold text-gray-900">Entrega rápida e segura</h3>
              <p className="text-gray-600 text-lg">
                Nossos entregadores parceiros garantem que seu pedido chegue em perfeitas condições. Acompanhe em tempo real pelo aplicativo.
              </p>
              <ul className="space-y-4">
                {[
                  'Rastreamento em tempo real',
                  'Pagamento seguro na entrega ou online',
                  'Validação por código para sua segurança'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <ArrowRight size={14} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-white p-8 rounded-2xl shadow-xl rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Mockup visual simples */}
              <div className="space-y-4">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                <div className="h-32 bg-blue-50 rounded-lg flex items-center justify-center text-blue-300">
                  Mapa de Rastreamento
                </div>
                <div className="flex justify-between items-center pt-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="h-8 bg-blue-600 w-24 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold text-lg mb-4">GestorFarma</h4>
            <p className="text-sm">Conectando você à saúde de forma rápida e segura.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white">Sobre Nós</Link></li>
              <li><Link href="#" className="hover:text-white">Termos de Uso</Link></li>
              <li><Link href="#" className="hover:text-white">Política de Privacidade</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Parceiros</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/cadastrar" className="hover:text-white">Cadastre sua Farmácia</Link></li>
              <li><Link href="#" className="hover:text-white">Seja um Entregador</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
