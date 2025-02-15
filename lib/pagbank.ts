import axios, { AxiosError } from 'axios'

const api = axios.create({
  baseURL: '/api/payment',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Adicione isso logo após criar a instância do axios
api.interceptors.request.use((request) => {
  console.log('Request:', {
    url: request.url,
    method: request.method,
    headers: request.headers,
    data: request.data,
  })
  return request
})

api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
    })
    return response
  },
  (error) => {
    console.error('Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })
    return Promise.reject(error)
  },
)

interface CreateOrderParams {
  orderId: string
  amount: number
  items: Array<{
    name: string
    quantity: number
    unitAmount: number
  }>
  customer: {
    name: string
    email: string
    taxId: string // CPF
    phones: Array<{
      country: string
      area: string
      number: string
      type: 'MOBILE' | 'HOME'
    }>
  }
}

interface CreatePixPaymentResponse {
  id: string
  qr_codes: Array<{
    id: string
    text: string
    links: Array<{
      rel: string
      href: string
      media: string
      type: string
    }>
  }>
}

interface CreateCreditCardPaymentParams extends CreateOrderParams {
  card: {
    number: string
    exp_month: string
    exp_year: string
    security_code: string
    holder: {
      name: string
    }
  }
}

export class PagBankService {
  static async createOrder({
    orderId,
    amount,
    items,
    customer,
  }: CreateOrderParams) {
    try {
      // Converte o valor para centavos
      const amountInCents = Math.round(amount * 100)
      const unitAmountsInCents = items.map((item) =>
        Math.round(item.unitAmount * 100),
      )

      const response = await api.post('', {
        reference_id: orderId,
        customer: {
          name: customer.name,
          email: customer.email,
          tax_id: customer.taxId.replace(/\D/g, ''), // Remove caracteres não numéricos
          phones: customer.phones,
        },
        items: items.map((item, index) => ({
          reference_id: item.name,
          name: item.name,
          quantity: item.quantity,
          unit_amount: unitAmountsInCents[index], // Valor em centavos
        })),
        // Só adiciona notification_urls em produção
        ...(process.env.NODE_ENV === 'production' && {
          notification_urls: [
            `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pagbank`,
          ],
        }),
        qr_codes: [
          {
            amount: {
              value: amountInCents,
            },
            expiration_date: new Date(
              Date.now() + 24 * 60 * 60 * 1000, // 24 horas
            ).toISOString(),
          },
        ],
      })

      // Retorna a resposta completa
      return response.data
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(
          'Erro ao criar pedido no PagBank:',
          error.response?.data || error,
        )

        // Melhora a mensagem de erro para o usuário
        if (error.response?.data?.error_messages) {
          const errorMessages = error.response.data.error_messages
            .map((e: any) => e.description)
            .join(', ')
          throw new Error(`Erro ao processar pagamento: ${errorMessages}`)
        }

        throw new Error(
          error.response?.data?.error || 'Erro ao processar pagamento',
        )
      }
      throw error
    }
  }

  static async getOrderStatus(orderId: string) {
    try {
      const response = await api.get(`/orders/${orderId}`)
      return response.data
    } catch (error) {
      console.error('Erro ao consultar status do pedido:', error)
      throw new Error('Erro ao consultar status do pedido')
    }
  }

  static async createCreditCardOrder(params: CreateCreditCardPaymentParams) {
    try {
      // Converte o valor para centavos
      const amountInCents = Math.round(params.amount * 100)
      const unitAmountsInCents = params.items.map((item) =>
        Math.round(item.unitAmount * 100),
      )

      const response = await api.post('', {
        reference_id: params.orderId,
        customer: {
          name: params.customer.name,
          email: params.customer.email,
          tax_id: params.customer.taxId.replace(/\D/g, ''), // Remove caracteres não numéricos e usa snake_case
          phones: params.customer.phones,
        },
        items: params.items.map((item, index) => ({
          reference_id: item.name,
          name: item.name,
          quantity: item.quantity,
          unit_amount: unitAmountsInCents[index], // Valor em centavos
        })),
        charges: [
          {
            reference_id: params.orderId,
            description: 'Pedido Better Food',
            amount: {
              value: amountInCents, // Valor em centavos
              currency: 'BRL',
            },
            payment_method: {
              type: 'CREDIT_CARD',
              installments: 1,
              capture: true,
              card: {
                number: params.card.number,
                exp_month: params.card.exp_month,
                exp_year: params.card.exp_year,
                security_code: params.card.security_code,
                holder: {
                  name: params.card.holder.name,
                },
              },
            },
          },
        ],
      })

      return response.data
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Erro ao processar cartão:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        })

        // Melhora a mensagem de erro para o usuário
        if (error.response?.data?.error_messages) {
          const errorMessages = error.response.data.error_messages
            .map((e: any) => e.description)
            .join(', ')
          throw new Error(`Erro ao processar pagamento: ${errorMessages}`)
        }

        throw new Error(
          error.response?.data?.error ||
            'Erro ao processar pagamento com cartão',
        )
      }
      throw error
    }
  }
}
