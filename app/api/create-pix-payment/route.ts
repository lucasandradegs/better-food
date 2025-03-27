import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface CreatePixPaymentRequest {
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
  orderDetails: {
    orderId: string
    amount: number
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  // @ts-expect-error cookies is not typed
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    const data = (await request.json()) as CreatePixPaymentRequest
    console.log('Dados recebidos:', data)

    const orderId = data.orderDetails.orderId
    console.log('Order ID:', orderId)

    // 1. Verificar se já existe um pagamento aprovado para este pedido
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

    // 2. Criar pedido no PagBank
    console.log('Iniciando chamada ao PagBank...')
    const response = await fetch(`${process.env.PAGBANK_API_URL}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        reference_id: `order-${orderId}`,
        customer: data.customer,
        items: data.items,
        notification_urls: [
          `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pagbank`,
        ],
        qr_codes: [
          {
            amount: {
              value: Math.round(data.orderDetails.amount * 100), // Convertendo para centavos
            },
            expiration_date: new Date(
              Date.now() + 24 * 60 * 60 * 1000,
            ).toISOString(), // 24 horas
          },
        ],
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

    // 3. Salvar o pagamento no banco de dados
    console.log('Salvando pagamento no banco...')
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        pagbank_id: responseData.id,
        amount: data.orderDetails.amount,
        status: 'PENDING',
        payment_method: 'PIX',
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
          amount: data.orderDetails.amount,
          status: 'pending',
        },
      })
      throw new Error(`Erro ao salvar pagamento: ${paymentError.message}`)
    }

    console.log('Pagamento salvo:', paymentData)

    return NextResponse.json({
      ...responseData,
      qr_code: responseData.qr_codes[0],
      paymentStatus: 'pending',
      orderStatus: 'pending',
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
