'use client'

import { PaymentProvider, usePayment } from '@/contexts/PaymentContext'
import CheckoutPayment from '@/components/CheckoutPayment'
import CheckoutSummary from '@/components/CheckoutSummary'
import CheckoutPaymentForm from '@/components/CheckoutPaymentForm'
import CheckoutPayButton from '@/components/CheckoutPayButton'
import { CheckoutSkeleton } from '@/components/CheckoutSkeleton'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Checkout() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-xl font-semibold">
          Ops... Pedido não encontrado 😅
        </h2>
        <p className="text-sm text-muted-foreground">
          Parece que esse pedido não existe. Que tal fazer um novo?
        </p>
        <Link href="/inicio">
          <Button>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Fazer novo pedido
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <PaymentProvider orderId={orderId}>
      <CheckoutContent />
    </PaymentProvider>
  )
}

function CheckoutContent() {
  const { isLoading, orderStatus } = usePayment()

  if (isLoading) {
    return <CheckoutSkeleton />
  }

  // Se o pedido já foi pago
  if (orderStatus === 'paid') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-xl font-semibold">Este pedido já foi pago! 🎉</h2>
        <p className="text-sm text-muted-foreground">
          Você pode acompanhar seus pedidos na aba &quot;Meus pedidos&quot;
        </p>
        <div className="flex gap-4">
          <Link href="/orders">
            <Button variant="outline">Ver meus pedidos</Button>
          </Link>
          <Link href="/inicio">
            <Button>Fazer novo pedido</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4 lg:mx-auto lg:w-[540px]">
      <CheckoutSummary />
      <CheckoutPayment />
      <CheckoutPaymentForm />
      <CheckoutPayButton />
    </div>
  )
}
