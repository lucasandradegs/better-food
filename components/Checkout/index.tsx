'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { OrderService } from '@/lib/orders'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { CreditCard, QrCode } from 'lucide-react'

const formSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    taxId: z
      .string()
      .min(11, 'CPF deve ter 11 dígitos')
      .max(11, 'CPF deve ter 11 dígitos')
      .regex(/^\d+$/, 'CPF deve conter apenas números'),
    phone: z.object({
      area: z
        .string()
        .length(2, 'DDD deve ter 2 dígitos')
        .regex(/^\d+$/, 'DDD deve conter apenas números'),
      number: z
        .string()
        .min(8, 'Número deve ter entre 8 e 9 dígitos')
        .max(9, 'Número deve ter entre 8 e 9 dígitos')
        .regex(/^\d+$/, 'Número deve conter apenas números'),
    }),
    paymentMethod: z.enum(['pix', 'credit_card']),
    card: z
      .object({
        number: z.string().regex(/^\d{16}$/, 'Número do cartão inválido'),
        exp_month: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido'),
        exp_year: z.string().regex(/^\d{4}$/, 'Ano inválido'),
        security_code: z.string().regex(/^\d{3}$/, 'CVV inválido'),
        holder: z.object({
          name: z.string().min(3, 'Nome do titular inválido'),
        }),
      })
      .optional(),
  })
  .refine((data) => {
    if (data.paymentMethod === 'credit_card') {
      return !!data.card
    }
    return true
  }, 'Dados do cartão são obrigatórios')

type FormData = z.infer<typeof formSchema>

interface CheckoutDialogProps {
  open: boolean
  onClose: () => void
}

