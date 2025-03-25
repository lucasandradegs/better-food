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
  pixFormSchema,
  type PixFormData,
} from '@/contexts/PaymentContext'
import { useEffect } from 'react'

const removeSpecialCharacters = (value: string) => {
  return value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').replace(/\s+/g, ' ')
}

interface QRCodeLink {
  rel: string
  href: string
  media: string
  type: string
}

interface PixPaymentResult {
  id: string
  qr_codes: Array<{
    id: string
    text: string
    amount: {
      value: number
    }
    links: QRCodeLink[]
  }>
}

export function PixForm() {
  const {
    order,
    finalAmount,
    setFormData,
    setSubmitForm,
    setIsFormValid,
    setPaymentStatus,
    setPaymentMessage,
  } = usePayment()

  const form = useForm<Omit<PixFormData, 'paymentMethod' | 'orderDetails'>>({
    resolver: zodResolver(
      pixFormSchema.omit({ paymentMethod: true, orderDetails: true }),
    ),
    defaultValues: {
      name: '',
      email: '',
      cpf: '',
      ddd: '',
      phone: '',
    },
    mode: 'all',
  })

  const onSubmit = async (
    data: Omit<PixFormData, 'paymentMethod' | 'orderDetails'>,
  ): Promise<PixPaymentResult> => {
    if (!order) throw new Error('Pedido não encontrado')

    try {
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
          unit_amount: Math.round(item.unit_price * 100), // Convertendo para centavos
        })),
        orderDetails: {
          orderId: order.id,
          amount: finalAmount,
        },
      }

      const response = await fetch('/api/create-pix-payment', {
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

      setPaymentStatus('success')
      setPaymentMessage('QR Code PIX gerado com sucesso!')

      const fullData = {
        ...data,
        paymentMethod: 'PIX' as const,
        orderDetails: {
          orderId: order.id,
          amount: finalAmount,
          items: order.items,
        },
      } as PixFormData

      setFormData(fullData)

      return responseData
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      setPaymentStatus('error')
      setPaymentMessage('Erro ao processar pagamento. Tente novamente.')
      throw error
    }
  }

  useEffect(() => {
    const { isDirty, isValid } = form.formState

    setIsFormValid(isDirty && isValid)
  }, [form.formState, setIsFormValid])

  useEffect(() => {
    const handleFormSubmit = async () => {
      try {
        const formData = form.getValues()
        return await onSubmit(formData)
      } catch (error) {
        console.error('Erro ao enviar formulário:', error)
        throw error
      }
    }
    // @ts-expect-error O form está funcionando corretamente desse jeito.
    setSubmitForm(() => handleFormSubmit)
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
                    className="text-base lg:text-sm"
                    onChange={(e) => {
                      const sanitizedValue = removeSpecialCharacters(
                        e.target.value,
                      )
                      field.onChange(sanitizedValue)
                      form.trigger('name')
                    }}
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
                    onChange={(e) => {
                      field.onChange(e)
                      form.trigger('email')
                    }}
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
                    onAccept={(value) => {
                      field.onChange(value)
                      form.trigger('cpf')
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
              name="ddd"
              render={({ field }) => (
                <FormItem className="w-20">
                  <FormLabel className="text-xs">DDD</FormLabel>
                  <FormControl>
                    <MaskedInput
                      mask="00"
                      placeholder="11"
                      onAccept={(value) => {
                        field.onChange(value)
                        form.trigger('ddd')
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
              name="phone"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-xs">Telefone</FormLabel>
                  <FormControl>
                    <MaskedInput
                      mask="00000-0000"
                      placeholder="99999-9999"
                      onAccept={(value) => {
                        field.onChange(value)
                        form.trigger('phone')
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
