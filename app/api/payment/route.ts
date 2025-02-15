import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'

const api = axios.create({
  baseURL: 'https://sandbox.api.pagseguro.com',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
  },
})

// Adicione logs para debug
api.interceptors.request.use((request) => {
  console.log('Request to PagBank:', {
    url: request.url,
    method: request.method,
    headers: request.headers,
    data: request.data,
  })
  return request
})

api.interceptors.response.use(
  (response) => {
    console.log('Response from PagBank:', {
      status: response.status,
      data: response.data,
    })
    return response
  },
  (error) => {
    console.error('Error from PagBank:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })
    return Promise.reject(error)
  },
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createRouteHandlerClient({ cookies })

    // Verifica autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Ajusta o formato dos dados antes de enviar para o PagBank
    if (body.customer?.taxId) {
      body.customer.tax_id = body.customer.taxId.replace(/\D/g, '')
      delete body.customer.taxId
    }

    // Não precisa mais converter para centavos pois já vem convertido do frontend
    // if (body.items) {
    //   body.items.forEach((item: any) => {
    //     if (item.unit_amount) {
    //       item.unit_amount = Math.round(item.unit_amount * 100)
    //     }
    //   })
    // }

    // if (body.charges) {
    //   body.charges.forEach((charge: any) => {
    //     if (charge.amount?.value) {
    //       charge.amount.value = Math.round(charge.amount.value * 100)
    //     }
    //     // Adiciona o parâmetro capture para cartão de crédito
    //     if (charge.payment_method?.type === 'CREDIT_CARD') {
    //       charge.payment_method.capture = true
    //     }
    //   })
    // }

    // Faz a chamada para o PagBank
    const response = await api.post('/orders', body)

    console.log('Resposta do PagBank:', {
      orderId: response.data.id,
      referenceId: response.data.reference_id,
      status: response.data.charges?.[0]?.status,
      paymentMethod: response.data.charges?.[0]?.payment_method?.type,
    })

    // Atualiza o status do pagamento no banco de dados
    if (response.data.charges?.[0]?.status === 'PAID') {
      console.log('Atualizando status para approved...')
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'approved',
          payment_details: response.data,
          external_id: response.data.id,
        })
        .eq('order_id', body.reference_id)

      if (error) {
        console.error('Erro ao atualizar pagamento:', error)
      } else {
        console.log('Status do pagamento atualizado com sucesso')
      }

      // Atualiza o status do pedido para 'paid'
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', body.reference_id)

      if (orderError) {
        console.error('Erro ao atualizar pedido:', orderError)
      } else {
        console.log('Status do pedido atualizado com sucesso')
      }
    } else if (response.data.charges?.[0]?.status === 'DECLINED') {
      console.log('Atualizando status para declined...')
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'declined',
          payment_details: response.data,
          external_id: response.data.id,
        })
        .eq('order_id', body.reference_id)

      if (error) {
        console.error('Erro ao atualizar pagamento:', error)
      } else {
        console.log('Status do pagamento atualizado com sucesso')
      }
    }

    return NextResponse.json(response.data)
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Erro no processamento do pagamento:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        },
      })

      return new NextResponse(
        JSON.stringify({
          error: 'Erro ao processar pagamento',
          details: error.response?.data || error.message,
        }),
        { status: error.response?.status || 500 },
      )
    }

    return new NextResponse(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 500 },
    )
  }
}
