import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 },
      )
    }

    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*, payments!inner(*)', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('payments.status', 'PAID')
      .not('status', 'eq', 'cancelled')
      .not('status', 'eq', 'refunded')

    const { data: ratings } = await supabase
      .from('order_ratings')
      .select('rating, food_rating, delivery_rating')
      .eq('user_id', user.id)

    const { count: favoritesCount } = await supabase
      .from('favorite_stores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

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
      .eq('user_id', user.id)
      .in('status', ['paid', 'delivered', 'preparing', 'ready', 'delivering'])
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

    const stats = {
      totalOrders,
      averageRating: Number(avgRating.toFixed(1)),
      favoriteStores: favoritesCount || 0,
      userLevel,
      nextLevel,
      progress,
      recentOrders: recentOrders || [],
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao buscar estatísticas do cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
