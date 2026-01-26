'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Search, User as UserIcon } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';

export function Header() {
    const { user } = useAuthStore();

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10 w-full">
            <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 w-96">
                <Search size={18} className="text-gray-500 mr-2" />
                <input
                    type="text"
                    placeholder="Pesquisar..."
                    className="bg-transparent border-none outline-none text-sm w-full"
                />
            </div>

            <div className="flex items-center gap-4">
                <NotificationsDropdown />

                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                            {user?.tipo_usuario.toLowerCase()}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {user?.foto_perfil ? (
                            <img src={user.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={20} className="text-gray-500" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
