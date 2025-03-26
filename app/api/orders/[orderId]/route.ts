import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const statusEmPortugues: Record<string, string> = {
  pending: 'pendente',
  processing: 'em processamento',
  paid: 'pago',
  preparing: 'em preparação',
  ready: 'pronto para entrega',
  delivering: 'em entrega',
  delivered: 'entregue',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { newStatus } = await req.json()
    const supabase = createRouteHandlerClient({ cookies })
    const { orderId } = await params

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem atualizar o status do pedido' },
        { status: 403 },
      )
    }

    // Atualizar o status do pedido
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar status' },
        { status: 500 },
      )
    }

    if (newStatus === 'delivered') {
      const { data: chatData, error: findChatError } = await supabase
        .from('chats')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (findChatError) {
        console.error('Erro ao buscar chat:', findChatError)
      }

      if (chatData) {
        const { error: rpcError } = await supabase.rpc('admin_close_chat', {
          chat_id_param: chatData.id,
        })

        if (rpcError) {
          console.log(
            'Erro ao atualizar via RPC, tentando atualização direta:',
            rpcError,
          )

          const { error: directError } = await supabase
            .from('chats')
            .update({
              status: 'closed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', chatData.id)

          if (directError) {
            console.error('Erro na atualização direta:', directError)
          }
        }

        const { data: verifyChat } = await supabase
          .from('chats')
          .select('status')
          .eq('id', chatData.id)
          .single()

        console.log('Status do chat após atualização:', verifyChat?.status)
      }
    }

    // Buscar o pedido atualizado com todas as informações
    const { data: updatedOrder, error: fetchError } = await supabase
      .from('orders')
      .select(
        `
        *,
        items:order_items (
          *,
          product:products (*)
        ),
        payments (*),
        store:stores (
          name,
          logo_url
        )
      `,
      )
      .eq('id', orderId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Erro ao buscar pedido atualizado' },
        { status: 500 },
      )
    }

    // Buscar informações do cliente
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', updatedOrder.user_id)
      .single()

    if (customerError) {
      return NextResponse.json(
        { error: 'Erro ao buscar dados do cliente' },
        { status: 500 },
      )
    }

    // Criar notificação para o cliente
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: updatedOrder.user_id,
        title: 'Status do pedido atualizado',
        description: `Seu pedido agora está ${statusEmPortugues[newStatus] || newStatus.toLowerCase()}.`,
        status: 'unread',
        viewed: false,
        path: '/pedidos',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError)
    }

    // Combinar os dados do pedido com os dados do cliente
    const orderWithCustomer = {
      ...updatedOrder,
      customer: customerData,
    }

    return NextResponse.json(orderWithCustomer)
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    )
  }
}
