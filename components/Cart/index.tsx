'use client'

import { ShoppingCart, Trash2, Plus, Minus, PackageOpen } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import axios, { AxiosError } from 'axios'
import { useToast } from '@/hooks/use-toast'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'

export function CartSheet() {
  const {
    items,
    totalItems,
    totalPrice,
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useCart()
  const router = useRouter()
  const { toast } = useToast()
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string
    name: string
    discount: number
  } | null>(null)

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  async function handleValidateCoupon() {
    if (!couponCode) return

    try {
      setIsValidatingCoupon(true)
      const response = await axios.post('/api/validate-coupon', {
        couponName: couponCode,
      })

      setAppliedCoupon(response.data)
      toast({
        title: 'Cupom aplicado com sucesso! 🎉',
        description: `Desconto de ${response.data.discount}% aplicado ao seu pedido.`,
      })
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>
      toast({
        title: 'Erro ao aplicar cupom',
        description:
          axiosError.response?.data?.error || 'Cupom inválido ou expirado.',
        variant: 'destructive',
      })
      setAppliedCoupon(null)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const discountAmount = appliedCoupon
    ? (totalPrice * appliedCoupon.discount) / 100
    : 0
  const finalPrice = totalPrice - discountAmount

  async function handleCreateOrder() {
    try {
      setIsCreatingOrder(true)

      const response = await axios.post('/api/create-order', {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: totalPrice,
        storeId: items[0]?.store_id,
        couponId: appliedCoupon?.id,
      })

      const { orderId } = response.data
      clearCart()
      router.push(`/checkout?orderId=${orderId}`)
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>
      toast({
        title: 'Erro ao criar pedido',
        description:
          axiosError.response?.data?.error ||
          'Ocorreu um erro ao criar seu pedido. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingOrder(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative cursor-pointer">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white duration-200 animate-in zoom-in">
              {totalItems}
            </span>
          )}
        </div>
      </SheetTrigger>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 dark:border-[#343434] dark:bg-[#1c1c1c] sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex h-12 justify-center space-y-0.5 px-6">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4" />
            Carrinho
          </SheetTitle>
          {totalItems > 0 && (
            <p className="text-start text-xs text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'} no carrinho
            </p>
          )}
        </SheetHeader>
        <Separator className="dark:border-[#343434]" />
        <ScrollArea className="flex-1">
          {items.length === 0 ? (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 p-6">
              <div className="relative">
                <div className="absolute -inset-4 animate-pulse rounded-full bg-red-500/10" />
                <div className="relative rounded-full bg-red-500/10 p-6">
                  <PackageOpen className="h-12 w-12 text-red-500" />
                </div>
              </div>
              <div className="mt-4 text-center">
                <h3 className="font-semibold">Seu carrinho está vazio</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adicione itens para começar suas compras
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col divide-y dark:divide-[#343434]">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex items-center gap-4 p-6 transition-colors hover:bg-muted/50 dark:hover:bg-[#242424]"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted/30">
                    <Image
                      src={item.image_url || '/better-food.png'}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-base font-medium leading-tight">
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold tracking-tight text-red-500">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.price)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-lg border p-1 dark:border-[#343434]">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 dark:hover:bg-[#242424]"
                          onClick={() =>
                            updateItemQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 dark:hover:bg-[#242424]"
                          onClick={() =>
                            updateItemQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 transition-opacity group-hover:opacity-100"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover item</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {items.length > 0 && (
          <div className="border-t p-6 dark:border-[#343434]">
            <dl className="space-y-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <dt className="text-sm">Subtotal</dt>
                <dd className="text-sm font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalPrice)}
                </dd>
              </div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="coupon" className="border-none">
                  <AccordionTrigger className="py-0 text-sm text-muted-foreground hover:no-underline">
                    Possui cupom?
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <Input
                          placeholder="Digite seu cupom"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          className="pr-24 text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button
                          size="sm"
                          className="absolute right-0 top-0 h-full rounded-l-none"
                          onClick={
                            appliedCoupon
                              ? handleRemoveCoupon
                              : handleValidateCoupon
                          }
                          disabled={
                            (!couponCode && !appliedCoupon) ||
                            isValidatingCoupon
                          }
                        >
                          {isValidatingCoupon ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : appliedCoupon ? (
                            'Remover'
                          ) : (
                            'Aplicar'
                          )}
                        </Button>
                      </div>
                      {appliedCoupon && (
                        <p className="text-xs text-green-500">
                          Cupom de desconto aplicado com sucesso 🎉
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <dt className="text-sm">
                    Desconto ({appliedCoupon.discount}%)
                  </dt>
                  <dd className="text-sm font-medium text-green-500">
                    -
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(discountAmount)}
                  </dd>
                </div>
              )}
              <Separator className="my-2 dark:border-[#343434]" />
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium">Total</dt>
                <dd className="text-sm font-semibold text-red-500">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(finalPrice)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 space-y-3">
              <Button
                className="relative w-full overflow-hidden bg-red-500 text-white transition-colors hover:bg-red-600 dark:bg-red-500/90 dark:hover:bg-red-600/90"
                size="lg"
                onClick={handleCreateOrder}
                disabled={isCreatingOrder}
              >
                {isCreatingOrder && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-600/20">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
                <span className={isCreatingOrder ? 'opacity-0' : 'opacity-100'}>
                  Finalizar Pedido
                </span>
              </Button>
              <Button
                variant="ghost"
                className="w-full dark:hover:bg-[#242424]"
                onClick={clearCart}
              >
                Limpar Carrinho
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
