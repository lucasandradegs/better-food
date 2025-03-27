import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { chargeId, amount } = await request.json()

    if (!chargeId) {
      return NextResponse.json(
        { error: 'chargeId é obrigatório' },
        { status: 400 },
      )
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'amount é obrigatório' },
        { status: 400 },
      )
    }

    // Verificar se o usuário está autenticado e é admin
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem cancelar pagamentos' },
        { status: 403 },
      )
    }

    const response = await fetch(
      `${process.env.PAGBANK_API_URL}/charges/${chargeId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: {
            value: amount,
          },
        }),
      },
    )

    // Log da resposta para debug
    console.log('Status da resposta PagSeguro:', response.status)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))

    let errorData
    let responseText
    try {
      responseText = await response.text() // Primeiro pegamos o texto da resposta
      console.log('Resposta bruta do PagSeguro:', responseText)

      if (responseText) {
        errorData = JSON.parse(responseText) // Tentamos converter para JSON se houver conteúdo
      }
    } catch (parseError) {
      console.error('Erro ao processar resposta do PagSeguro:', parseError)
      console.error('Conteúdo da resposta:', responseText)
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Erro ao cancelar pagamento no PagSeguro',
          details: errorData || responseText,
          status: response.status,
        },
        { status: response.status },
      )
    }

    // Se chegou aqui, o cancelamento foi bem-sucedido
    return NextResponse.json({
      message: 'Pagamento cancelado com sucesso',
      details: errorData || responseText,
    })
  } catch (error) {
    console.error('Erro ao processar cancelamento:', error)
    return NextResponse.json(
      {
        error: 'Erro interno ao processar cancelamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
