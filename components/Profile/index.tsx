import {
  MapPin,
  ShoppingBag,
  Star,
  Heart,
  Mail,
  DollarSign,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { Skeleton } from '@/components/ui/skeleton'
import NumberFlow from '@number-flow/react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, cn } from '@/lib/utils'

interface ProfileDetailsProps {
  name: string
  email: string
  image: string
}

type OrderWithStore = Database['public']['Tables']['orders']['Row'] & {
  store: Pick<
    Database['public']['Tables']['stores']['Row'],
    'name' | 'logo_url'
  >
  items: Array<{
    product: Pick<Database['public']['Tables']['products']['Row'], 'name'>
  }>
}

type AdminStats = {
  totalOrders: number
  totalRevenue: number
  averageRating: number
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  topCustomers: Array<{
    email: string
    orders: number
    total_spent: number
  }>
  recentOrders: OrderWithStore[]
}

type CustomerStats = {
  totalOrders: number
  averageRating: number
  favoriteStores: number
  userLevel: string
  nextLevel: number
  progress: number
  recentOrders: OrderWithStore[]
}

const orderStatusMap: Record<
  Database['public']['Enums']['order_status'],
  { label: string; color: string }
> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  processing: { label: 'Processando', color: 'bg-blue-500' },
  paid: { label: 'Pago', color: 'bg-green-500' },
  preparing: { label: 'Preparando', color: 'bg-blue-300' },
  ready: { label: 'Pronto', color: 'bg-blue-500' },
  delivered: { label: 'Entregue', color: 'bg-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
  refunded: { label: 'Reembolsado', color: 'bg-red-500' },
  delivering: { label: 'Em entrega', color: 'bg-orange-500' },
}

export default function ProfileDetails({
  name,
  email,
  image,
}: ProfileDetailsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null)
  const supabase = createClientComponentClient<Database>()
  const { userProfile } = useAuth()

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('admin_id', userProfile?.id)
          .single()

        if (!storeData) return null

        // Total de pedidos e receita
        const { data: orders } = await supabase
          .from('orders')
          .select('*, payments!inner(*)')
          .eq('store_id', storeData.id)
          .eq('payments.status', 'PAID')
          .not('status', 'eq', 'cancelled')
          .not('status', 'eq', 'refunded')

        // Avaliação média
        const { data: ratings } = await supabase
          .from('order_ratings')
          .select('rating, food_rating')
          .eq('store_id', storeData.id)

        // Produtos mais vendidos
        const { data: topProducts } = await supabase.rpc('get_top_products', {
          store_id_param: storeData.id,
          limit_param: 5,
        })

        // Clientes mais frequentes
        const { data: topCustomers } = await supabase.rpc('get_top_customers', {
          store_id_param: storeData.id,
          limit_param: 5,
        })

        // Pedidos recentes
        const { data: recentOrders } = await supabase
          .from('orders')
          .select(
            `
            *,
            store:stores!inner (
              name,
              logo_url
            ),
            items:order_items!inner (
              product:products!inner (
                name
              )
            )
          `,
          )
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false })
          .limit(3)

        const totalRevenue =
          orders?.reduce((acc, order) => acc + order.total_amount, 0) || 0
        const avgRating = ratings?.length
          ? ratings.reduce(
              (acc, curr) => (curr.rating + curr.food_rating) / 2 + acc,
              0,
            ) / ratings.length
          : 0

        return {
          totalOrders: orders?.length || 0,
          totalRevenue,
          averageRating: Number(avgRating.toFixed(1)),
          topProducts: topProducts || [],
          topCustomers: topCustomers || [],
          recentOrders: (recentOrders as OrderWithStore[]) || [],
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas do admin:', error)
        return null
      }
    }

    const fetchCustomerStats = async () => {
      try {
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*, payments!inner(*)', { count: 'exact', head: true })
          .eq('user_id', userProfile?.id)
          .eq('payments.status', 'PAID')
          .not('status', 'eq', 'cancelled')
          .not('status', 'eq', 'refunded')

        const { data: ratings } = await supabase
          .from('order_ratings')
          .select('rating, food_rating, delivery_rating')
          .eq('user_id', userProfile?.id)

        const { count: favoritesCount } = await supabase
          .from('favorite_stores')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userProfile?.id)

        const { data: recentOrders } = await supabase
          .from('orders')
          .select(
            `
            *,
            store:stores!inner (
              name,
              logo_url
            ),
            items:order_items!inner (
              product:products!inner (
                name
              )
            )
          `,
          )
          .eq('user_id', userProfile?.id)
          .in('status', [
            'paid',
            'delivered',
            'preparing',
            'ready',
            'delivering',
          ])
          .order('created_at', { ascending: false })
          .limit(5)

        const totalOrders = ordersCount || 0
        const avgRating = ratings?.length
          ? ratings.reduce((acc, curr) => {
              const orderAvg =
                (curr.rating + curr.food_rating + curr.delivery_rating) / 3
              return acc + orderAvg
            }, 0) / ratings.length
          : 0

        // Calcula o nível do usuário
        const userLevel =
          totalOrders < 50 ? 'Bronze' : totalOrders < 100 ? 'Prata' : 'Ouro'
        const nextLevel =
          userLevel === 'Bronze' ? 50 : userLevel === 'Prata' ? 100 : 200
        const progress = (totalOrders / nextLevel) * 100

        return {
          totalOrders,
          averageRating: Number(avgRating.toFixed(1)),
          favoriteStores: favoritesCount || 0,
          userLevel,
          nextLevel,
          progress,
          recentOrders: recentOrders || [],
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas do cliente:', error)
        return null
      }
    }

    const fetchProfileData = async () => {
      try {
        setIsLoading(true)

        if (userProfile?.role === 'admin') {
          const adminData = await fetchAdminStats()
          setAdminStats(adminData)
          setCustomerStats(null)
        } else {
          const customerData = await fetchCustomerStats()
          setCustomerStats(customerData)
          setAdminStats(null)
        }
      } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userProfile?.id) {
      fetchProfileData()
    }
  }, [supabase, userProfile?.id, userProfile?.role])

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (userProfile?.role === 'admin' && adminStats) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Header */}
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-[#262626]">
            <div className="relative h-32 bg-gradient-to-r from-red-500 to-red-800">
              <div className="absolute -bottom-12 left-4">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-[#161616] dark:bg-[#161616]">
                  <AvatarImage src={image} alt={name} />
                  <AvatarFallback>{name[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="px-4 pb-6 pt-16 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {name}
                  </h1>
                  <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-300">
                    <MapPin className="mr-1 h-4 w-4" />
                    Timoteo, MG
                  </p>
                  <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300">
                    <Mail className="mr-1 h-4 w-4" />
                    {email}
                  </p>
                </div>
                <Button>Editar Perfil</Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="dark:bg-[#262626]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-white">
                  Total de Pedidos
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">
                  <NumberFlow
                    value={adminStats.totalOrders}
                    format={{ maximumFractionDigits: 0 }}
                    defaultValue={0}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-[#262626]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-white">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">
                  {formatCurrency(adminStats.totalRevenue)}
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-[#262626]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-white">
                  Avaliação Média
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">
                  <NumberFlow
                    value={adminStats.averageRating}
                    format={{ maximumFractionDigits: 1 }}
                    defaultValue={0}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card className="dark:bg-[#262626]">
            <CardHeader>
              <CardTitle className="text-lg font-bold dark:text-white">
                Produtos Mais Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminStats.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 dark:border-[#363636]"
                  >
                    <div>
                      <p className="text-xs font-medium dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {product.quantity} vendidos
                      </p>
                    </div>
                    <p className="text-xs font-medium dark:text-white">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="dark:bg-[#262626]">
            <CardHeader>
              <CardTitle className="text-lg font-bold dark:text-white">
                Clientes Mais Frequentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminStats.topCustomers.map((customer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 dark:border-[#363636]"
                  >
                    <div>
                      <p className="text-xs font-medium dark:text-white">
                        {customer.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {customer.orders} pedidos
                      </p>
                    </div>
                    <p className="text-xs font-medium dark:text-white">
                      {formatCurrency(customer.total_spent)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="dark:bg-[#262626]">
            <CardHeader>
              <CardTitle className="text-lg font-bold dark:text-white">
                Pedidos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {adminStats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 dark:border-[#363636]"
                  >
                    <div>
                      <p className="text-xs font-medium dark:text-white">
                        Pedido #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    </div>
                    <p className="text-xs font-medium dark:text-white">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (customerStats) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Header */}
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-[#262626]">
            <div className="relative h-32 bg-gradient-to-r from-red-500 to-red-800">
              <div className="absolute -bottom-12 left-4">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-[#161616] dark:bg-[#161616]">
                  <AvatarImage src={image} alt={name} />
                  <AvatarFallback>{name[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="px-4 pb-6 pt-16 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {name}
                  </h1>
                  <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-300">
                    <MapPin className="mr-1 h-4 w-4" />
                    Timoteo, MG
                  </p>
                  <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300">
                    <Mail className="mr-1 h-4 w-4" />
                    {email}
                  </p>
                </div>
                <Button>Editar Perfil</Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="dark:bg-[#262626]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-white">
                  Total de Pedidos
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">
                  <NumberFlow
                    value={customerStats.totalOrders}
                    format={{ maximumFractionDigits: 0 }}
                    defaultValue={0}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-[#262626]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-white">
                  Avaliação Média
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">
                  <NumberFlow
                    value={customerStats.averageRating}
                    format={{ maximumFractionDigits: 1 }}
                    defaultValue={0}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-[#262626]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-white">
                  Restaurantes Favoritos
                </CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">
                  <NumberFlow
                    value={customerStats.favoriteStores}
                    format={{ maximumFractionDigits: 0 }}
                    defaultValue={0}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Level */}
          <Card className="dark:bg-[#262626]">
            <CardHeader>
              <CardTitle className="text-lg font-bold dark:text-white">
                Nível do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
                >
                  {customerStats.userLevel}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {customerStats.totalOrders} / {customerStats.nextLevel}{' '}
                  pedidos
                </span>
              </div>
              <Progress value={customerStats.progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="dark:bg-[#262626]">
            <CardHeader>
              <CardTitle className="text-lg font-bold dark:text-white">
                Pedidos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerStats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={order.store.logo_url || ''}
                        alt={order.store.name}
                      />
                      <AvatarFallback>{order.store.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium leading-none dark:text-white">
                          {order.store.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'h-4 py-0 text-[10px]',
                            order.status === 'delivered' &&
                              'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-400',
                            order.status === 'preparing' &&
                              'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-400',
                            order.status === 'ready' &&
                              'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-400',
                            order.status === 'delivering' &&
                              'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-400',
                            order.status === 'paid' &&
                              'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-400',
                          )}
                        >
                          {orderStatusMap[order.status].label}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {order.items
                          .map((item) => item.product.name)
                          .join(', ')}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    </div>
                    <div className="text-xs font-medium dark:text-white">
                      {formatCurrency(order.total_amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-[#262626]">
          <div className="relative h-32 animate-pulse bg-gray-200 dark:bg-[#262626]" />
          <div className="px-4 pb-6 pt-16 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="dark:bg-[#262626]">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="dark:bg-[#262626]">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#262626]">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
