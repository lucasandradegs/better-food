/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const body = await request.json()
    const { items, totalAmount, storeId } = body

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 },
      )
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('admin_id')
      .eq('id', storeId)
      .single()

    if (storeError) {
      console.error('Erro ao buscar loja:', storeError)
      return NextResponse.json(
        { error: 'Erro ao buscar informações da loja' },
        { status: 500 },
      )
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_amount: totalAmount,
        status: 'pending',
        store_id: storeId,
        user_id: user.id,
        admin_id: store.admin_id,
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      })),
    )

    if (itemsError) throw itemsError

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}
