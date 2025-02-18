import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

type PaymentStatus = Database['public']['Enums']['payment_status']
type OrderStatus = Database['public']['Enums']['order_status']

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    console.log('PagBank Webhook Payload:', payload)

    const pagbankId = payload.id // ID da ordem do PagBank
    const isPaid = payload.charges?.[0]?.status === 'PAID'

    if (!isPaid) {
      return new Response('Nenhuma atualização necessária', { status: 200 })
    }

    // Buscar o pagamento pelo ID do PagBank
    const { data: payment, error: paymentCheckError } = await supabase
      .from('payments')
      .select('id, order_id, payment_method')
      .eq('pagbank_id', pagbankId)
      .single()

    if (paymentCheckError) {
      console.error('Pagamento não encontrado:', paymentCheckError)
      return new Response('Pagamento não encontrado', { status: 404 })
    }

    // Atualizar o status do pagamento
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'PAID' as PaymentStatus,
        updated_at: new Date().toISOString(),
        response_data: payload,
      })
      .eq('id', payment.id)

    if (paymentError) {
      console.error('Erro ao atualizar pagamento:', paymentError)
      return new Response('Erro ao atualizar pagamento', { status: 500 })
    }

    // Buscar o pedido com informações da loja
    const { data: order, error: orderFetchError } = await supabase
      .from('orders')
      .select('id, user_id, store_id, total_amount')
      .eq('id', payment.order_id)
      .single()

    if (orderFetchError) {
      console.error('Erro ao buscar pedido:', orderFetchError)
      return new Response('Erro ao buscar pedido', { status: 500 })
    }

    // Buscar informações da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('admin_id')
      .eq('id', order.store_id)
      .single()

    if (storeError) {
      console.error('Erro ao buscar loja:', storeError)
      return new Response('Erro ao buscar loja', { status: 500 })
    }

    // Atualizar o status do pedido
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'paid' as OrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.order_id)

    if (orderError) {
      console.error('Erro ao atualizar pedido:', orderError)
      return new Response('Erro ao atualizar pedido', { status: 500 })
    }

    // Criar notificação para o cliente
    if (payment.payment_method === 'PIX') {
      const { error: customerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: order.user_id,
          title: 'Pagamento PIX aprovado! 🎉',
          description:
            'Seu pagamento via PIX foi aprovado e seu pedido está sendo preparado.',
          status: 'unread',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (customerNotificationError) {
        console.error(
          'Erro ao criar notificação para o cliente:',
          customerNotificationError,
        )
      }

      // Criar notificação para o administrador da loja
      const { error: adminNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: store.admin_id,
          title: 'Novo pedido recebido! 🛍️',
          description: `Novo pedido no valor de R$ ${Number(order.total_amount).toFixed(2)} foi pago via PIX.`,
          status: 'unread',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (adminNotificationError) {
        console.error(
          'Erro ao criar notificação para o administrador:',
          adminNotificationError,
        )
      }
    }

    return new Response('Webhook processado com sucesso', { status: 200 })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return new Response('Erro ao processar webhook', { status: 500 })
  }
}
