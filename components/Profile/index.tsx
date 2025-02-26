import { MapPin, ShoppingBag, Star, Heart, Mail } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import NumberFlow from '@number-flow/react'
import { useAuth } from '@/contexts/AuthContext'

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

export default function ProfileDetails({
  name,
  email,
  image,
}: ProfileDetailsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [totalOrders, setTotalOrders] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [favoriteStores, setFavoriteStores] = useState(0)
  const [recentOrders, setRecentOrders] = useState<OrderWithStore[]>([])
  const supabase = createClientComponentClient<Database>()
  const { userProfile } = useAuth()

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true)

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

        const avgRating = ratings?.length
          ? ratings.reduce((acc, curr) => {
              // Média das três avaliações para cada pedido
              const orderAvg =
                (curr.rating + curr.food_rating + curr.delivery_rating) / 3
              return acc + orderAvg
            }, 0) / ratings.length
          : 0

        const { count: favoritesCount } = await supabase
          .from('favorite_stores')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userProfile?.id)

        const { data: orders } = await supabase
          .from('orders')
          .select(
            `
            id,
            created_at,
            total_amount,
            status,
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
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(3)

        setTotalOrders(ordersCount || 0)
        setAverageRating(Number(avgRating.toFixed(1)))
        setFavoriteStores(favoritesCount || 0)
        // @ts-expect-error its working
        if (orders) setRecentOrders(orders as OrderWithStore[])
      } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userProfile?.id) {
      fetchProfileData()
    }
  }, [supabase, userProfile?.id])

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-[#262626]">
            <div className="relative h-32 animate-pulse bg-gray-200 dark:bg-gray-800" />
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

  // Calcula o nível do usuário baseado no total de pedidos
  const userLevel =
    totalOrders < 50 ? 'Bronze' : totalOrders < 100 ? 'Prata' : 'Ouro'
  const nextLevel =
    userLevel === 'Bronze' ? 50 : userLevel === 'Prata' ? 100 : 200
  const progress = (totalOrders / nextLevel) * 100

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-3xl space-y-8">
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
                  value={totalOrders}
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
                  value={averageRating}
                  format={{
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }}
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
                  value={favoriteStores}
                  format={{ maximumFractionDigits: 0 }}
                  defaultValue={0}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-[#262626]">
          <CardHeader>
            <CardTitle className="dark:text-white">Nível do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge>{userLevel}</Badge>
                  <span className="text-sm text-muted-foreground dark:text-gray-300">
                    {totalOrders}/{nextLevel} pedidos para o próximo nível
                  </span>
                </div>
                <span className="text-sm font-medium dark:text-white">
                  {Math.min(progress, 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#262626]">
          <CardHeader>
            <CardTitle className="dark:text-white">Últimos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/pedidos`}
                  className="flex cursor-pointer items-center space-x-4 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-[#343434]"
                >
                  <div className="flex-shrink-0">
                    <Avatar>
                      <AvatarImage src={order.store.logo_url || undefined} />
                      <AvatarFallback>{order.store.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium dark:text-white">
                      {order.store.name}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-gray-300">
                      {order.items.map((item) => item.product.name).join(', ')}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {order.status === 'paid' && 'Pago'}
                        {order.status === 'pending' && 'Pendente'}
                        {order.status === 'preparing' && 'Preparando'}
                        {order.status === 'ready' && 'Pronto'}
                        {order.status === 'delivering' && 'Entregando'}
                        {order.status === 'delivered' && 'Entregue'}
                        {order.status === 'cancelled' && 'Cancelado'}
                        {order.status === 'refunded' && 'Estornado'}
                      </Badge>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        R$ {order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-gray-300">
                    {new Date(order.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
