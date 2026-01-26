import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: number; // ID do produto ou do estoque
    produto_nome: string;
    farmacia_nome: string;
    farmacia_id: number; // ID da farmácia
    preco: number;
    quantidade: number;
    imagem?: string | null;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantidade'>) => void;
    removeItem: (id: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    total: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                const currentItems = get().items;
                const existingItem = currentItems.find(item => item.id === newItem.id);

                if (existingItem) {
                    set({
                        items: currentItems.map(item =>
                            item.id === newItem.id
                                ? { ...item, quantidade: item.quantidade + 1 }
                                : item
                        )
                    });
                } else {
                    set({ items: [...currentItems, { ...newItem, quantidade: 1 }] });
                }
            },

            removeItem: (id) => {
                set({ items: get().items.filter(item => item.id !== id) });
            },

            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(id);
                    return;
                }
                set({
                    items: get().items.map(item =>
                        item.id === id ? { ...item, quantidade: quantity } : item
                    )
                });
            },

            clearCart: () => set({ items: [] }),

            total: () => {
                return get().items.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
            }
        }),
        {
            name: 'gestorfarma-cart-storage', // nome para o localStorage
        }
    )
);
