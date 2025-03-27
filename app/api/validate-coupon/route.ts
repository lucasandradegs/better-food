import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { couponName } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 },
      )
    }

    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('name', couponName.toUpperCase())
      .eq('is_active', true)
      .single()

    if (couponError || !coupon) {
      return NextResponse.json(
        { error: 'Cupom inválido ou expirado' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      id: coupon.id,
      name: coupon.name,
      discount: coupon.discount,
    })
  } catch (error) {
    console.error('Erro ao validar cupom:', error)
    return NextResponse.json(
      { error: 'Erro ao validar cupom' },
      { status: 500 },
    )
  }
}
