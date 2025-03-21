'use client'

import { usePayment } from '@/contexts/PaymentContext'
import { Button } from '../ui/button'
import { CreditCard, Lock, ShoppingBag } from 'lucide-react'
import Pix from '@/public/pix'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import creditCardAnimation from '@/public/creditCard.json'
import pixAnimation from '@/public/pix.json'
import checkAnimation from '@/public/check.json'
import errorAnimation from '@/public/error.json'
import { useMediaQuery } from '@/utils/useMediaQuery'
import { PixQRCode } from '../CheckoutPaymentForm/PixQRCode'
import Link from 'next/link'

interface QRCodeLink {
  rel: string
  href: string
  media: string
  type: string
}

interface ErrorResponse {
  error: string
  details: {
    error_messages: Array<{
      code: string
      description: string
      parameter_name: string
    }>
  }
}

interface ErrorMessages {
  [key: string]:
    | {
        [key: string]: {
          title: string
          message: string
        }
      }
    | {
        title: string
        message: string
      }
}

export default function CheckoutPayButton() {
  const {
    paymentMethod,
    submitForm,
    isFormValid,
    paymentStatus,
    setPaymentStatus,
    initialPixData,
  } = usePayment()
  const [isDialogOpen, setIsDialogOpen] = useState(!!initialPixData)
  const [pixData, setPixData] = useState<{
    qrCodeUrl: string
    qrCodeText: string
    amount: number
  } | null>(() => {
    if (initialPixData && initialPixData.qr_codes?.[0]) {
      const qrCode = initialPixData.qr_codes[0]
      const qrCodeUrl = qrCode.links.find(
        (link: QRCodeLink) => link.media === 'image/png',
      )?.href

      if (qrCodeUrl) {
        return {
          qrCodeUrl,
          qrCodeText: qrCode.text,
          amount: qrCode.amount.value / 100,
        }
      }
    }
    return null
  })
  const [error, setError] = useState<ErrorResponse | null>(null)
  const isMobile = useMediaQuery('(max-width: 360px)')

  const creditCardPayment = paymentMethod === 'CREDIT_CARD'
  const pixPayment = paymentMethod === 'PIX'

  const handlePayment = async () => {
    try {
      setIsDialogOpen(true)
      setPaymentStatus('processing')
      setError(null)

      if (submitForm) {
        const result = await submitForm()

        if (pixPayment && result?.qr_codes?.[0]) {
          const qrCode = result.qr_codes[0]
          const qrCodeUrl = qrCode.links.find(
            (link: QRCodeLink) => link.media === 'image/png',
          )?.href

          if (!qrCodeUrl) {
            throw new Error('URL do QR Code não encontrada')
          }

          setPixData({
            qrCodeUrl,
            qrCodeText: qrCode.text,
            amount: qrCode.amount.value / 100,
          })

          setPaymentStatus('success')
        }
      }
    } catch (error) {
      console.error('Erro no pagamento:', error)
      setPaymentStatus('error')
      if (error && typeof error === 'object' && 'error' in error) {
        setError(error as ErrorResponse)
      }
    }
  }

  const getAnimationData = () => {
    switch (paymentStatus) {
      case 'processing':
        return paymentMethod === 'CREDIT_CARD'
          ? creditCardAnimation
          : pixAnimation
      case 'success':
        return checkAnimation
      case 'error':
        return errorAnimation
    }
  }

  const getDialogContent = () => {
    const errorMessages: ErrorMessages = {
      '40002': {
        'customer.tax_id': {
          title: 'CPF Inválido 😓',
          message:
            'Por favor, verifique se o CPF foi digitado corretamente e tente novamente.',
        },
      },
      '40401': {
        title: 'Cartão Recusado 😓',
        message:
          'O pagamento foi recusado pelo banco emissor do cartão. Por favor, tente outro cartão ou método de pagamento.',
      },
      '40400': {
        title: 'Cartão Inválido 😓',
        message:
          'Os dados do cartão são inválidos. Por favor, verifique os dados e tente novamente.',
      },
      '40303': {
        title: 'Saldo Insuficiente 😓',
        message:
          'O cartão não possui saldo suficiente para realizar a compra. Por favor, tente outro cartão ou método de pagamento.',
      },
      '10002': {
        title: 'Pagamento não autorizado 😓',
        message:
          'O pagamento foi recusado pelo emissor do cartão. Por favor, tente outro cartão ou método de pagamento.',
      },
    }

    if (!paymentStatus) {
      return {
        title: '',
        message: '',
      }
    }

    switch (paymentStatus) {
      case 'processing':
        return {
          title:
            paymentMethod === 'CREDIT_CARD'
              ? isMobile
                ? '💳 Processando...'
                : '💳 Processando seu pagamento...'
              : '✨ Gerando seu PIX...',
          message:
            paymentMethod === 'CREDIT_CARD'
              ? 'Estamos processando seu pagamento. Por favor, aguarde.'
              : 'Estamos gerando seu QR Code PIX. Em instantes você poderá realizar o pagamento.',
        }
      case 'success':
        return {
          title: pixPayment
            ? 'QR Code PIX gerado! 🎉'
            : 'Pagamento realizado com sucesso! 🎉',
          message: pixPayment
            ? 'Escaneie o QR Code ou copie o código para realizar o pagamento.'
            : 'Seu pedido foi confirmado e está sendo preparado.',
        }
      case 'error': {
        const defaultError = {
          title: 'Ops! Algo deu errado 😓',
          message:
            'Não foi possível processar seu pagamento. Por favor, tente novamente.',
        }

        if (error?.details?.error_messages?.[0]) {
          const errorData = error.details.error_messages[0]
          const errorCode = errorData.code
          const parameterName = errorData.parameter_name

          if (errorCode === '40002' && parameterName) {
            const taxIdError = errorMessages['40002'] as {
              [key: string]: { title: string; message: string }
            }
            return taxIdError[parameterName] || defaultError
          }

          const genericError = errorMessages[errorCode] as {
            title: string
            message: string
          }
          return genericError || defaultError
        }

        return defaultError
      }
      default:
        return {
          title: '',
          message: '',
        }
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <Button
          className="mt-6 w-full text-xs"
          onClick={handlePayment}
          disabled={!isFormValid || !submitForm}
        >
          {creditCardPayment && (
            <div className="flex items-center gap-2">
              <span>Pagar com Cartão de Crédito</span>
              <CreditCard className="h-4 w-4" />
            </div>
          )}
          {pixPayment && (
            <div className="flex items-center gap-2">
              <span>Pagar com Pix</span>
              <Pix width={16} height={16} color="#FFF" />
            </div>
          )}
        </Button>
        <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
          Ambiente seguro BetterFood <Lock className="h-3 w-3" />
        </p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="w-[90%] rounded-lg dark:bg-[#262626] sm:max-w-md [&>button]:hidden"
          onInteractOutside={(e) => {
            if (paymentStatus === 'processing' || paymentStatus === 'success') {
              e.preventDefault()
            }
          }}
          onEscapeKeyDown={(e) => {
            if (paymentStatus === 'processing' || paymentStatus === 'success') {
              e.preventDefault()
            }
          }}
        >
          <div
            className={`flex flex-col items-center justify-center ${
              paymentStatus === 'success' && pixPayment && pixData
                ? 'p-4 max-[400px]:p-0'
                : 'p-4'
            }`}
          >
            {paymentStatus === 'success' && pixPayment && pixData ? (
              <>
                <DialogTitle className="sr-only">
                  QR Code PIX gerado! 🎉
                </DialogTitle>
                <PixQRCode
                  qrCodeUrl={pixData.qrCodeUrl}
                  qrCodeText={pixData.qrCodeText}
                  amount={pixData.amount}
                />
              </>
            ) : (
              <>
                <Lottie
                  animationData={getAnimationData()}
                  loop={paymentStatus === 'processing'}
                  style={{ width: 200, height: 200 }}
                />
                <DialogTitle className="text-center text-base font-semibold md:text-lg">
                  {getDialogContent().title}
                </DialogTitle>
                <p className="mt-2 text-center text-xs text-muted-foreground md:text-sm">
                  {getDialogContent().message}
                </p>
                {paymentStatus !== 'processing' &&
                  !pixData &&
                  (paymentStatus === 'success' ? (
                    <Link href="/pedidos" className="w-full">
                      <Button className="mt-4 w-full">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Ver meus pedidos
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => setIsDialogOpen(false)}
                      className="mt-4 w-full"
                    >
                      Tentar novamente
                    </Button>
                  ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
