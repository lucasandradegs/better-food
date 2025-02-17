import axios, { AxiosError } from 'axios'

// Interface para o SDK do PagBank
interface PagSeguroCard {
  encryptedCard: string
  hasErrors: boolean
  errors: Array<{
    code: string
    message: string
  }>
}

interface PagSeguroSDK {
  encryptCard(params: {
    publicKey: string
    holder: string
    number: string
    expMonth: string
    expYear: string
    securityCode: string
  }): PagSeguroCard
}

declare global {
  interface Window {
    PagSeguro: PagSeguroSDK
  }
}

interface ErrorMessage {
  code: string
  description: string
}

const api = axios.create({
  baseURL: '/api/payment',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((request) => {
  console.log('Request:', {
    url: request.url,
    method: request.method,
    data: request.data,
  })
  return request
})

api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
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

interface OrderItem {
  name: string
  quantity: number
  unitAmount: number
}

interface CustomerData {
  name: string
  email: string
  taxId: string
  phones: Array<{
    country: string
    area: string
    number: string
    type: 'MOBILE' | 'HOME'
  }>
}

interface BaseOrderParams {
  orderId: string
  amount: number
  items: OrderItem[]
  customer: CustomerData
}

interface CreditCardParams extends BaseOrderParams {
  card: {
    encrypted: string
    holder: {
      name: string
    }
  }
}

export class PagBankService {
  private static formatOrderData(params: BaseOrderParams) {
    const unitAmountsInCents = params.items.map((item) =>
      Math.round(item.unitAmount * 100),
    )

    // Determina a URL base para notificações
    const baseUrl = process.env.NGROK_URL || process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      throw new Error('NGROK_URL ou NEXT_PUBLIC_APP_URL não configurado')
    }

    // Remove qualquer barra final da URL base
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')

    return {
      reference_id: params.orderId,
      customer: {
        name: params.customer.name,
        email: params.customer.email,
        tax_id: params.customer.taxId.replace(/\D/g, ''),
        phones: params.customer.phones,
      },
      items: params.items.map((item, index) => ({
        reference_id: item.name,
        name: item.name,
        quantity: item.quantity,
        unit_amount: unitAmountsInCents[index],
      })),
      notification_urls: [`${cleanBaseUrl}/api/webhooks/pagbank`],
    }
  }

  private static handleError(error: unknown) {
    if (error instanceof AxiosError) {
      console.error('Erro na requisição:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })

      if (error.response?.data?.error_messages) {
        const errorMessages = error.response.data.error_messages
          .map((e: ErrorMessage) => e.description)
          .join(', ')
        throw new Error(`Erro ao processar pagamento: ${errorMessages}`)
      }

      throw new Error(
        error.response?.data?.error || 'Erro ao processar pagamento',
      )
    }
    throw error
  }

  static async createOrder(params: BaseOrderParams) {
    try {
      const orderData = this.formatOrderData(params)
      const amountInCents = Math.round(params.amount * 100)

      const response = await api.post('', {
        ...orderData,
        qr_codes: [
          {
            amount: {
              value: amountInCents,
            },
            expiration_date: new Date(
              Date.now() + 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ],
      })

      return response.data
    } catch (error) {
      return this.handleError(error)
    }
  }

  static async createCreditCardOrder(params: CreditCardParams) {
    try {
      const orderData = this.formatOrderData(params)
      const amountInCents = Math.round(params.amount * 100)

      const response = await api.post('', {
        ...orderData,
        charges: [
          {
            reference_id: params.orderId,
            description: 'Pedido Better Food',
            amount: {
              value: amountInCents,
              currency: 'BRL',
            },
            payment_method: {
              type: 'CREDIT_CARD',
              installments: 1,
              capture: true,
              card: {
                encrypted: params.card.encrypted,
                store: false,
              },
              holder: {
                name: params.card.holder.name,
              },
            },
          },
        ],
      })

      return response.data
    } catch (error) {
      return this.handleError(error)
    }
  }
}
