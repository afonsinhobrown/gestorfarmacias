'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Wrench, Phone, MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';

export default function MaintenancePage() {
    const [checking, setChecking] = useState(false);

    const tryReconnect = async () => {
        setChecking(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            await fetch(`${apiUrl}/farmacias/`, { method: 'HEAD', mode: 'no-cors' });
            window.location.href = '/dashboard';
        } catch (err) {
            setTimeout(() => setChecking(false), 800);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-2xl w-full text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative inline-block mb-12"
                >
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                    <div className="relative bg-white p-8 rounded-[3rem] shadow-2xl border border-blue-50">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        >
                            <Settings size={80} className="text-blue-600 opacity-20" />
                        </motion.div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Wrench size={48} className="text-blue-600" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        Site em Manutenção
                    </h1>
                    <p className="text-xl text-slate-500 mb-12 max-w-lg mx-auto leading-relaxed">
                        Estamos a realizar melhorias técnicas. Por favor, aguarde alguns instantes ou contacte o nosso suporte.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 text-left"
                    >
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Phone size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Linha de Apoio</p>
                            <p className="text-lg font-bold text-slate-800 tracking-tighter">877 981 166</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 text-left"
                    >
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Vendas & Ajuda</p>
                            <p className="text-lg font-bold text-slate-800 italic">GestorFarma Online</p>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                        <AlertTriangle size={14} className="animate-pulse" /> Servidor temporariamente inacessível
                    </div>

                    <button
                        onClick={tryReconnect}
                        disabled={checking}
                        className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50"
                    >
                        {checking ? <RefreshCw className="animate-spin" size={18} /> : null}
                        {checking ? 'A verificar...' : 'TENTAR RECONECTAR AGORA'}
                    </button>
                </motion.div>
            </div>

            <div className="fixed top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] -z-10 opacity-30"></div>
            <div className="fixed bottom-0 left-0 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] -z-10 opacity-30"></div>
        </div>
    );
}
