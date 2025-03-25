'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'
import { MaskedInput } from '../ui/masked-input'
import {
  usePayment,
  creditCardFormSchema,
  type CreditCardFormData,
} from '@/contexts/PaymentContext'
import { useEffect } from 'react'
import { PagBankService } from '@/services/pagbank'

const removeSpecialCharacters = (value: string) => {
  return value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').replace(/\s+/g, ' ')
}

export function CreditCardForm() {
  const {
    order,
    finalAmount,
    setFormData,
    setSubmitForm,
    setIsFormValid,
    setPaymentStatus,
    setPaymentMessage,
  } = usePayment()

  const form = useForm<
    Omit<CreditCardFormData, 'paymentMethod' | 'orderDetails'>
  >({
    resolver: zodResolver(
      creditCardFormSchema.omit({ paymentMethod: true, orderDetails: true }),
    ),
    defaultValues: {
      name: '',
      email: '',
      cpf: '',
      ddd: '',
      phone: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
    mode: 'all',
  })

  const onSubmit = async (
    data: Omit<CreditCardFormData, 'paymentMethod' | 'orderDetails'>,
  ) => {
    if (!order) return

    try {
      const [expiryMonth, expiryYear] = data.expiryDate.split('/')

      const pagbankService = PagBankService.getInstance()

      const cardToken = await pagbankService.createCardToken({
        number: data.cardNumber,
        expiryMonth,
        expiryYear: `20${expiryYear}`,
        cvv: data.cvv,
        holder: data.name,
      })

      // Criar pedido no PagBank através do backend
      const orderData = {
        customer: {
          name: data.name,
          email: data.email,
          tax_id: data.cpf.replace(/\D/g, ''),
          phones: [
            {
              country: '55',
              area: data.ddd,
              number: data.phone.replace(/\D/g, ''),
              type: 'MOBILE' as const,
            },
          ],
        },
        items: order.items.map((item) => ({
          reference_id: item.id,
          name: item.product.name,
          quantity: item.quantity,
          unit_amount: Math.round(item.unit_price * 100),
        })),
        charges: [
          {
            reference_id: `charge-${order.id}`,
            description: `Pedido #${order.id}`,
            amount: {
              value: Math.round(finalAmount * 100),
              currency: 'BRL' as const,
            },
            payment_method: {
              type: 'CREDIT_CARD' as const,
              installments: 1,
              capture: true,
              soft_descriptor: `MUITAFOME`,
              card: {
                encrypted: cardToken,
                store: false,
              },
              holder: {
                name: data.name,
                tax_id: data.cpf.replace(/\D/g, ''),
              },
            },
          },
        ],
      }

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        setPaymentStatus('error')
        throw responseData
      }

      if (responseData.paymentStatus === 'PAID') {
        setPaymentStatus('success')
        setPaymentMessage('Pagamento realizado com sucesso!')
      } else if (responseData.paymentStatus === 'DECLINED') {
        setPaymentStatus('error')
        throw responseData
      } else {
        setPaymentStatus('error')
        throw new Error('Erro no processamento do pagamento')
      }

      const fullData = {
        ...data,
        paymentMethod: 'CREDIT_CARD' as const,
        orderDetails: {
          orderId: order.id,
          amount: finalAmount,
          items: order.items,
        },
        cardToken,
      } as CreditCardFormData & { cardToken: string }

      setFormData(fullData)
    } catch (error) {
      console.error('Erro ao processar cartão:', error)
      setPaymentStatus('error')
      setPaymentMessage(
        error instanceof Error ? error.message : 'Falha ao processar o cartão',
      )
      throw error
    }
  }

  useEffect(() => {
    const { isDirty, isValid } = form.formState

    setIsFormValid(isDirty && isValid)
  }, [form.formState, setIsFormValid])

  useEffect(() => {
    // @ts-expect-error O form está funcionando corretamente desse jeito.
    setSubmitForm(() => form.handleSubmit(onSubmit))
    return () => setSubmitForm(null)
  }, [setSubmitForm, form])

  return (
    <Form {...form}>
      <form className="">
        <h1 className="text-sm font-medium">Preencha seus dados</h1>
        <div className="mt-4 flex flex-col gap-2 rounded-md border p-4 dark:border-[#343434]">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Nome completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Lucas Andrade"
                    {...field}
                    onChange={(e) => {
                      const sanitizedValue = removeSpecialCharacters(
                        e.target.value,
                      )
                      field.onChange(sanitizedValue)
                    }}
                    className="text-base lg:text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="exemplo@email.com"
                    type="email"
                    {...field}
                    className="text-base lg:text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">CPF</FormLabel>
                <FormControl>
                  <MaskedInput
                    mask="000.000.000-00"
                    placeholder="000.000.000-00"
                    onAccept={(value) => field.onChange(value)}
                    {...field}
                    className="text-base lg:text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="ddd"
              render={({ field }) => (
                <FormItem className="w-20">
                  <FormLabel className="text-xs">DDD</FormLabel>
                  <FormControl>
                    <MaskedInput
                      mask="00"
                      placeholder="11"
                      onAccept={(value) => field.onChange(value)}
                      {...field}
                      className="text-base lg:text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-xs">Telefone</FormLabel>
                  <FormControl>
                    <MaskedInput
                      mask="00000-0000"
                      placeholder="99999-9999"
                      onAccept={(value) => field.onChange(value)}
                      {...field}
                      className="text-base lg:text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="cardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Número do cartão</FormLabel>
                <FormControl>
                  <MaskedInput
                    mask="0000 0000 0000 0000"
                    placeholder="1234 1234 1234 1234"
                    onAccept={(value) => {
                      field.onChange(value)
                      form.trigger('cardNumber')
                    }}
                    {...field}
                    className="text-base lg:text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-xs">Validade</FormLabel>
                  <FormControl>
                    <MaskedInput
                      mask="00/00"
                      placeholder="MM/AA"
                      onAccept={(value) => {
                        field.onChange(value)
                        form.trigger('expiryDate')
                      }}
                      {...field}
                      className="text-base lg:text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cvv"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-xs">CVV</FormLabel>
                  <FormControl>
                    <MaskedInput
                      mask="000"
                      placeholder="123"
                      onAccept={(value) => {
                        field.onChange(value)
                        form.trigger('cvv')
                      }}
                      {...field}
                      className="text-base lg:text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  )
}
