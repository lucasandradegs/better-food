/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const daysAgo = Number(searchParams.get('daysAgo')) || 5 // default to 5 days if not provided

    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('admin_id', session.user.id)
      .single()

    if (!store) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 },
      )
    }

    const [metrics, insights, ratings, topCustomers, detailedInsights] =
      await Promise.all([
        supabase.rpc('get_store_metrics', {
          p_store_id: store.id,
          p_days_ago: daysAgo,
        }),
        supabase.rpc('get_store_insights', {
          p_store_id: store.id,
          p_days_ago: daysAgo,
        }),
        supabase.rpc('get_store_ratings', {
          p_store_id: store.id,
        }),
        supabase.rpc('get_top_customers', {
          store_id_param: store.id,
          limit_param: 5,
        }),
        supabase.rpc('get_detailed_store_insights', {
          p_store_id: store.id,
          p_days_ago: daysAgo,
        }),
      ])

    const detailedInsightsByType = detailedInsights.data?.reduce(
      (acc: any, insight: any) => {
        const { insight_type, ...rest } = insight
        if (!acc[insight_type]) {
          acc[insight_type] = []
        }
        acc[insight_type].push(rest)
        return acc
      },
      {},
    )

    return NextResponse.json({
      metrics: metrics.data?.[0],
      insights: insights.data,
      ratings: ratings.data?.[0],
      topCustomers: topCustomers.data,
      detailedInsights: {
        paymentMethods: detailedInsightsByType?.payment_method || [],
        couponUsage: detailedInsightsByType?.coupon_usage || [],
        priceImpact: detailedInsightsByType?.price_impact || [],
        raw: detailedInsights.data || [],
      },
    })
  } catch (error) {
    console.error('Erro ao buscar insights:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar insights' },
      { status: 500 },
    )
  }
}
