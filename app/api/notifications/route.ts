import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 },
      )
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies()
    // @ts-expect-error cookies is not typed
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { action, notificationId } = await request.json()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'markAsRead') {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId)
        .eq('user_id', session.user.id)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to mark notification as read' },
          { status: 500 },
        )
      }
    } else if (action === 'markAllAsRead') {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('user_id', session.user.id)
        .eq('status', 'unread')

      if (error) {
        return NextResponse.json(
          { error: 'Failed to mark all notifications as read' },
          { status: 500 },
        )
      }
    } else if (action === 'markAsViewed') {
      const { error } = await supabase
        .from('notifications')
        .update({ viewed: true })
        .eq('id', notificationId)
        .eq('user_id', session.user.id)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to mark notification as viewed' },
          { status: 500 },
        )
      }
    } else if (action === 'markAllAsViewed') {
      const { error } = await supabase
        .from('notifications')
        .update({ viewed: true })
        .eq('user_id', session.user.id)
        .eq('viewed', false)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to mark all notifications as viewed' },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar notificação como lida' },
      { status: 500 },
    )
  }
}
