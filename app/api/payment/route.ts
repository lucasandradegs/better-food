/* eslint-disable @typescript-eslint/no-explicit-any */
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

async function updatePaymentStatus(
  supabase: any,
  orderId: string,
  status: string,
  paymentData: any,
) {
  const paymentStatus =
    status === 'PAID'
      ? 'approved'
      : status === 'DECLINED'
        ? 'declined'
        : 'pending'

  const { error } = await supabase
    .from('payments')
    .update({
      status: paymentStatus,
      payment_details: paymentData,
      external_id: paymentData.id,
    })
    .eq('order_id', orderId)

  if (error) {
    console.error('Erro ao atualizar pagamento:', error)
    return false
  }

  if (status === 'PAID') {
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)

    if (orderError) {
      console.error('Erro ao atualizar pedido:', orderError)
      return false
    }
  }

  return true
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (body.customer?.taxId) {
      body.customer.tax_id = body.customer.taxId.replace(/\D/g, '')
      delete body.customer.taxId
    }

    const response = await api.post('/orders', body)

    console.log('Resposta do PagBank:', {
      orderId: response.data.id,
      referenceId: response.data.reference_id,
      status: response.data.charges?.[0]?.status,
      paymentMethod: response.data.charges?.[0]?.payment_method?.type,
    })

    const status = response.data.charges?.[0]?.status
    if (status) {
      await updatePaymentStatus(
        supabase,
        body.reference_id,
        status,
        response.data,
      )
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
