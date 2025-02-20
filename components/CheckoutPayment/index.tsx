'use client'

import { usePayment } from '@/contexts/PaymentContext'
import Pix from '@/public/pix'
import { CreditCardIcon } from 'lucide-react'

export default function CheckoutPayment() {
  const { paymentMethod, setPaymentMethod, order } = usePayment()

  if (!order) return null

  const creditCardPrice = order.total_amount
  const pixPrice = order.total_amount * 0.95 // 5% de desconto

  return (
    <div className="">
      <h1 className="text-sm font-medium">Pagamento</h1>
      <div className="mt-4 flex flex-row items-center gap-2">
        <div
          className={`flex h-32 w-full cursor-pointer flex-col items-center justify-between gap-2 rounded-md border p-2 dark:border-[#343434] ${
            paymentMethod === 'CREDIT_CARD'
              ? 'border-red-500 dark:border-red-500'
              : ''
          }`}
          onClick={() => setPaymentMethod('CREDIT_CARD')}
        >
          <CreditCardIcon className="h-8 w-8" color="#d22424" />
          <p className="text-xs font-medium">Cartão de crédito</p>
          <div className="flex flex-col items-center">
            <p className="text-xs font-medium">Á vista</p>
            <p className="text-sm font-medium">
              R$ {creditCardPrice.toFixed(2)}
            </p>
          </div>
        </div>
        <div
          className={`flex h-32 w-full cursor-pointer flex-col items-center justify-between gap-2 rounded-md border p-2 dark:border-[#343434] ${
            paymentMethod === 'PIX' ? 'border-red-500 dark:border-red-500' : ''
          }`}
          onClick={() => setPaymentMethod('PIX')}
        >
          <Pix color="#d22424" width={32} height={32} />
          <p className="text-xs font-medium">Pix</p>
          <div className="flex flex-col items-center">
            <p className="text-xs font-medium">5% de desconto</p>
            <p className="text-sm font-medium">R$ {pixPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