export function CheckoutDialog({ open, onClose }: CheckoutDialogProps) {
  const [loading, setLoading] = useState(false)
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'pix' | 'credit_card'
  >('pix')
  const { items, clearCart } = useCart()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const orderService = new OrderService()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      taxId: '',
      phone: {
        area: '',
        number: '',
      },
      paymentMethod: 'pix',
      card: undefined,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        email: '',
        taxId: '',
        phone: {
          area: '',
          number: '',
        },
        paymentMethod: 'pix',
        card: undefined,
      })
      setSelectedPaymentMethod('pix')
      setPixCode(null)
      setQrCodeUrl(null)
      setOrderId(null)
      setPaymentSuccess(false)
    }
  }, [open, form])

  const handlePaymentMethodChange = (method: 'pix' | 'credit_card') => {
    setSelectedPaymentMethod(method)
    form.setValue('paymentMethod', method, { shouldValidate: true })
    form.clearErrors()

    // Limpa os estados do PIX quando trocar de método
    setPixCode(null)
    setQrCodeUrl(null)
    setOrderId(null)

    if (method === 'pix') {
      form.setValue('card', undefined, { shouldValidate: true })
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true)
    clearCart()

    // Fecha o diálogo após 3 segundos
    setTimeout(() => {
      onClose()
      setPaymentSuccess(false)
    }, 3000)
  }

  const onSubmit = async (data: FormData) => {
    if (!userProfile?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para finalizar a compra',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      if (data.paymentMethod === 'pix') {
        const result = await orderService.createOrder({
          userId: userProfile.id,
          items,
          customerData: data,
          paymentMethod: 'pix',
        })

        console.log('Resposta do PagBank:', result)

        if (!result.qr_codes?.[0]) {
          throw new Error('QR Code não gerado')
        }

        // Encontra a URL do QR code PNG
        const qrCodePngLink = result.qr_codes[0].links.find(
          (link: { rel: string; href: string }) => link.rel === 'QRCODE.PNG',
        )

        if (!qrCodePngLink) {
          throw new Error('URL do QR Code não encontrada')
        }

        setPixCode(result.qr_codes[0].text)
        setQrCodeUrl(qrCodePngLink.href)
        setOrderId(result.id)
        clearCart()
      } else {
        if (!data.card) {
          toast({
            title: 'Erro',
            description: 'Dados do cartão são obrigatórios',
            variant: 'destructive',
          })
          return
        }

        await orderService.createOrder({
          userId: userProfile.id,
          items,
          customerData: data,
          paymentMethod: 'credit_card',
          card: data.card,
        })

        handlePaymentSuccess()
      }
    } catch (error) {
      console.error('Erro ao processar pedido:', error)
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível processar seu pedido. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px] dark:bg-[#262626]">
        <DialogHeader>
          <DialogTitle>
            {paymentSuccess ? 'Pagamento Confirmado!' : 'Finalizar Pedido'}
          </DialogTitle>
          <DialogDescription>
            {paymentSuccess
              ? 'Seu pedido foi processado com sucesso'
              : 'Preencha seus dados para finalizar o pedido'}
          </DialogDescription>
        </DialogHeader>

        {paymentSuccess ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="rounded-full bg-green-100 p-3">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Pagamento realizado com sucesso!
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Você receberá uma notificação quando seu pedido estiver pronto.
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Esta janela será fechada automaticamente em alguns segundos...
              </p>
            </div>
          </div>
        ) : pixCode && qrCodeUrl ? (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-medium">Pague com PIX</h3>
            <p className="text-center text-sm text-gray-500">
              Escaneie o QR Code ou copie o código PIX abaixo para pagar
            </p>
            <div className="relative h-64 w-64">
              <Image
                src={qrCodeUrl}
                alt="QR Code PIX"
                fill
                className="object-contain"
              />
            </div>
            <div className="w-full">
              <p className="mb-2 text-center text-sm font-medium">
                Código PIX (clique para copiar)
              </p>
              <Button
                variant="outline"
                className="h-auto w-full whitespace-normal break-all py-4 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(pixCode)
                  toast({
                    title: 'Código copiado!',
                    description:
                      'O código PIX foi copiado para sua área de transferência',
                  })
                }}
              >
                {pixCode}
              </Button>
            </div>
            <p className="mt-4 text-center text-sm text-gray-500">
              O QR Code expira em 24 horas. Após o pagamento, você receberá uma
              notificação de confirmação.
            </p>
            {process.env.NODE_ENV === 'development' && orderId && (
              <div className="mt-4 rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Ambiente de Desenvolvimento
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Este é um ambiente de testes. Para simular o pagamento,
                        acesse o{' '}
                        <a
                          href="https://devportal.pagseguro.com.br/simulador"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-yellow-800 underline hover:text-yellow-900"
                        >
                          simulador do PagBank
                        </a>{' '}
                        e use o código de referência:{' '}
                        <span className="font-mono">{orderId}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="joao@exemplo.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12345678900"
                        maxLength={11}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone.area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DDD</FormLabel>
                      <FormControl>
                        <Input placeholder="11" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone.number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="987654321"
                          maxLength={9}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Método de Pagamento</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={
                      selectedPaymentMethod === 'pix' ? 'default' : 'outline'
                    }
                    className="w-full"
                    onClick={() => handlePaymentMethodChange('pix')}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    PIX
                  </Button>
                  <Button
                    type="button"
                    variant={
                      selectedPaymentMethod === 'credit_card'
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full"
                    onClick={() => handlePaymentMethodChange('credit_card')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Cartão
                  </Button>
                </div>
              </div>

              {selectedPaymentMethod === 'credit_card' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="card.number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Cartão</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="4111 1111 1111 1111"
                            maxLength={16}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="card.exp_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mês</FormLabel>
                          <FormControl>
                            <Input placeholder="MM" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="card.exp_year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="AAAA"
                              maxLength={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="card.security_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl>
                            <Input placeholder="123" maxLength={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="card.holder.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome no Cartão</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome como está no cartão"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? 'Processando...'
                  : selectedPaymentMethod === 'pix'
                    ? 'Pagar com PIX'
                    : 'Pagar com Cartão'}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
