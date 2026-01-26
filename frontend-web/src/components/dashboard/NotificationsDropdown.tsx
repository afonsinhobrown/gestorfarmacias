'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, PackageX, Calendar, Check, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Notificacao {
    id: number;
    tipo: 'VALIDADE' | 'EXPIRADO' | 'ESTOQUE' | 'PEDIDO' | 'SISTEMA';
    titulo: string;
    mensagem: string;
    lida: boolean;
    data_criacao: string;
}

export function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotificacoes = async () => {
        try {
            const res = await api.get('/farmacias/notificacoes/');
            setNotificacoes(res.data.results || []);
            setUnreadCount(res.data.results?.filter((n: any) => !n.lida).length || 0);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    };

    useEffect(() => {
        fetchNotificacoes();
        // Polling a cada 2 minutos
        const interval = setInterval(fetchNotificacoes, 120000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const marcarLida = async (id?: number) => {
        try {
            const url = id ? `/farmacias/notificacoes/ler/${id}/` : '/farmacias/notificacoes/ler/';
            await api.post(url);
            fetchNotificacoes();
        } catch (error) {
            console.error('Erro ao marcar como lida:', error);
        }
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'VALIDADE': return <Calendar size={16} className="text-orange-500" />;
            case 'EXPIRADO': return <PackageX size={16} className="text-red-600" />;
            case 'ESTOQUE': return <AlertTriangle size={16} className="text-amber-500" />;
            default: return <Bell size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 bg-white border-b flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => marcarLida()}
                                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                            >
                                <Check size={14} /> Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notificacoes.length > 0 ? (
                            notificacoes.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.lida && marcarLida(notif.id)}
                                    className={`p-4 border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors relative ${!notif.lida ? 'bg-blue-50/50' : ''}`}
                                >
                                    {!notif.lida && (
                                        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full"></div>
                                    )}
                                    <div className="flex gap-3">
                                        <div className="mt-1">{getIcon(notif.tipo)}</div>
                                        <div className="flex-1">
                                            <p className={`text-sm leading-tight ${!notif.lida ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                                {notif.titulo}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                {notif.mensagem}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
                                                {formatDistanceToNow(new Date(notif.data_criacao), { addSuffix: true, locale: pt })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-gray-400">
                                <Bell size={40} className="mx-auto mb-2 opacity-10" />
                                <p className="text-sm">Sem notificações no momento</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-gray-50 text-center border-t">
                        <button className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 mx-auto">
                            <MoreHorizontal size={14} /> VER TODAS
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
