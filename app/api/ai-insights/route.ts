/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { daysAgo } = await request.json()

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

    // Buscar dados da loja
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

    // Preparar dados para a OpenAI
    const data = {
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
    }

    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Você é um analista de negócios especializado em restaurantes e delivery.
          Analise os dados fornecidos e gere 3 insights valiosos e acionáveis para o dono do restaurante.
          Foque em tendências, oportunidades de melhoria e sugestões práticas.
          Mantenha as respostas concisas e diretas.
          Responda em português.
          Analise especificamente os últimos ${daysAgo} dias.`,
        },
        {
          role: 'user',
          content: `Analise estes dados e forneça 3 insights valiosos:
          ${JSON.stringify(data, null, 2)}`,
        },
      ],
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            )
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar insights:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar insights' },
      { status: 500 },
    )
  }
}
