'use client'

import { usePayment } from '@/contexts/PaymentContext'
import { CreditCardForm } from './CreditCardForm'
import { PixForm } from './PixForm'

export default function CheckoutPaymentForm() {
  const { paymentMethod } = usePayment()

  return (
    <div>
      {paymentMethod === 'PIX' && <PixForm />}
      {paymentMethod === 'CREDIT_CARD' && <CreditCardForm />}
    </div>
  )
}
