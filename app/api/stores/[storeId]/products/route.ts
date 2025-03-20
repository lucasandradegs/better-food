/* eslint-disable camelcase */
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { storeId } = await params

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_categories (
          name
        )
      `,
      )
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar produtos' },
        { status: 500 },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { storeId } = await params

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
    const price = parseFloat(formData.get('price') as string)
    const category_id = formData.get('category_id') as string
    const is_available = formData.get('is_available') === 'true'
    const description = formData.get('description') as string
    const image = formData.get('image') as File | null
    const productId = formData.get('productId') as string | null

    if (!name || !price || !category_id || !description) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    let imageUrl = formData.get('image_url') as string | null

    if (image) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `product-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, image)

      if (uploadError) {
        return NextResponse.json(
          { error: 'Erro ao fazer upload da imagem' },
          { status: 500 },
        )
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(filePath)
      imageUrl = publicUrl
    }

    const productData = {
      name,
      price,
      category_id,
      is_available,
      image_url: imageUrl,
      store_id: storeId,
      description,
    }

    if (productId) {
      // Atualizar produto existente
      console.log('Dados recebidos:', {
        productId,
        storeId,
        productData,
      })

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .eq('store_id', storeId)

      if (error) {
        console.error('Erro do Supabase ao atualizar produto:', error)
        return NextResponse.json(
          { error: `Erro ao atualizar produto: ${error.message}` },
          { status: 500 },
        )
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Produto atualizado com sucesso! ✏️',
        description: `O produto "${name}" foi atualizado com sucesso.`,
        status: 'unread',
        viewed: false,
        path: '/dashboard',
      })
    } else {
      // Criar novo produto
      const { error } = await supabase.from('products').insert(productData)

      if (error) {
        return NextResponse.json(
          { error: 'Erro ao criar produto' },
          { status: 500 },
        )
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Novo produto cadastrado! 🎉',
        description: `O produto "${name}" foi cadastrado com sucesso em sua loja.`,
        status: 'unread',
        viewed: false,
        path: '/dashboard',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
