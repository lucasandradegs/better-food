import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { couponId } = await request.json()

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
      .select('amount_used')
      .eq('id', couponId)
      .single()

    if (couponError) {
      console.error('Erro ao buscar cupom:', couponError)
      return NextResponse.json(
        { error: 'Erro ao atualizar uso do cupom' },
        { status: 500 },
      )
    }

    const { error: updateError } = await supabase
      .from('coupons')
      .update({ amount_used: (coupon?.amount_used || 0) + 1 })
      .eq('id', couponId)

    if (updateError) {
      console.error('Erro ao atualizar cupom:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar uso do cupom' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar uso do cupom:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar uso do cupom' },
      { status: 500 },
    )
  }
}
