'use client'

import { usePayment } from '@/contexts/PaymentContext'

export default function CheckoutSummary() {
  const { order, paymentMethod, finalAmount } = usePayment()

  if (!order) {
    return null
  }

  const discount = paymentMethod === 'PIX' ? order.total_amount * 0.05 : 0

  return (
    <div className="rounded-md border p-4">
      <h1 className="text-sm font-medium">Detalhes do pedido</h1>
      <div className="mt-4 flex flex-col gap-2 border-t pt-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-row items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {item.quantity}x {item.product.name}
              </p>
            </div>
            <p className="text-xs font-medium">
              R$ {item.total_price.toFixed(2)}
            </p>
          </div>
        ))}

        {paymentMethod === 'PIX' && (
          <div className="flex flex-row items-center justify-between text-green-600">
            <p className="text-xs font-medium">Desconto PIX (5%)</p>
            <p className="text-xs font-medium">- R$ {discount.toFixed(2)}</p>
          </div>
        )}

        <div className="flex flex-row items-center justify-between border-t pt-4">
          <p className="text-sm font-medium">Total</p>
          <p className="text-sm font-medium">R$ {finalAmount.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
