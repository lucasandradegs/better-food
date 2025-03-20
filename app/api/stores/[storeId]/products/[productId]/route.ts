import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ storeId: string; productId: string }> },
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { storeId, productId } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 },
      )
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('store_id', storeId)

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao excluir produto' },
        { status: 500 },
      )
    }

    // Criar notificação
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Produto excluído com sucesso! 🗑️',
      description: 'O produto foi removido do cardápio.',
      status: 'unread',
      viewed: false,
      path: '/dashboard',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
