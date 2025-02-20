'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
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
  customer: {
    email: string
  }
  discount_amount: number
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

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const supabase = createClientComponentClient<Database>()

  console.log(orders)

  useEffect(() => {
    async function checkUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.role === 'admin')
    }

    checkUserRole()
  }, [supabase])

  useEffect(() => {
    async function fetchOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      try {
        if (isAdmin) {
          const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .eq('admin_id', user.id)
            .single()

          if (storeError) {
            console.error('Erro ao buscar loja:', storeError)
            toast.error('Erro ao buscar informações da loja')
            setLoading(false)
            return
          }

          if (!storeData) {
            console.warn('Nenhuma loja encontrada para este administrador')
            setLoading(false)
            return
          }

          // Primeiro buscar os pedidos
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select(
              `
              *,
              items:order_items (
                *,
                product:products (*)
              ),
              payments (*),
              store:stores (
                name,
                logo_url
              )
            `,
            )
            .eq('store_id', storeData.id)
            .order('created_at', { ascending: false })

          if (ordersError) {
            console.error('Erro ao buscar pedidos:', ordersError)
            toast.error('Erro ao carregar os pedidos')
            setLoading(false)
            return
          }

          if (ordersData) {
            // Depois buscar os emails dos clientes
            const userIds = [
              ...new Set(ordersData.map((order) => order.user_id)),
            ] // Remove duplicados
            const { data: customersData, error: customersError } =
              await supabase
                .from('profiles')
                .select('id, email')
                .in('id', userIds)

            if (customersError) {
              console.error(
                'Erro ao buscar dados dos clientes:',
                customersError,
              )
              toast.error('Erro ao carregar informações dos clientes')
              setLoading(false)
              return
            }

            // Combinar os dados com verificação de null
            const ordersWithCustomers = ordersData.map((order) => ({
              ...order,
              customer: customersData?.find(
                (customer) => customer.id === order.user_id,
              ) ?? {
                id: order.user_id,
                email: 'Email não encontrado',
              },
            }))

            setOrders(ordersWithCustomers as Order[])
          }
        } else {
          // Construir a query base
          const query = supabase.from('orders').select(
            `
              *,
              items:order_items (
                *,
                product:products (*)
              ),
              payments (*),
              store:stores (
                name,
                logo_url
              ),
              customer:profiles (
                email
              )
            `,
          )

          const { data: ordersData, error: ordersError } = await query
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (ordersError) {
            console.error('Erro ao buscar pedidos:', ordersError)
            return
          }

          setOrders(ordersData as Order[])
        }

        setLoading(false)
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        setLoading(false)
      }
    }

    async function initializeRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let channel: ReturnType<typeof supabase.channel>
      if (isAdmin) {
        const getStoreId = async () => {
          const { data: storeData } = await supabase
            .from('stores')
            .select('id')
            .eq('admin_id', user.id)
            .single()
          return storeData?.id
        }

        getStoreId().then((storeId) => {
          if (!storeId) return

          channel = supabase
            .channel('orders-admin')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `store_id=eq.${storeId}`,
              },
              async (payload) => {
                if (payload.eventType === 'UPDATE') {
                  // Buscar o pedido atualizado com todas as informações
                  const { data: updatedOrder } = await supabase
                    .from('orders')
                    .select(
                      `
                      *,
                      items:order_items (
                        *,
                        product:products (*)
                      ),
                      payments (*),
                      store:stores (
                        name,
                        logo_url
                      ),
                      customer:profiles (
                        email
                      )
                    `,
                    )
                    .eq('id', payload.new.id)
                    .single()

                  if (updatedOrder) {
                    setOrders((prevOrders) =>
                      prevOrders.map((order) =>
                        order.id === payload.new.id
                          ? (updatedOrder as Order)
                          : order,
                      ),
                    )
                  }
                }
              },
            )
            .subscribe()
        })
      } else {
        channel = supabase
          .channel('orders-customer')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `user_id=eq.${user.id}`,
            },
            async (payload) => {
              if (payload.eventType === 'UPDATE') {
                // Buscar o pedido atualizado com todas as informações
                const { data: updatedOrder } = await supabase
                  .from('orders')
                  .select(
                    `
                    *,
                    items:order_items (
                      *,
                      product:products (*)
                    ),
                    payments (*),
                    store:stores (
                      name,
                      logo_url
                    ),
                    customer:profiles (
                      email
                    )
                  `,
                  )
                  .eq('id', payload.new.id)
                  .single()

                if (updatedOrder) {
                  setOrders((prevOrders) =>
                    prevOrders.map((order) =>
                      order.id === payload.new.id
                        ? (updatedOrder as Order)
                        : order,
                    ),
                  )
                }
              }
            },
          )
          .subscribe()
      }

      return () => {
        if (channel) {
          channel.unsubscribe()
        }
      }
    }

    fetchOrders()
    initializeRealtime()
  }, [supabase, isAdmin])

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter, paymentFilter, dateFilter])

  const filterOrders = () => {
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

    setFilteredOrders(filtered)
  }

  async function handleStatusUpdate(
    orderId: string,
    newStatus: Database['public']['Enums']['order_status'],
  ) {
    if (!isAdmin) {
      toast.error('Apenas administradores podem atualizar o status do pedido')
      return
    }

    setUpdating(orderId)

    try {
      // Verificar se o usuário é admin novamente
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        throw new Error('Permissão negada')
      }

      // Atualizar o status no banco de dados
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Erro ao atualizar:', updateError)
        throw updateError
      }

      // Buscar o pedido atualizado com todas as informações necessárias
      const { data: updatedOrderData, error: fetchError } = await supabase
        .from('orders')
        .select(
          `
          *,
          items:order_items (
            *,
            product:products (*)
          ),
          payments (*),
          store:stores (
            name,
            logo_url
          )
        `,
        )
        .eq('id', orderId)
        .single()

      if (fetchError) {
        console.error('Erro ao buscar pedido atualizado:', fetchError)
        throw fetchError
      }

      // Buscar informações do cliente
      const { data: customerData, error: customerError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', updatedOrderData.user_id)
        .single()

      if (customerError) {
        console.error('Erro ao buscar dados do cliente:', customerError)
        throw customerError
      }

      // Combinar os dados do pedido com os dados do cliente
      const updatedOrder = {
        ...updatedOrderData,
        customer: customerData,
      }

      // Atualizar o estado local mantendo os outros pedidos
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? updatedOrder : order,
        ),
      )

      // Criar notificação para o cliente
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: updatedOrder.user_id,
          title: 'Status do pedido atualizado',
          description: `Seu pedido agora está ${orderStatusMap[newStatus].label.toLowerCase()}.`,
          status: 'unread',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (notificationError) {
        console.error('Erro ao criar notificação:', notificationError)
      }

      toast.success('Status do pedido atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar status do pedido',
      )
    } finally {
      setUpdating(null)
    }
  }

  console.log(orders)

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="mb-6 h-10 w-1/4" />
        <div className="space-y-4">
          <Skeleton className="mb-4 h-8 w-full" />
          <Skeleton className="h-[73px] w-full" />
        </div>
      </div>
    )
  }

  // Se for admin, mostra a tabela
  if (isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="mb-6 text-2xl font-bold">Gerenciar Pedidos</h1>

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
                      disabled={updating === order.id}
                    >
                      {ALLOWED_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {orderStatusMap[status].label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Se for cliente, mostra os cards
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">Meus Pedidos</h1>

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
