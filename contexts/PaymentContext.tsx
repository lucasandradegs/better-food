/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { z } from 'zod'

type PaymentMethod = 'CREDIT_CARD' | 'PIX'

export interface OrderDetails {
  orderId: string
  amount: number
  items: any[]
}

// Base form data com os campos comuns
const baseFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  ddd: z.string().length(2, 'DDD deve ter 2 dígitos'),
  phone: z.string().regex(/^\d{5}-\d{4}$/, 'Telefone inválido'),
})

// Schemas específicos para cada método de pagamento
export const pixFormSchema = baseFormSchema.extend({
  paymentMethod: z.literal('PIX').optional(),
  orderDetails: z
    .object({
      orderId: z.string(),
      amount: z.number(),
      items: z.array(z.any()),
    })
    .optional(),
})

export const creditCardFormSchema = baseFormSchema.extend({
  paymentMethod: z.literal('CREDIT_CARD').optional(),
  orderDetails: z
    .object({
      orderId: z.string(),
      amount: z.number(),
      items: z.array(z.any()),
    })
    .optional(),
  cardNumber: z
    .string()
    .regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, 'Número do cartão inválido'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Data inválida'),
  cvv: z.string().regex(/^\d{3}$/, 'CVV inválido'),
  cardToken: z.string().optional(),
})

export type PixFormData = z.infer<typeof pixFormSchema>
export type CreditCardFormData = z.infer<typeof creditCardFormSchema>
export type PaymentFormData = PixFormData | CreditCardFormData

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product: {
    name: string
    image_url: string | null
  }
}

interface Order {
  id: string
  total_amount: number
  status: Database['public']['Enums']['order_status']
  items: OrderItem[]
  discount_amount: number
}

interface QRCodeLink {
  rel: string
  href: string
  media: string
  type: string
}

interface PixPaymentResult {
  qr_code: {
    text: string
    amount: {
      value: number
    }
    links: QRCodeLink[]
  }
}

interface PaymentContextType {
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  order: Order | null
  isLoading: boolean
  finalAmount: number
  formData: PaymentFormData | null
  setFormData: (data: PaymentFormData | null) => void
  submitForm: (() => Promise<PixPaymentResult | any>) | null
  setSubmitForm: (
    submit: (() => Promise<PixPaymentResult | any>) | null,
  ) => void
  isFormValid: boolean
  setIsFormValid: (valid: boolean) => void
  paymentStatus: 'processing' | 'success' | 'error' | null
  setPaymentStatus: (status: 'processing' | 'success' | 'error' | null) => void
  paymentMessage: string | null
  setPaymentMessage: (message: string | null) => void
  initialPixData?: any
  orderStatus: 'paid' | 'pending' | null
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

export function PaymentProvider({
  children,
  orderId,
}: {
  children: React.ReactNode
  orderId: string | null
}) {
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('CREDIT_CARD')
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<PaymentFormData | null>(null)
  const [submitForm, setSubmitForm] = useState<
    (() => Promise<PixPaymentResult | any>) | null
  >(null)
  const [isFormValid, setIsFormValid] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<
    'processing' | 'success' | 'error' | null
  >(null)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [initialPixData, setInitialPixData] = useState<any>(null)
  const [orderStatus, setOrderStatus] = useState<'paid' | 'pending' | null>(
    null,
  )
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    async function fetchOrderAndPayment() {
      if (!orderId) {
        setIsLoading(false)
        return
      }

      try {
        // Buscar informações do pedido
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id, total_amount, status, discount_amount')
          .eq('id', orderId)
          .single()

        if (orderError) throw orderError

        // Buscar informações do pagamento
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .single()

        if (paymentError && paymentError.code !== 'PGRST116') {
          console.error('Erro ao buscar pagamento:', paymentError)
        }

        // Verificar status do pedido
        if (orderData.status === 'paid') {
          setOrderStatus('paid')
          setIsLoading(false)
          return
        }

        // Verificar se existe pagamento PIX pendente
        if (
          payment?.payment_method === 'PIX' &&
          payment?.status === 'PENDING'
        ) {
          setInitialPixData(payment.response_data)
          setPaymentMethod('PIX')
          setPaymentStatus('success')
        }

        // Buscar itens do pedido
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(
            `
            *,
            product:products (
              name,
              image_url
            )
          `,
          )
          .eq('order_id', orderId)

        if (itemsError) throw itemsError

        setOrder({
          ...orderData,
          items: itemsData,
        })
        setOrderStatus('pending')
      } catch (error) {
        console.error('Erro ao buscar pedido:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderAndPayment()
  }, [orderId, supabase])

  // Calcula o valor final considerando o desconto do PIX e do cupom
  const finalAmount = order
    ? paymentMethod === 'PIX'
      ? order.total_amount * 0.95
      : order.total_amount
    : 0

  return (
    <PaymentContext.Provider
      value={{
        paymentMethod,
        setPaymentMethod,
        order,
        isLoading,
        finalAmount,
        formData,
        setFormData,
        submitForm,
        setSubmitForm,
        isFormValid,
        setIsFormValid,
        paymentStatus,
        setPaymentStatus,
        paymentMessage,
        setPaymentMessage,
        initialPixData,
        orderStatus,
      }}
    >
      {children}
    </PaymentContext.Provider>
  )
}

export function usePayment() {
  const context = useContext(PaymentContext)
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider')
  }
  return context
}
