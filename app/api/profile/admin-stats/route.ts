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

    // Buscar a loja do admin
    const { data: storeData } = await supabase
      .from('stores')
      .select('id')
      .eq('admin_id', user.id)
      .single()

    if (!storeData) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 },
      )
    }

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

    const stats = {
      totalOrders: orders?.length || 0,
      totalRevenue,
      averageRating: Number(avgRating.toFixed(1)),
      topProducts: topProducts || [],
      topCustomers: topCustomers || [],
      recentOrders: recentOrders || [],
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao buscar estatísticas do admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
