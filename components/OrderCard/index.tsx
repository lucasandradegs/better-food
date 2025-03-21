/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import {
  Package2,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Star,
  ConstructionIcon,
} from 'lucide-react'
import Pix from '@/public/pix'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, cn } from '@/lib/utils'
import Link from 'next/link'
import { Database } from '@/lib/database.types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { OrderRatingDialog } from '../OrderRatingDialog'

const ALLOWED_STATUS_OPTIONS: Database['public']['Enums']['order_status'][] = [
  'paid',
  'pending',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
  'refunded',
]

type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product: {
    name: string
    image_url: string | null
  }
}

type Payment = {
  id: string
  order_id: string
  pagbank_id: string
  amount: number
  status: 'PENDING' | 'PAID' | 'DECLINED' | 'CANCELED' | 'REFUNDED'
  payment_method: 'CREDIT_CARD' | 'PIX'
  created_at: string
  updated_at: string
}

type Order = {
  id: string
  user_id: string
  store_id: string
  admin_id: string
  status: Database['public']['Enums']['order_status']
  total_amount: number
  created_at: string
  updated_at: string
  items: OrderItem[]
  payments: Payment[]
  store: {
    name: string
    logo_url: string | null
  }
  discount_amount: number
  customer: {
    email: string
  }
  total: number
}
// @ts-expect-error its working
type OrderRating = Database['public']['Tables']['order_ratings']['Row']

const orderStatusMap: Record<
  Database['public']['Enums']['order_status'],
  { label: string; icon: React.ElementType; className: string; color: string }
> = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    color: 'bg-yellow-500',
    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  processing: {
    label: 'Processando',
    icon: Package2,
    color: 'bg-blue-500',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  paid: {
    label: 'Pago',
    icon: CreditCard,
    color: 'bg-green-500',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  preparing: {
    label: 'Preparando',
    icon: Package2,
    color: 'bg-blue-300',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  ready: {
    label: 'Pronto',
    icon: CheckCircle2,
    color: 'bg-indigo-500',
    className:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  },
  delivered: {
    label: 'Entregue',
    icon: CheckCircle2,
    color: 'bg-green-700',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  cancelled: {
    label: 'Cancelado',
    icon: AlertCircle,
    color: 'bg-red-500',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  refunded: {
    label: 'Reembolsado',
    icon: AlertCircle,
    color: 'bg-red-500',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  delivering: {
    label: 'Em entrega',
    icon: Package2,
    color: 'bg-orange-500',
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
}

interface OrderCardProps {
  order: Order
  isAdmin?: boolean
  onStatusUpdate?: (
    orderId: string,
    newStatus: Database['public']['Enums']['order_status'],
  ) => void
  updating?: boolean
  handleOpenCancelModal?: (order: Order) => void
}

function StatusDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          color,
        )}
      />
      <span
        className={cn('relative inline-flex h-2 w-2 rounded-full', color)}
      />
    </span>
  )
}

export function OrderCard({
  order,
  isAdmin,
  onStatusUpdate,
  updating,
  handleOpenCancelModal,
}: OrderCardProps) {
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [hasRating, setHasRating] = useState(false)
  const [isCheckingRating, setIsCheckingRating] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const checkOrderRating = async () => {
      const { data } = await supabase
        .from('order_ratings')
        .select()
        .eq('order_id', order.id)
        .single()

      setHasRating(!!data)
      setIsCheckingRating(false)
    }

    if (order.status === 'delivered') {
      checkOrderRating()
    } else {
      setIsCheckingRating(false)
    }
  }, [order.id, order.status, supabase])

  const paymentStatus = order.payments[0]?.status || 'PENDING'
  const paymentMethod = order.payments[0]?.payment_method
  const isCancelled =
    order.status === 'cancelled' || order.status === 'refunded'

  const handleRatingSubmitted = () => {
    setHasRating(true)
  }

  return (
    <Card className="flex w-full min-w-0 flex-col dark:border-[#343434] dark:bg-[#232323]">
      <CardHeader className="flex flex-col gap-2 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">
              Pedido #{order.id.slice(0, 8)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={
              paymentStatus === 'PAID'
                ? 'shrink-0 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                : 'shrink-0 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            }
          >
            {paymentStatus === 'PAID' ? 'PAGO' : 'PENDENTE'}
          </Badge>
        </div>
        <Badge
          variant="secondary"
          className={`flex w-fit items-center gap-2 ${orderStatusMap[order.status].className}`}
        >
          <StatusDot color={orderStatusMap[order.status].color} />
          <span className="text-xs font-medium">
            {orderStatusMap[order.status].label}
          </span>
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">
                  {item.quantity}x {item.product.name}
                </p>
              </div>
              <p className="shrink-0 text-xs tabular-nums">
                {formatCurrency(item.total_price)}
              </p>
            </div>
          ))}
          <Separator className="my-1" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Subtotal:</span>
              <span className="shrink-0 text-xs tabular-nums">
                {formatCurrency(
                  order.items.reduce((acc, item) => acc + item.total_price, 0),
                )}
              </span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Desconto do cupom:</span>
                <span className="shrink-0 tabular-nums text-green-600 dark:text-green-400">
                  -{formatCurrency(order.discount_amount)}
                </span>
              </div>
            )}
            {order.payments[0]?.payment_method === 'PIX' && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Desconto do PIX (5%):</span>
                <span className="shrink-0 tabular-nums text-green-600 dark:text-green-400">
                  -
                  {formatCurrency(
                    (order.total_amount - order.discount_amount) * 0.05,
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total:</span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatCurrency(
                  order.payments[0]?.payment_method === 'PIX'
                    ? order.total_amount -
                        order.discount_amount -
                        (order.total_amount - order.discount_amount) * 0.05
                    : order.total_amount - order.discount_amount,
                )}
              </span>
            </div>
          </div>
          {paymentMethod && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="max-[420px]:hidden">Método de pagamento:</span>
              <span className="hidden max-[420px]:block">Pagamento:</span>
              <span className="flex shrink-0 items-center gap-2">
                {paymentMethod === 'CREDIT_CARD' ? (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Cartão de Crédito
                  </>
                ) : (
                  <>
                    <Pix width={14} height={14} color="currentColor" />
                    PIX
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col gap-4">
        <div className="flex w-full flex-col gap-2 rounded-lg border p-4 dark:border-[#343434]">
          <div className="flex items-center gap-2">
            <Package2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h4 className="min-w-0 truncate text-sm font-medium max-[420px]:hidden">
              {isAdmin
                ? 'Informações do Cliente'
                : 'Informações do estabelecimento'}
            </h4>
            <h4 className="hidden text-xs max-[420px]:block">
              {isAdmin ? 'Cliente' : 'Estabelecimento'}
            </h4>
          </div>
          {isAdmin ? (
            <div className="flex flex-col gap-1">
              <p className="truncate text-xs font-medium">
                {order.customer.email}
              </p>
              <p className="text-xs text-muted-foreground">
                ID: {order.user_id.slice(0, 8)}
              </p>
              {!isCancelled && (
                <div className="mt-2">
                  <select
                    className="w-full rounded border p-1 text-sm disabled:opacity-50 dark:border-[#343434] dark:bg-[#1c1c1c]"
                    value={order.status}
                    onChange={(e) =>
                      onStatusUpdate?.(
                        order.id,
                        e.target
                          .value as Database['public']['Enums']['order_status'],
                      )
                    }
                    disabled={updating}
                  >
                    {ALLOWED_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {orderStatusMap[status].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {paymentStatus === 'PAID' && !isCancelled && (
                <div className="mt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleOpenCancelModal?.(order)}
                    className="w-full text-xs"
                  >
                    Cancelar Pagamento
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="truncate text-xs font-medium">{order.store.name}</p>
          )}
        </div>

        <div className="flex w-full gap-2">
          {paymentStatus === 'PENDING' && !isAdmin && (
            <Link href={`/checkout?orderId=${order.id}`} className="flex-1">
              <Button className="w-full">Pagar Pedido</Button>
            </Link>
          )}
          {order.status === 'delivered' &&
          !isCheckingRating &&
          !hasRating &&
          !isAdmin ? (
            <Button
              onClick={() => setIsRatingDialogOpen(true)}
              className="flex-1 gap-2"
            >
              <Star className="h-4 w-4" />
              Avaliar Pedido
            </Button>
          ) : null}
        </div>
      </CardFooter>

      <OrderRatingDialog
        orderId={order.id}
        storeId={order.store_id}
        storeName={order.store.name}
        isOpen={isRatingDialogOpen}
        onClose={() => setIsRatingDialogOpen(false)}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </Card>
  )
}
