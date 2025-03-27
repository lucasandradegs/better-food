/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const body = await request.json()
    const { items, totalAmount, storeId, couponId, observations } = body

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

    let discountAmount = 0
    if (couponId) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('discount')
        .eq('id', couponId)
        .single()

      if (coupon) {
        discountAmount = (totalAmount * coupon.discount) / 100
      }
    }

    const finalAmount = totalAmount - discountAmount

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_amount: finalAmount,
        status: 'pending',
        store_id: storeId,
        user_id: user.id,
        admin_id: store.admin_id,
        coupon_id: couponId,
        discount_amount: discountAmount,
        observations,
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
