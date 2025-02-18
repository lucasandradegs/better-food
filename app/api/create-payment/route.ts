import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

interface CreatePaymentRequest {
  customer: {
    name: string
    email: string
    tax_id: string
    phones: Array<{
      country: string
      area: string
      number: string
      type: 'MOBILE'
    }>
  }
  items: Array<{
    reference_id: string
    name: string
    quantity: number
    unit_amount: number
  }>
  charges: Array<{
    reference_id: string
    description: string
    amount: {
      value: number
      currency: 'BRL'
    }
    payment_method: {
      type: 'CREDIT_CARD'
      installments: number
      capture: boolean
      card: {
        encrypted: string
        store: boolean
      }
      holder: {
        name: string
        tax_id: string
      }
    }
  }>
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  })

  try {
    const data = (await request.json()) as CreatePaymentRequest
    console.log('Dados recebidos:', {
      ...data,
      charges: data.charges.map((charge) => ({
        ...charge,
        payment_method: {
          ...charge.payment_method,
          card: {
            ...charge.payment_method.card,
            encrypted: '***',
          },
        },
      })),
    })

    const orderId = data.charges[0].reference_id.replace('charge-', '')
    console.log('Order ID:', orderId)

    // 1. Criar pedido no PagBank
    console.log('Iniciando chamada ao PagBank...')
    const response = await fetch('https://sandbox.api.pagseguro.com/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        reference_id: `order-${Date.now()}`,
        customer: data.customer,
        items: data.items,
        notification_urls: [
          `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pagbank`,
        ],
        charges: data.charges,
      }),
    })

    const responseData = await response.json()
    console.log('Resposta do PagBank:', responseData)

    if (!response.ok) {
      console.error('Erro ao criar pedido no PagBank:', {
        status: response.status,
        data: responseData,
      })
      return NextResponse.json(
        {
          error: 'Falha ao processar pagamento',
          details: responseData,
        },
        { status: response.status },
      )
    }

    const paymentStatus = responseData.charges[0]?.status || 'ERROR'
    const paymentMessage =
      responseData.charges[0]?.payment_response?.message || ''
    console.log('Status do pagamento:', { paymentStatus, paymentMessage })

    // Mapear o status do PagBank para nosso enum
    let dbPaymentStatus:
      | 'AUTHORIZED'
      | 'PAID'
      | 'DECLINED'
      | 'CANCELED'
      | 'PENDING'
      | 'IN_ANALYSIS'
      | 'REFUNDED'
      | 'ERROR'
    switch (paymentStatus) {
      case 'AUTHORIZED':
      case 'PAID':
        dbPaymentStatus = paymentStatus
        break
      case 'DECLINED':
        dbPaymentStatus = 'DECLINED'
        break
      case 'CANCELED':
        dbPaymentStatus = 'CANCELED'
        break
      case 'IN_ANALYSIS':
        dbPaymentStatus = 'IN_ANALYSIS'
        break
      case 'REFUNDED':
        dbPaymentStatus = 'REFUNDED'
        break
      default:
        dbPaymentStatus = 'ERROR'
    }

    // 2. Salvar o pagamento no banco de dados
    console.log('Salvando pagamento no banco...')

    // Verificar se já existe um pagamento bem-sucedido para este pedido
    const { data: existingPayment, error: existingPaymentError } =
      await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'PAID')
        .single()

    if (existingPaymentError && existingPaymentError.code !== 'PGRST116') {
      console.error(
        'Erro ao verificar pagamento existente:',
        existingPaymentError,
      )
      throw new Error(
        `Erro ao verificar pagamento existente: ${existingPaymentError.message}`,
      )
    }

    // Se já existe um pagamento bem-sucedido, não permitir novo pagamento
    if (existingPayment) {
      return NextResponse.json(
        {
          error: 'Pedido já foi pago',
          details: 'Este pedido já possui um pagamento aprovado',
        },
        { status: 400 },
      )
    }

    // Salvar o novo pagamento
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        pagbank_id: responseData.id,
        amount: data.charges[0].amount.value,
        status: dbPaymentStatus,
        payment_method: data.charges[0].payment_method.type,
        response_data: responseData,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Erro ao salvar pagamento:', {
        error: paymentError,
        data: {
          order_id: orderId,
          pagbank_id: responseData.id,
          amount: data.charges[0].amount.value,
          status: dbPaymentStatus,
          payment_method: data.charges[0].payment_method.type,
        },
      })
      throw new Error(`Erro ao salvar pagamento: ${paymentError.message}`)
    }

    console.log('Pagamento salvo:', paymentData)

    // 3. Atualizar o status do pedido
    console.log('Atualizando status do pedido...')
    let orderStatus: Database['public']['Enums']['order_status']
    switch (paymentStatus) {
      case 'PAID':
        orderStatus = 'paid'
        break
      case 'DECLINED':
        orderStatus = 'cancelled'
        break
      case 'CANCELED':
        orderStatus = 'cancelled'
        break
      default:
        orderStatus = 'pending'
    }

    console.log('Tentando atualizar pedido:', {
      orderId,
      orderStatus,
      paymentStatus,
    })

    // Primeiro, vamos verificar se o pedido existe
    const { data: orderData, error: orderCheckError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderCheckError) {
      console.error('Erro ao verificar pedido:', {
        error: orderCheckError,
        orderId,
      })
      throw new Error(`Erro ao verificar pedido: ${orderCheckError.message}`)
    }

    console.log('Pedido encontrado:', orderData)

    // Agora vamos atualizar o status
    const { data: updatedOrder, error: orderError } = await supabase
      .from('orders')
      .update({ status: orderStatus })
      .eq('id', orderId)
      .select()
      .single()

    if (orderError) {
      console.error('Erro ao atualizar pedido:', {
        error: orderError,
        data: { orderId, orderStatus },
      })
      throw new Error(`Erro ao atualizar pedido: ${orderError.message}`)
    }

    console.log('Pedido atualizado com sucesso:', updatedOrder)

    // 4. Criar notificações
    if (paymentStatus === 'PAID') {
      // Notificação para o cliente
      const { error: customerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: orderData.user_id,
          title: 'Pagamento confirmado! 🎉',
          description: 'Seu pedido foi confirmado e está sendo preparado.',
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

      // Buscar informações da loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('admin_id')
        .eq('id', orderData.store_id)
        .single()

      if (!storeError && store) {
        // Notificação para o administrador
        const { error: adminNotificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: store.admin_id,
            title: 'Novo pedido recebido! 🛍️',
            description: `Novo pedido no valor de R$ ${Number(orderData.total_amount).toFixed(2)} foi pago via cartão de crédito.`,
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
    } else if (paymentStatus === 'DECLINED' || paymentStatus === 'CANCELED') {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: orderData.user_id,
          title: 'Pagamento não aprovado 😓',
          description:
            'Houve um problema com seu pagamento. Por favor, tente novamente.',
          status: 'unread',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (notificationError) {
        console.error('Erro ao criar notificação:', notificationError)
      }
    }

    return NextResponse.json({
      ...responseData,
      paymentStatus,
      paymentMessage,
      orderStatus,
      updatedOrder,
    })
  } catch (error) {
    console.error(
      'Erro ao processar pagamento:',
      error instanceof Error ? error.message : error,
    )
    return NextResponse.json(
      {
        error: 'Erro interno ao processar pagamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
