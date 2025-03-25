import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    let ordersData

    if (isAdmin) {
      // Buscar loja do admin
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('admin_id', user.id)
        .single()

      if (storeError || !storeData) {
        return NextResponse.json(
          { error: 'Loja não encontrada' },
          { status: 404 },
        )
      }

      // Buscar pedidos da loja
      const { data: orders, error: ordersError } = await supabase
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
          observations
        `,
        )
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        return NextResponse.json(
          { error: 'Erro ao buscar pedidos' },
          { status: 500 },
        )
      }

      // Buscar emails dos clientes
      const userIds = [...new Set(orders.map((order) => order.user_id))]
      const { data: customersData, error: customersError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)

      if (customersError) {
        return NextResponse.json(
          { error: 'Erro ao buscar dados dos clientes' },
          { status: 500 },
        )
      }

      // Combinar dados
      ordersData = orders.map((order) => ({
        ...order,
        customer: customersData?.find(
          (customer) => customer.id === order.user_id,
        ) ?? {
          id: order.user_id,
          email: 'Email não encontrado',
        },
      }))
    } else {
      // Buscar pedidos do cliente
      const { data: orders, error: ordersError } = await supabase
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
          ),
          observations
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        return NextResponse.json(
          { error: 'Erro ao buscar pedidos' },
          { status: 500 },
        )
      }

      ordersData = orders
    }

    return NextResponse.json({
      orders: ordersData,
      isAdmin,
    })
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
