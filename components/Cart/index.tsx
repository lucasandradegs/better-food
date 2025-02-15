import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'
import { CheckoutDialog } from '../Checkout'

export function CartSheet() {
  const { items, totalItems, totalPrice, updateItemQuantity, removeItem } =
    useCart()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <div className="relative cursor-pointer">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {totalItems}
              </span>
            )}
          </div>
        </SheetTrigger>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg dark:bg-[#262626]">
          <SheetHeader className="px-4 py-2">
            <SheetTitle className="mt-1 flex items-center gap-2 text-base font-medium">
              <ShoppingCart className="h-4 w-4" />
              Carrinho
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
                <ShoppingCart className="h-16 w-16 text-gray-400" />
                <p className="text-center text-gray-500">
                  Seu carrinho está vazio
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y dark:divide-[#2e2e2e]">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={item.image_url || '/better-food.png'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateItemQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-2 w-2" />
                      </Button>
                      <span className="w-4 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          updateItemQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-2 w-2" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {items.length > 0 && (
            <div className="border-t p-4 dark:border-[#2e2e2e]">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-medium">Total</span>
                <span className="text-base font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalPrice)}
                </span>
              </div>
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => setIsCheckoutOpen(true)}
              >
                Finalizar Pedido
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutDialog
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  )
}
