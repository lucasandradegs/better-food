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
import { useRouter } from 'next/navigation'

type Notification = Database['public']['Tables']['notifications']['Row']

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>(
    'all',
  )
  const { userProfile } = useAuth()
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    if (!userProfile?.id) return

    const fetchNotifications = async () => {
      setIsLoading(true)
      const response = await fetch('/api/notifications')
      const data = await response.json()

      if (data.notifications) {
        setNotifications(data.notifications)
        const unviewedCount = data.notifications.filter(
          (n: Notification) => !n.viewed,
        ).length
        setUnreadCount(unviewedCount)
      }
      setIsLoading(false)
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
          }
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userProfile?.id])

  const markAsRead = async (notificationId: string) => {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'markAsRead',
        notificationId,
      }),
    })

    if (response.ok) {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: 'read' }
            : notification,
        ),
      )
    }
  }

  const markAllAsRead = async () => {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'markAllAsRead',
      }),
    })

    if (response.ok) {
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, status: 'read' })),
      )
      setUnreadCount(0)
    }
  }

  const markAsViewed = async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId)
    if (!notification) return

    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'markAsViewed',
        notificationId,
      }),
    })

    if (response.ok) {
      setNotifications((current) =>
        current.map((n) =>
          n.id === notificationId ? { ...n, viewed: true } : n,
        ),
      )

      if (notification.path) {
        router.push(notification.path)
      }
    }
  }

  const markAllAsViewed = async () => {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'markAllAsViewed',
      }),
    })

    if (response.ok) {
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, viewed: true })),
      )
      setUnreadCount(0)
    }
  }

  const handlePopoverOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      markAllAsViewed()
    }
  }

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId)
    await markAsViewed(notificationId)
    setOpen(false)
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'unread') return notification.status === 'unread'
    return notification.status === 'read'
  })

  return (
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
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
        className="w-screen p-0 dark:border-[#343434] dark:bg-[#1c1c1c] md:w-[400px]"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col border-b">
          <div className="flex items-center justify-between rounded-t-sm p-4 dark:bg-[#232323]">
            <h4 className="font-semibold">Notificações</h4>
            {notifications.some((n) => n.status === 'unread') && (
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
          <div className="flex border-t">
            <button
              onClick={() => setActiveFilter('all')}
              className={cn(
                'flex-1 border-b-2 p-2 text-sm transition-colors',
                activeFilter === 'all'
                  ? 'border-red-500 font-medium'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#232323]',
              )}
            >
              Todas
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={cn(
                'flex-1 border-b-2 p-2 text-sm transition-colors',
                activeFilter === 'unread'
                  ? 'border-red-500 font-medium'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#232323]',
              )}
            >
              Não lidas
            </button>
            <button
              onClick={() => setActiveFilter('read')}
              className={cn(
                'flex-1 border-b-2 p-2 text-sm transition-colors',
                activeFilter === 'read'
                  ? 'border-red-500 font-medium'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#232323]',
              )}
            >
              Lidas
            </button>
          </div>
        </div>
        <ScrollArea className="h-screen md:h-[300px]">
          {isLoading ? (
            <div className="grid gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse flex-col gap-1 p-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-sm bg-gray-200 dark:bg-gray-800" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="h-4 w-2/3 rounded-sm bg-gray-200 dark:bg-gray-800" />
                      <div className="h-3 w-full rounded-sm bg-gray-200 dark:bg-gray-800" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="h-3 w-24 rounded-sm bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-gray-500">
              {activeFilter === 'unread'
                ? 'Parabéns! Você leu todas as notificações 🎉'
                : activeFilter === 'read'
                  ? 'Você ainda não tem notificações lidas'
                  : 'Você ainda não tem notificações'}
            </div>
          ) : (
            <div className="grid gap-1">
              {filteredNotifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    'flex flex-col gap-1 p-4 text-left hover:bg-gray-100 dark:hover:bg-[#232323]',
                    notification.status === 'unread' &&
                      'bg-blue-50 dark:bg-[#262626]',
                  )}
                  onClick={() => handleNotificationClick(notification.id)}
                  tabIndex={-1}
                >
                  <div className="flex items-center gap-2 lg:gap-4">
                    <div className="flex h-9 min-w-9 items-center justify-center rounded-sm bg-blue-200 dark:bg-[#323232]">
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
