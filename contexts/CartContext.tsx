'use client'

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import { useToast } from '@/hooks/use-toast'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url: string | null
  store_id: string
}

interface CartContextData {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (itemId: string) => void
  updateItemQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const { toast } = useToast()

  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((currentItems) => {
      // Verifica se já existe um item de uma loja diferente
      const existingStoreId = currentItems[0]?.store_id
      if (existingStoreId && existingStoreId !== newItem.store_id) {
        toast({
          title: 'Atenção',
          description:
            'Você só pode adicionar itens de uma mesma loja por pedido. Deseja limpar seu carrinho?',
          variant: 'destructive',
        })
        return currentItems
      }

      // Verifica se o item já existe no carrinho
      const existingItem = currentItems.find((item) => item.id === newItem.id)

      if (existingItem) {
        // Atualiza a quantidade se o item já existe
        return currentItems.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      // Adiciona novo item com quantidade 1
      return [...currentItems, { ...newItem, quantity: 1 }]
    })

    toast({
      title: 'Item adicionado',
      description: 'Item adicionado ao carrinho com sucesso!',
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    )
  }, [])

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item,
      ),
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateItemQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}
