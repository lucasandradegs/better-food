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
import {
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrdersSubscription } from '@/hooks/useOrdersSubscription'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  total: number
  observations?: string | null
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

interface PaymentResponseData {
  charges: Array<{ id: string; amount?: { value: number } }>
}

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [cancelOrderData, setCancelOrderData] = useState<Order | null>(null)
  const [isProcessingRefund, setIsProcessingRefund] = useState(false)
  const queryClient = useQueryClient()

  // Buscar pedidos
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  })

  const orders = data?.orders || []
  const isAdmin = data?.isAdmin || false

  const ITEMS_PER_PAGE = useMemo(() => {
    return viewMode === 'table' ? 10 : 9
  }, [viewMode])

  // Carregar preferência de visualização
  useEffect(() => {
    if (isAdmin) {
      const savedViewMode = localStorage.getItem('ordersViewMode')
      if (savedViewMode === 'table' || savedViewMode === 'cards') {
        setViewMode(savedViewMode)
      }
    } else {
      setViewMode('cards')
    }
  }, [isAdmin])

  // Configurar inscrição real-time
  useOrdersSubscription(isAdmin)

  // Mutation para atualizar status
  const { mutate: updateStatus } = useMutation({
    mutationFn: updateOrderStatus,
    onMutate: async ({ orderId, newStatus }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['orders'] })

      // Snapshot do estado anterior
      const previousOrders = queryClient.getQueryData(['orders'])

      // Atualizar o cache otimisticamente
      queryClient.setQueryData(
        ['orders'],
        (old: OrdersResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            orders: old.orders.map((order) =>
              order.id === orderId ? { ...order, status: newStatus } : order,
            ),
          }
        },
      )

      return { previousOrders }
    },
    onError: (error, variables, context) => {
      // Em caso de erro, reverter para o estado anterior
      queryClient.setQueryData(['orders'], context?.previousOrders)
      console.error('Erro ao atualizar status:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar status do pedido',
      )
    },
    onSuccess: () => {
      toast.success('Status do pedido atualizado com sucesso')
    },
  })

  // Salvar preferência de visualização
  const handleViewModeChange = (newMode: 'table' | 'cards') => {
    setViewMode(newMode)
    setCurrentPage(1)
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

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)

  // Obter pedidos da página atual
  const currentOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, currentPage, ITEMS_PER_PAGE])

  // Resetar página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, paymentFilter, dateFilter])

  // Componente de paginação
  const Pagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="mt-4 flex items-center justify-between border-t pt-4 dark:border-[#343434]">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <span>•</span>
          <span>
            {filteredOrders.length}{' '}
            {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="dark:border-[#343434] dark:bg-[#232323]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="dark:border-[#343434] dark:bg-[#232323]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  async function handlePaymentCancellation(orderId: string, payment: Payment) {
    try {
      setIsProcessingRefund(true)
      // Primeiro convertemos para unknown e depois para o tipo específico
      const responseData = (
        typeof payment.response_data === 'string'
          ? JSON.parse(payment.response_data)
          : payment.response_data
      ) as PaymentResponseData | null
      const chargeId = responseData?.charges?.[0]?.id
      const amount = responseData?.charges?.[0]?.amount?.value

      if (!chargeId) {
        throw new Error('Não foi possível encontrar o ID da transação')
      }

      if (!amount) {
        throw new Error('Não foi possível encontrar o valor da transação')
      }

      const response = await fetch('/api/cancel-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chargeId,
          amount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao cancelar pagamento')
      }

      // Se o cancelamento do pagamento for bem-sucedido, atualiza o status do pedido
      await updateStatus({ orderId, newStatus: 'cancelled' })
      toast.success('Pagamento cancelado com sucesso')
      setCancelOrderData(null) // Fecha o modal após o cancelamento
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao cancelar pagamento',
      )
    } finally {
      setIsProcessingRefund(false)
    }
  }

  // Função para abrir o modal de cancelamento
  const handleOpenCancelModal = (order: Order) => {
    const payment = order.payments[0]
    if (payment && payment.status === 'PAID') {
      setCancelOrderData(order)
    }
  }

  async function handleStatusUpdate(
    orderId: string,
    newStatus: Database['public']['Enums']['order_status'],
  ) {
    if (!isAdmin) {
      toast.error('Apenas administradores podem atualizar o status do pedido')
      return
    }

    // Se o novo status for 'cancelled', primeiro tenta cancelar o pagamento
    if (newStatus === 'cancelled') {
      const order = orders.find((o) => o.id === orderId)
      const payment = order?.payments[0]

      if (payment && payment.status === 'PAID') {
        await handlePaymentCancellation(orderId, payment)
        return
      }
    }

    updateStatus({ orderId, newStatus })
  }

  // Modal component
  const CancelOrderModal = () => {
    if (!cancelOrderData) return null

    const order = cancelOrderData

    return (
      <Dialog
        open={!!cancelOrderData}
        onOpenChange={() => !isProcessingRefund && setCancelOrderData(null)}
      >
        <DialogContent className="dark:border-[#343434] dark:bg-[#1c1c1c] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar cancelamento do pedido</DialogTitle>
            <DialogDescription>
              Você está prestes a cancelar o seguinte pedido:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Detalhes do Pedido:</p>
              <p className="text-sm text-muted-foreground">
                ID: {order.id.slice(0, 8)}
              </p>
              <p className="text-sm text-muted-foreground">
                Cliente: {order.customer.email}
              </p>
              <p className="text-sm text-muted-foreground">
                Valor: {formatCurrency(order.total_amount)}
              </p>
              <div className="text-sm text-muted-foreground">
                Itens:
                {order.items.map((item) => (
                  <div key={item.id} className="ml-2">
                    • {item.quantity}x {item.product.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm font-semibold text-destructive">Atenção:</p>
              <p className="text-sm text-destructive">
                Esta ação não pode ser desfeita e o valor será estornado para o
                cliente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOrderData(null)}
              disabled={isProcessingRefund}
            >
              Fechar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                handlePaymentCancellation(order.id, order.payments[0])
              }
              disabled={isProcessingRefund}
            >
              {isProcessingRefund ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Processando...
                </>
              ) : (
                'Realizar reembolso'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
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
                {currentOrders.map((order) => (
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
                        {order.observations && (
                          <div className="mt-1 text-xs italic text-muted-foreground">
                            <span className="font-medium">Obs:</span>{' '}
                            {order.observations}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        order.payments[0]?.payment_method === 'PIX'
                          ? order.payments[0]?.amount
                          : order.total_amount,
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          order.payments[0]?.status === 'PAID'
                            ? 'bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-800'
                            : order.payments[0]?.status === 'CANCELED'
                              ? 'bg-red-100 text-red-900 hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-800'
                              : 'bg-yellow-100 text-yellow-900 hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:hover:bg-yellow-800',
                          'text-xs',
                        )}
                      >
                        {order.payments[0]?.status === 'PAID'
                          ? 'Pago'
                          : order.payments[0]?.status === 'CANCELED'
                            ? 'Cancelado'
                            : 'Pendente'}
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
                      {order.status !== 'cancelled' &&
                      order.status !== 'refunded' ? (
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
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {order.payments[0]?.status === 'PAID' &&
                        order.status !== 'cancelled' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOpenCancelModal(order)}
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
            <div className="p-4">
              <Pagination />
            </div>
          </div>
        ) : (
          <div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isAdmin={isAdmin}
                  onStatusUpdate={handleStatusUpdate}
                  handleOpenCancelModal={handleOpenCancelModal}
                />
              ))}
            </div>
            <Pagination />
          </div>
        )}
        <CancelOrderModal />
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

      <div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isAdmin={isAdmin}
              onStatusUpdate={handleStatusUpdate}
              handleOpenCancelModal={handleOpenCancelModal}
            />
          ))}
        </div>
        <Pagination />
      </div>
    </div>
  )
}
