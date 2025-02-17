/* eslint-disable camelcase */
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'
import axios from 'axios'

interface PagBankWebhookPayload {
  id: string
  reference_id: string
  status: string
  created_at: string
  charges: Array<{
    id: string
    status: string
    amount: {
      value: number
      currency: string
    }
    payment_method: {
      type: string
      installments: number
    }
  }>
}

const pagBankApi = axios.create({
  baseURL: 'https://sandbox.api.pagseguro.com',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
  },
})

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
  try {
    const payload: PagBankWebhookPayload = await request.json()

    console.log('PagBank Webhook Payload:', payload)

    const { reference_id, charges, id: transactionId } = payload

    try {
      const { data: transactionData } = await pagBankApi.get(
        `/orders/${transactionId}`,
      )
      console.log('Status verificado na API:', transactionData)

      if (transactionData.reference_id !== reference_id) {
        console.error('Reference ID não corresponde')
        return new Response('Invalid transaction', { status: 400 })
      }

      const status =
        transactionData.charges?.[0]?.status || charges?.[0]?.status

      if (!status) {
        console.error('Status não encontrado no payload:', payload)
        return new Response('Status not found in payload', { status: 400 })
      }

      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: mapPagBankStatus(status),
          payment_details: transactionData,
        })
        .eq('order_id', reference_id)

      if (paymentError) {
        console.error('Erro ao atualizar pagamento:', paymentError)
        return new Response('Error updating payment', { status: 500 })
      }

      if (status === 'PAID') {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', reference_id)

        if (orderError) {
          console.error('Erro ao atualizar pedido:', orderError)
          return new Response('Error updating order', { status: 500 })
        }

        const { data: order } = await supabase
          .from('orders')
          .select('user_id')
          .eq('id', reference_id)
          .single()

        if (order) {
          await supabase.from('notifications').insert({
            user_id: order.user_id,
            title: 'Pagamento confirmado! 🎉',
            description: 'Seu pedido foi confirmado e está sendo preparado.',
            status: 'unread',
          })
        }
      }

      return NextResponse.json({ received: true })
    } catch (error) {
      console.error('Erro ao verificar status na API do PagBank:', error)
      return new Response('Error verifying transaction status', { status: 500 })
    }
  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}

function mapPagBankStatus(
  pagBankStatus: string,
): Database['public']['Enums']['payment_status'] {
  const statusMap: Record<
    string,
    Database['public']['Enums']['payment_status']
  > = {
    AUTHORIZED: 'processing',
    PAID: 'approved',
    DECLINED: 'declined',
    CANCELED: 'cancelled',
    REFUNDED: 'refunded',
    PENDING: 'pending',
    WAITING: 'pending',
    PROCESSING: 'processing',
  }

  return statusMap[pagBankStatus] || 'pending'
}
