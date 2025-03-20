'use client'

import { useEffect, useState, useMemo } from 'react'
import { Database } from '@/lib/database.types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OrderCard } from '@/components/OrderCard'
import { LayoutGrid, Table as TableIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrdersSubscription } from '@/hooks/useOrdersSubscription'

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
  response_data?: string
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
  customer: {
    email: string
  }
  discount_amount: number
}

type OrdersResponse = {
  orders: Order[]
  isAdmin: boolean
}

const orderStatusMap: Record<
  Database['public']['Enums']['order_status'],
  { label: string; color: string; orderBgColor: string }
> = {
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-500',
    orderBgColor:
      'dark:bg-yellow-950 bg-yellow-100 text-yellow-900 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800',
  },
  processing: {
    label: 'Processando',
    color: 'bg-blue-500',
    orderBgColor:
      'dark:bg-blue-950 bg-blue-100 text-blue-900 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800',
  },
  paid: {
    label: 'Pago',
    color: 'bg-green-500',
    orderBgColor:
      'dark:bg-green-950 bg-green-100 text-green-900 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800',
  },
  preparing: {
    label: 'Preparando',
    color: 'bg-blue-300',
    orderBgColor:
      'dark:bg-blue-950 bg-blue-100 text-blue-900 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800',
  },
  ready: {
    label: 'Pronto',
    color: 'bg-blue-500',
    orderBgColor:
      'dark:bg-indigo-950 bg-indigo-100 text-indigo-900 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800',
  },
  delivered: {
    label: 'Entregue',
    color: 'bg-green-700',
    orderBgColor:
      'dark:bg-green-950 bg-green-100 text-green-900 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-500',
    orderBgColor:
      'dark:bg-red-950 bg-red-100 text-red-900 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800',
  },
  refunded: {
    label: 'Reembolsado',
    color: 'bg-red-500',
    orderBgColor:
      'dark:bg-red-950 bg-red-100 text-red-900 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800',
  },
  delivering: {
    label: 'Em entrega',
    color: 'bg-orange-500',
    orderBgColor:
      'dark:bg-orange-950 bg-orange-100 text-orange-900 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800',
  },
}

// Opções de status permitidas para atualização
const ALLOWED_STATUS_OPTIONS: Database['public']['Enums']['order_status'][] = [
  'paid',
  'pending',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
  'refunded',
]

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

const fetchOrders = async (): Promise<OrdersResponse> => {
  const response = await fetch('/api/orders')
  if (!response.ok) {
    throw new Error('Erro ao buscar pedidos')
  }
  const data = await response.json()
  return data
}

