import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json(
        { error: 'ID da loja não fornecido' },
        { status: 400 },
      )
    }

    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Obtém a data local e ajusta para o início do dia em UTC
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayUTC = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000,
    )

    const yesterday = new Date(todayUTC)
    yesterday.setDate(yesterday.getDate() - 1)

    const tomorrow = new Date(todayUTC)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Buscar pedidos de hoje
    const { data: todayOrdersData } = await supabase
      .from('orders')
      .select(
        `
        id, 
        total_amount,
        created_at,
        payments!inner (
          status
        )
      `,
      )
      .eq('store_id', storeId)
      .eq('payments.status', 'PAID')
      .gte('created_at', todayUTC.toISOString())
      .lt('created_at', tomorrow.toISOString())

    // Buscar pedidos de ontem
    const { data: yesterdayOrdersData } = await supabase
      .from('orders')
      .select(
        `
        id, 
        total_amount,
        created_at,
        payments!inner (
          status
        )
      `,
      )
      .eq('store_id', storeId)
      .eq('payments.status', 'PAID')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', todayUTC.toISOString())

    // Buscar total de pedidos
    const { data: storeData } = await supabase
      .from('stores')
      .select('order_count')
      .eq('id', storeId)
      .single()

    // Buscar total de vendas
    const { data: allOrders } = await supabase
      .from('orders')
      .select(
        `
        total_amount,
        payments!inner (
          status
        )
      `,
      )
      .eq('store_id', storeId)
      .eq('payments.status', 'PAID')

    const todayOrders = todayOrdersData || []
    const yesterdayOrders = yesterdayOrdersData || []

    const todaySales = todayOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0,
    )
    const previousDaySales = yesterdayOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0,
    )

    const totalSales = (allOrders || []).reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0,
    )

    const stats = {
      todaySales,
      todayOrders: todayOrders.length,
      averageTicket:
        todayOrders.length > 0 ? todaySales / todayOrders.length : 0,
      previousDaySales,
      previousDayOrders: yesterdayOrders.length,
      previousDayTicket:
        yesterdayOrders.length > 0
          ? previousDaySales / yesterdayOrders.length
          : 0,
      totalOrders: storeData?.order_count || 0,
      totalSales,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
