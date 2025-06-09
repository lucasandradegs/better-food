import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from('stores')
      .select(
        `
        *,
        store_categories (
          name
        )
      `,
      )
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar restaurantes' },
        { status: 500 },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
