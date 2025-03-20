/* eslint-disable camelcase */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const category_id = formData.get('category_id') as string
    const logo = formData.get('logo') as File | null

    if (!name || !category_id) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    let logoUrl = null
    if (logo) {
      const fileExt = logo.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `store-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logo)

      if (uploadError) {
        return NextResponse.json(
          { error: 'Erro ao fazer upload da logo' },
          { status: 500 },
        )
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(filePath)
      logoUrl = publicUrl
    }

    const { error: storeError } = await supabase.from('stores').insert({
      name,
      category_id,
      logo_url: logoUrl,
      admin_id: user.id,
    })

    if (storeError) {
      return NextResponse.json({ error: 'Erro ao criar loja' }, { status: 500 })
    }

    // Criar notificação
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: 'Loja cadastrada com sucesso! 🎉',
        description: `Sua loja "${name}" está pronta para o uso!`,
        status: 'unread',
        viewed: false,
        path: '/dashboard',
      })

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao criar loja:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