const updateOrderStatus = async ({
  orderId,
  newStatus,
}: {
  orderId: string
  newStatus: Database['public']['Enums']['order_status']
}) => {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newStatus }),
  })

  if (!response.ok) {
    throw new Error('Erro ao atualizar status')
  }

  return response.json()
}

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const queryClient = useQueryClient()

  // Carregar preferência de visualização
  useEffect(() => {
    const savedViewMode = localStorage.getItem('ordersViewMode')
    if (savedViewMode === 'table' || savedViewMode === 'cards') {
      setViewMode(savedViewMode)
    }
  }, [])

  // Buscar pedidos
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  })

  const orders = data?.orders || []
  const isAdmin = data?.isAdmin || false

  // Configurar inscrição real-time
  useOrdersSubscription(isAdmin)

  // Mutation para atualizar status
  const { mutate: updateStatus } = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Status do pedido atualizado com sucesso')
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar status do pedido',
      )
    },
  })

  // Salvar preferência de visualização
  const handleViewModeChange = (newMode: 'table' | 'cards') => {
    setViewMode(newMode)
    localStorage.setItem('ordersViewMode', newMode)
  }

  // Filtrar pedidos usando useMemo
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Filtro de pagamento
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(
        (order) => order.payments[0]?.status === paymentFilter,
      )
    }

    // Filtro de data
    const now = new Date()
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7))
      filtered = filtered.filter(
        (order) => new Date(order.created_at) >= sevenDaysAgo,
      )
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))
      filtered = filtered.filter(
        (order) => new Date(order.created_at) >= thirtyDaysAgo,
      )
    }

    return filtered
  }, [orders, statusFilter, paymentFilter, dateFilter])

  async function handleStatusUpdate(
    orderId: string,
    newStatus: Database['public']['Enums']['order_status'],
  ) {
    if (!isAdmin) {
      toast.error('Apenas administradores podem atualizar o status do pedido')
      return
    }

    updateStatus({ orderId, newStatus })
  }

  if (isLoading) {
    return (
      <div className="">
        <Skeleton className="mb-6 h-10 w-1/4" />
        <div className="space-y-4">
          <Skeleton className="mb-4 h-8 w-full" />
          <Skeleton className="h-[73px] w-full" />
        </div>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className="">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight dark:text-white">
            Gerenciar Pedidos
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleViewModeChange(viewMode === 'table' ? 'cards' : 'table')
            }
            className="gap-2 dark:border-[#343434] dark:bg-[#232323]"
          >
            {viewMode === 'table' ? (
              <>
                <LayoutGrid className="h-4 w-4" />
                Ver em Cards
              </>
            ) : (
              <>
                <TableIcon className="h-4 w-4" />
                Ver em Tabela
              </>
            )}
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full dark:border-[#343434] lg:w-[180px]">
              <SelectValue placeholder="Status do Pedido" />
            </SelectTrigger>
            <SelectContent className="dark:border-[#343434] dark:bg-[#1c1c1c]">
              <SelectItem value="all">Todos os Status</SelectItem>
              {ALLOWED_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {orderStatusMap[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full dark:border-[#343434] lg:w-[180px]">
              <SelectValue placeholder="Status do Pagamento" />
            </SelectTrigger>
            <SelectContent className="dark:border-[#343434] dark:bg-[#1c1c1c]">
              <SelectItem value="all">Todos os Pagamentos</SelectItem>
              <SelectItem value="PAID">Pago</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full dark:border-[#343434] lg:w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="dark:border-[#343434] dark:bg-[#1c1c1c]">
              <SelectItem value="all">Todo Período</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {viewMode === 'table' ? (
          <div className="rounded-md border dark:border-[#343434]">
            <Table className="text-xs">
              <TableHeader className="dark:border-[#343434]">
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status do Pagamento</TableHead>
                  <TableHead>Status do Pedido</TableHead>
                  <TableHead>Ações</TableHead>
                  <TableHead>Cancelamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs font-medium">
                      {order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        <span>{order?.customer?.email}</span>
                        <span className="text-muted-foreground">
                          ID: {order?.user_id?.slice(0, 8)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        {order.items.map((item, index) => (
                          <div key={item.id} className="text-xs">
                            {item.quantity}x {item.product.name}
                            {index < order.items.length - 1 && ', '}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          order.payments[0]?.status === 'PAID'
                            ? 'bg-teal-100 dark:bg-teal-950'
                            : 'bg-yellow-100 dark:bg-yellow-950',
                          order.payments[0]?.status === 'PAID'
                            ? 'text-teal-800 dark:text-teal-400'
                            : 'text-yellow-800 dark:text-yellow-400',
                          order.payments[0]?.status === 'PAID'
                            ? 'hover:bg-teal-200 dark:hover:bg-teal-800'
                            : 'hover:bg-yellow-200 dark:hover:bg-yellow-800',
                          'text-xs',
                        )}
                      >
                        {order.payments[0]?.status === 'PAID'
                          ? 'PAGO'
                          : 'PENDENTE'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`flex items-center gap-2 ${orderStatusMap[order.status].orderBgColor} w-fit`}
                      >
                        <StatusDot color={orderStatusMap[order.status].color} />
                        <span className="text-xs font-medium">
                          {orderStatusMap[order.status].label}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <select
                        className="rounded border p-1 text-sm disabled:opacity-50 dark:border-[#343434] dark:bg-[#1c1c1c]"
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(
                            order.id,
                            e.target
                              .value as Database['public']['Enums']['order_status'],
                          )
                        }
                      >
                        {ALLOWED_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {orderStatusMap[status].label}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      {order.payments[0]?.status === 'PAID' &&
                        order.status !== 'cancelled' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, 'cancelled')
                            }
                            className="text-xs"
                          >
                            Cancelar Pagamento
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isAdmin={true}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Se for cliente, mostra os cards
  return (
    <div className="">
      <h1 className="mb-6 text-lg font-bold tracking-tight dark:text-white">
        Meus Pedidos
      </h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full dark:border-[#343434] lg:w-[180px]">
            <SelectValue placeholder="Status do Pedido" />
          </SelectTrigger>
          <SelectContent className="dark:border-[#343434] dark:bg-[#1c1c1c]">
            <SelectItem value="all">Todos os Status</SelectItem>
            {ALLOWED_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {orderStatusMap[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full dark:border-[#343434] lg:w-[180px]">
            <SelectValue placeholder="Status do Pagamento" />
          </SelectTrigger>
          <SelectContent className="dark:border-[#343434] dark:bg-[#1c1c1c]">
            <SelectItem value="all">Todos os Pagamentos</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full dark:border-[#343434] lg:w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent className="dark:border-[#343434] dark:bg-[#1c1c1c]">
            <SelectItem value="all">Todo Período</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}
