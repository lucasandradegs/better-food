import Image from 'next/image'
import { Copy, Check, ShoppingBag } from 'lucide-react'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import { useState } from 'react'
import Link from 'next/link'

interface PixQRCodeProps {
  qrCodeUrl: string
  qrCodeText: string
  amount: number
}

export function PixQRCode({ qrCodeUrl, qrCodeText, amount }: PixQRCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyQRCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000) // Remove a mensagem após 3 segundos
    } catch (error) {
      console.error('Erro ao copiar código:', error)
      toast.error('Erro ao copiar código', {
        description: 'Tente copiar manualmente.',
      })
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg p-3 sm:gap-4 sm:p-4">
      <h2 className="text-center text-base font-semibold sm:text-lg">
        Quase lá! 🤩
      </h2>
      <p className="text-center text-xs text-muted-foreground sm:text-sm">
        Escaneie o QR Code abaixo ou copie o código PIX para realizar o
        pagamento
      </p>
      <div className="relative h-52 w-52 sm:h-64 sm:w-64">
        <Image
          src={qrCodeUrl}
          alt="QR Code PIX"
          fill
          className="rounded-lg"
          priority
        />
      </div>
      <p className="text-center text-xs font-medium sm:text-sm">
        Valor a pagar: R$ {amount.toFixed(2)}
      </p>
      <div className="flex w-full flex-col gap-1.5 sm:gap-2">
        <Button
          onClick={handleCopyQRCode}
          className="h-9 w-full bg-muted/30 text-xs text-black hover:bg-muted/50 dark:bg-[#363636] dark:text-white dark:hover:bg-[#363636]/50 sm:h-10 sm:text-sm"
          disabled={copied}
        >
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5 text-green-500 sm:mr-2 sm:h-4 sm:w-4" />
              Código copiado!
            </>
          ) : (
            <>
              <Copy className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              Copiar código PIX
            </>
          )}
        </Button>
        {copied && (
          <p className="text-center text-xs text-green-500 sm:text-sm">
            ✨ Código PIX copiado com sucesso!
          </p>
        )}
      </div>
      <p className="text-center text-[10px] text-muted-foreground sm:text-xs">
        O QR Code expira em 24 horas
      </p>

      <div className="mt-2 flex w-full flex-col gap-1.5 border-t pt-3 text-center text-xs text-muted-foreground sm:mt-3 sm:gap-2 sm:pt-4 sm:text-sm">
        <p>Já realizou o pagamento?</p>
        <Link href="/pedidos" className="w-full">
          <Button
            variant="default"
            className="h-9 w-full text-xs sm:h-10 sm:text-sm"
          >
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
            Ver meus pedidos
          </Button>
        </Link>
      </div>
    </div>
  )
}
