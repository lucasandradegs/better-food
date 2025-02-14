'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { useAuth } from '@/contexts/AuthContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Notification = Database['public']['Tables']['notifications']['Row']

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { userProfile } = useAuth()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (!userProfile?.id) return

    // Busca notificações iniciais
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => n.status === 'unread').length)
      }
    }

    fetchNotifications()

    // Inscreve para atualizações em tempo real
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((current) => [
              payload.new as Notification,
              ...current,
            ])
            setUnreadCount((count) => count + 1)
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((current) =>
              current.map((notification) =>
                notification.id === payload.new.id
                  ? (payload.new as Notification)
                  : notification,
              ),
            )
            // Atualiza contagem se o status mudou
            if (payload.old.status !== payload.new.status) {
              setUnreadCount((count) =>
                payload.new.status === 'unread'
                  ? count + 1
                  : Math.max(0, count - 1),
              )
            }
          }
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userProfile?.id])

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', notificationId)

    if (!error) {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: 'read' }
            : notification,
        ),
      )
      setUnreadCount((count) => Math.max(0, count - 1))
    }
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('user_id', userProfile?.id)
      .eq('status', 'unread')

    if (!error) {
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, status: 'read' })),
      )
      setUnreadCount(0)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-screen p-0 md:w-[400px] dark:bg-[#161616]"
        align="end"
      >
        <div className="flex items-center justify-between border-b p-4">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              className="h-auto px-2 py-1 text-xs"
              onClick={markAllAsRead}
              tabIndex={-1}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-screen md:h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-gray-500">
              Nenhuma notificação
            </div>
          ) : (
            <div className="grid gap-1">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    'flex flex-col gap-1 p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800',
                    notification.status === 'unread' &&
                      'bg-gray-50 dark:bg-gray-900',
                  )}
                  onClick={() => markAsRead(notification.id)}
                  tabIndex={-1}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-9 min-w-9 items-center justify-center rounded-sm bg-blue-200">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {notification.title}
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                  <span className="flex w-full justify-end text-xs text-gray-500">
                    {format(
                      new Date(notification.created_at),
                      "d 'de' MMMM 'às' HH:mm",
                      { locale: ptBR },
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
