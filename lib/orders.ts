import { Database } from './database.types'
import { CartItem } from '@/contexts/CartContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PagBankService } from './pagbank'
import { v4 as uuidv4 } from 'uuid'

interface CreateOrderParams {
  userId: string
  items: CartItem[]
  customerData: {
    name: string
    email: string
    taxId: string
    phone: {
      area: string
      number: string
    }
  }
  paymentMethod: 'pix' | 'credit_card'
  orderId?: string
  card?: {
    encryptedCard: string
    number: string
    exp_month: string
    exp_year: string
    security_code: string
    holder: {
      name: string
    }
  }
}

export class OrderService {
  private supabase = createClientComponentClient<Database>()

  async createOrder({
    userId,
    items,
    customerData,
    paymentMethod,
    card,
    orderId,
  }: CreateOrderParams) {
    const supabase = createClientComponentClient<Database>()
    let existingOrderId = orderId
    const totalAmount = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    )

    try {
      if (!existingOrderId) {
        existingOrderId = uuidv4()

        const { error: orderError } = await supabase.from('orders').insert({
          id: existingOrderId,
          user_id: userId,
          store_id: items[0].store_id,
          total_amount: totalAmount,
          status: 'pending',
        })

        if (orderError) throw orderError

        const { error: itemsError } = await supabase.from('order_items').insert(
          items.map((item) => ({
            order_id: existingOrderId,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
          })),
        )

        if (itemsError) throw itemsError
      }

      let pagBankResult
      if (paymentMethod === 'credit_card' && card) {
        pagBankResult = await PagBankService.createCreditCardOrder({
          orderId: existingOrderId,
          amount: totalAmount,
          items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitAmount: item.price,
          })),
          customer: {
            name: customerData.name,
            email: customerData.email,
            taxId: customerData.taxId,
            phones: [
              {
                country: '55',
                area: customerData.phone.area,
                number: customerData.phone.number,
                type: 'MOBILE',
              },
            ],
          },
          card: {
            encrypted: card.encryptedCard,
            holder: {
              name: card.holder.name,
            },
          },
        })

        const initialStatus =
          pagBankResult.charges?.[0]?.status === 'PAID'
            ? 'approved'
            : pagBankResult.charges?.[0]?.status === 'DECLINED'
              ? 'declined'
              : 'pending'

        const { error: paymentError } = await supabase.from('payments').upsert({
          order_id: existingOrderId,
          amount: totalAmount,
          status: initialStatus,
          payment_method: paymentMethod,
          external_id: pagBankResult.id,
          payment_details: pagBankResult,
        })

        if (paymentError) throw paymentError

        if (pagBankResult.charges?.[0]?.status === 'PAID') {
          const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', existingOrderId)

          if (orderUpdateError) throw orderUpdateError
        }

        return pagBankResult
      } else if (paymentMethod === 'pix') {
        pagBankResult = await PagBankService.createOrder({
          orderId: existingOrderId,
          amount: totalAmount,
          items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitAmount: item.price,
          })),
          customer: {
            name: customerData.name,
            email: customerData.email,
            taxId: customerData.taxId,
            phones: [
              {
                country: '55',
                area: customerData.phone.area,
                number: customerData.phone.number,
                type: 'MOBILE',
              },
            ],
          },
        })

        const { error: paymentError } = await supabase.from('payments').upsert({
          order_id: existingOrderId,
          amount: totalAmount,
          status: 'pending',
          payment_method: paymentMethod,
          external_id: pagBankResult.id,
          payment_details: pagBankResult,
        })

        if (paymentError) throw paymentError

        return pagBankResult
      }

      throw new Error('Método de pagamento não suportado')
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      throw error
    }
  }

  async getOrderStatus(orderId: string) {
    const { data: order, error } = await this.supabase
      .from('orders')
      .select(
        `
        *,
        payments (
          status,
          payment_method,
          payment_details
        )
      `,
      )
      .eq('id', orderId)
      .single()

    if (error) {
      throw new Error('Erro ao buscar status do pedido')
    }

    return order
  }
}
