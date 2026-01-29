'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Pill, ArrowRight, Star, ShieldCheck, Truck, Clock, Stethoscope, Droplets, Thermometer, BriefcaseMedical } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Premium Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <BriefcaseMedical className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-header">Gestor<span className="text-blue-600">Farma</span></h1>
          </div>

          <div className="hidden md:flex items-center gap-8 mr-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
            <Link href="#" className="hover:text-blue-600 transition-colors">Como Funciona</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Farmácias</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Produtos</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="px-6 py-2.5 text-slate-600 hover:text-blue-600 font-bold text-sm transition-all uppercase tracking-wider">
              Entrar
            </Link>
            <Link href="/cadastrar" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-wider">
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Modern Hero Section */}
        <section className="relative pt-20 pb-32 px-6 overflow-hidden bg-white">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2 opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-50 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2 opacity-40"></div>

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100">
                <ShieldCheck size={14} /> Plataforma Certificada 2026
              </div>

              <h2 className="text-5xl md:text-7xl font-black leading-[1.1] text-slate-900 font-header tracking-tight">
                Cuidar da sua <span className="text-blue-600">saúde</span> agora ficou mais <span className="underline decoration-emerald-400">simples</span>.
              </h2>

              <p className="text-slate-500 text-xl max-w-xl leading-relaxed font-medium">
                Localize medicamentos, compare preços e receba em casa em minutos. A maior rede de farmácias de Moçambique na palma da sua mão.
              </p>

              <form onSubmit={handleSearch} className="relative max-w-2xl group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-400 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                <div className="relative flex flex-col md:flex-row gap-2 bg-white p-2 rounded-2xl border shadow-2xl">
                  <div className="flex-1 flex items-center px-4 gap-3">
                    <Search className="text-slate-400" size={24} />
                    <input
                      type="text"
                      placeholder="Qual medicamento você procura?"
                      className="w-full py-4 text-slate-800 placeholder:text-slate-400 font-medium outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Pesquisar
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-500">
                  <span className="text-slate-900">+10.000</span> moçambicanos confiam em nós
                </p>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white rotate-2 hover:rotate-0 transition-all duration-700 aspect-square group">
                <img
                  src="/hero-pharmacy.png"
                  alt="Pharmacy modern concept"
                  className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                <div className="absolute bottom-10 left-10 text-white">
                  <p className="text-3xl font-black">Saúde & Tecnologia</p>
                  <p className="text-blue-300 font-bold uppercase tracking-widest text-sm mt-1">Conectando Soluções</p>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-50 animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Truck size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Entrega Ativa</p>
                    <p className="text-lg font-black text-slate-900">Em 15 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clinical Categories */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16 px-4">
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-slate-900 font-header">Serviços <span className="text-blue-600">Especializados</span></h3>
              <p className="text-slate-500 font-medium text-lg">Tudo o que você precisa em um único ecossistema farmacêutico.</p>
            </div>
            <Link href="/busca" className="text-blue-600 font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:gap-4 transition-all pb-2">
              Explorar Tudo <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Medicamentos', desc: 'Venda Geral', icon: BriefcaseMedical, color: 'bg-red-50 text-red-600' },
              { name: 'Bem-Estar', desc: 'Vitaminas e Suple.', icon: Droplets, color: 'bg-blue-50 text-blue-600' },
              { name: 'Infantil', desc: 'Maternidade e Bebé', icon: Thermometer, color: 'bg-emerald-50 text-emerald-600' },
              { name: 'Emergência', desc: 'Atendimento 24h', icon: Stethoscope, color: 'bg-purple-50 text-purple-600' },
            ].map((cat, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer group flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${cat.color} group-hover:shadow-lg group-hover:shadow-blue-50`}>
                  <cat.icon size={40} />
                </div>
                <h4 className="font-black text-2xl text-slate-900 font-header group-hover:text-blue-600 transition-colors uppercase tracking-tight">{cat.name}</h4>
                <p className="text-slate-400 font-bold mt-2 text-sm">{cat.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs uppercase tracking-widest">
                  Ver Mais <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modern Trust Section */}
        <section className="bg-slate-900 py-32 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 border border-white rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 border-4 border-white/20 rounded-[5rem] rotate-45"></div>
          </div>

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
            <div className="flex-1 space-y-8">
              <span className="text-blue-400 font-black uppercase tracking-[0.3em] text-xs">A nossa promessa</span>
              <h3 className="text-5xl font-black text-white leading-tight font-header">
                Saúde de <span className="text-blue-500">qualidade</span> ao alcance de qualquer moçambicano.
              </h3>
              <p className="text-slate-400 text-xl leading-relaxed font-medium">
                Unimos a maior rede de farmácias para garantir que você nunca fique sem o básico. Tecnologia a serviço da vida.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                {[
                  { title: 'Segurança Total', desc: 'Pagamento criptografado', icon: ShieldCheck },
                  { title: 'Entrega Flash', desc: 'Em tempo recorde', icon: Truck },
                  { title: 'Sempre Aberto', desc: 'Serviço 24/7 online', icon: Clock },
                  { title: 'Preço Justo', desc: 'Compare e economize', icon: Star },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-white/10 group-hover:bg-blue-600 transition-colors">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <p className="text-white font-black uppercase tracking-widest text-sm">{item.title}</p>
                      <p className="text-slate-500 font-bold text-xs mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full lg:max-w-lg">
              <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 transition-all duration-1000 group-hover:opacity-40"></div>

                <div className="relative z-10 space-y-8">
                  <div className="flex gap-2 text-yellow-500">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} fill="currentColor" />)}
                  </div>
                  <p className="text-2xl font-bold text-white italic leading-relaxed">
                    "O GestorFarma mudou completamente a forma como cuido da minha família. Não preciso mais andar de farmácia em farmácia procurando remédios raros."
                  </p>
                  <div className="flex items-center gap-4 border-t border-white/10 pt-8">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                      <img src="https://i.pravatar.cc/150?u=afonso" alt="client" />
                    </div>
                    <div>
                      <p className="text-white font-black text-lg">Afonso Brown</p>
                      <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">Cidade de Maputo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-emerald-500 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="absolute top-0 left-0 w-full h-full animate-pulse-slow pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <h3 className="text-4xl md:text-6xl font-black text-white mb-8 font-header tracking-tight">Pronto para digitalizar o seu cuidado?</h3>
            <p className="text-white/80 text-xl font-medium mb-12 max-w-2xl mx-auto">Junte-se a milhares de moçambicanos que já utilizam a melhor plataforma de saúde do país.</p>

            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link href="/cadastrar" className="px-12 py-5 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                Comece Agora Gratuitamente
              </Link>
              <Link href="#" className="px-12 py-5 bg-black/20 text-white rounded-2xl font-black uppercase tracking-widest border border-white/20 backdrop-blur-sm hover:bg-black/30 transition-all">
                Fale Connosco
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6 col-span-1 md:col-span-1">
            <div className="flex items-center gap-2">
              <BriefcaseMedical className="text-blue-600" size={32} />
              <h4 className="text-2xl font-black text-slate-900 font-header">Gestor<span className="text-blue-600">Farma</span></h4>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed">Infraestrutura digital para o ecossistema farmacêutico em Moçambique.</p>
          </div>

          <div>
            <h4 className="text-slate-900 font-black mb-8 uppercase tracking-widest text-xs">Páginas</h4>
            <ul className="space-y-4 text-slate-500 font-bold text-sm">
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Sobre Nós</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Centros de Ajuda</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Blog Saúde</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Privacidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-black mb-8 uppercase tracking-widest text-xs">Comercial</h4>
            <ul className="space-y-4 text-slate-500 font-bold text-sm">
              <li><Link href="/cadastrar" className="hover:text-blue-600 transition-colors underline decoration-blue-200">Registar Farmácia</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Logística e Entregas</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Parcerias Médicas</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Investir</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-slate-900 font-black mb-8 uppercase tracking-widest text-xs">Newsletter</h4>
            <div className="flex flex-col gap-3">
              <input type="email" placeholder="O seu e-mail" className="bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
              <button className="bg-blue-600 text-white p-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all">Subscrever Update</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 font-bold text-sm">© 2026 GestorFarma. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-slate-400 font-bold text-sm">
            <Link href="#" className="hover:text-blue-600 transition-colors">LinkedIn</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Instagram</Link>
            <Link href="#" className="hover:text-blue-600 transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
