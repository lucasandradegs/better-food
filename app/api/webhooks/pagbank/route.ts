/* eslint-disable camelcase */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Log do webhook para debug
    console.log('PagBank Webhook Payload:', payload)

    const { reference_id, charges } = payload
    const status = charges?.[0]?.status

    if (!status) {
      console.error('Status não encontrado no payload:', payload)
      return new Response('Status not found in payload', { status: 400 })
    }

    // Atualiza o status do pagamento
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: mapPagBankStatus(status),
        payment_details: payload,
      })
      .eq('order_id', reference_id)

    if (paymentError) {
      console.error('Erro ao atualizar pagamento:', paymentError)
      return new Response('Error updating payment', { status: 500 })
    }

    // Se o pagamento foi aprovado, atualiza o status do pedido
    if (status === 'PAID') {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', reference_id)

      if (orderError) {
        console.error('Erro ao atualizar pedido:', orderError)
        return new Response('Error updating order', { status: 500 })
      }

      // Cria uma notificação para o usuário
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
