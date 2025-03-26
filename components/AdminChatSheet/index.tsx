/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  MessageCircle,
  Send,
  ArrowLeft,
  Clock,
  MessageCircleMore,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '../ui/input'

type Chat = Database['public']['Tables']['chats']['Row']
type ChatMessage = Database['public']['Tables']['chat_messages']['Row']

interface FormattedChat extends Omit<Chat, 'order_id'> {
  user: {
    email: string
    name: string | null
    avatar_url: string | null
  }
  order: {
    id: string
  }
  last_viewed_at: string | null
  has_new_messages: boolean
  is_new_or_updated: boolean
}

export function AdminChatSheet() {
  const [chats, setChats] = useState<FormattedChat[]>([])
  const [selectedChat, setSelectedChat] = useState<FormattedChat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClientComponentClient<Database>()
  const { userProfile } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Reseta o chat selecionado quando o menu é fechado
  useEffect(() => {
    if (!isOpen) {
      setSelectedChat(null)
      setMessages([])
      setNewMessage('')
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!userProfile?.id || !isOpen) return

    fetchChats()
    const chatsChannel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          fetchChats()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchChats()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chatsChannel)
    }
  }, [userProfile?.id, isOpen])

  // Efeito para buscar chats ativos mesmo quando o menu está fechado
  useEffect(() => {
    if (!userProfile?.id) return

    fetchChats()
    const notificationChannel = supabase
      .channel('chats-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          fetchChats()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchChats()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationChannel)
    }
  }, [userProfile?.id])

  useEffect(() => {
    if (!selectedChat) return

    const markChatAsRead = async () => {
      try {
        // Marcar o chat como lido quando selecionado
        const { error } = await supabase.rpc('mark_chat_as_read', {
          chat_id_param: selectedChat.id,
        })

        if (error) {
          console.error('Error marking chat as read:', error)
          return
        }

        // Atualiza o estado local imediatamente
        setChats((currentChats) =>
          currentChats.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  has_new_messages: false,
                  is_new_or_updated: false,
                  last_viewed_at: new Date().toISOString(),
                }
              : chat,
          ),
        )
      } catch (error) {
        console.error('Error in markChatAsRead:', error)
      }
    }

    setIsLoadingMessages(true)
    setMessages([]) // Limpa as mensagens anteriores

    const fetchMessages = async () => {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true })

      if (messages) {
        setMessages(messages as ChatMessage[])
      }
      setIsLoadingMessages(false)
    }

    markChatAsRead()
    fetchMessages()

    // Inscreve para atualizações em tempo real das mensagens
    const messagesChannel = supabase
      .channel(`chat-messages-${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages((current) => {
            const messageExists = current.some(
              (msg) => msg.id === newMessage.id,
            )
            if (messageExists) return current
            return [...current, newMessage]
          })

          // Atualiza o estado do chat quando uma nova mensagem é recebida
          if (newMessage.sender_id !== userProfile?.id) {
            setChats((currentChats) =>
              currentChats.map((chat) =>
                chat.id === selectedChat.id
                  ? {
                      ...chat,
                      has_new_messages: true,
                      is_new_or_updated: true,
                      last_viewed_at: null,
                    }
                  : chat,
              ),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [selectedChat])

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim() || !userProfile?.id) return

    try {
      const messageToSend = {
        chat_id: selectedChat.id,
        sender_id: userProfile.id,
        content: newMessage.trim(),
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageToSend)
        .select()
        .single()

      if (error) throw error

      // Adiciona a mensagem localmente para feedback instantâneo
      if (data) {
        setMessages((current) => [...current, data])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const fetchChats = async () => {
    console.log('Iniciando fetchChats, userProfile:', userProfile)
    // Primeiro, buscar a loja do admin
    const { data: storeData } = await supabase
      .from('stores')
      .select('id')
      .eq('admin_id', userProfile?.id)
      .single()

    console.log('Store data encontrada:', storeData)

    if (!storeData?.id) {
      console.log('Nenhuma loja encontrada para o admin')
      return
    }

    // Buscar chats usando RPC
    const { data: chatsData, error } = await supabase.rpc('get_store_chats', {
      store_id_param: storeData.id,
    })

    console.log('Chats encontrados:', chatsData)
    console.log('Erro ao buscar chats:', error)

    if (error) {
      console.error('Error fetching chats:', error)
      return
    }

    if (!chatsData) {
      console.log('Nenhum chat encontrado')
      return
    }

    const formattedChats: FormattedChat[] = chatsData.map((chat: any) => ({
      ...chat,
      user: {
        email: chat.user_email,
        name: chat.user_name,
        avatar_url: chat.user_avatar_url,
      },
      order: {
        id: chat.order_id,
      },
      last_viewed_at: chat.last_viewed_at,
      has_new_messages: chat.has_new_messages,
      is_new_or_updated: chat.is_new_or_updated,
    }))

    console.log('Chats formatados:', formattedChats)

    setChats(formattedChats)
    setIsLoading(false)
  }

  const markChatAsViewed = async (chatId: string) => {
    try {
      const { error } = await supabase.rpc('mark_chat_as_viewed', {
        chat_id_param: chatId,
      })

      if (error) {
        console.error('Error marking chat as viewed:', error)
        return
      }

      // Atualiza o estado local imediatamente
      setChats((currentChats) =>
        currentChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                has_new_messages: false,
                is_new_or_updated: false,
                last_viewed_at: new Date().toISOString(),
              }
            : chat,
        ),
      )
    } catch (error) {
      console.error('Error in markChatAsViewed:', error)
    }
  }

  const markAllChatsAsViewed = async () => {
    try {
      // Primeiro, buscar a loja do admin
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('admin_id', userProfile?.id)
        .single()

      if (!storeData?.id) return

      const { error } = await supabase.rpc('mark_store_chats_as_viewed', {
        store_id_param: storeData.id,
      })

      if (error) {
        console.error('Error marking all chats as viewed:', error)
      }
    } catch (error) {
      console.error('Error in markAllChatsAsViewed:', error)
    }
  }

  const handlePopoverOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen)
    if (isOpen) {
      markAllChatsAsViewed()
    }
  }

  const activeChatsCount = chats.filter((chat) => chat.is_new_or_updated).length

  return (
    <Sheet open={isOpen} onOpenChange={handlePopoverOpenChange}>
      <SheetTrigger asChild>
        <div className="group relative cursor-pointer">
          <div className="">
            <MessageCircle className="h-5 w-5" />
          </div>
          {activeChatsCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white duration-200 animate-in zoom-in">
              {activeChatsCount}
            </span>
          )}
        </div>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l p-0 focus-visible:ring-0 dark:border-[#2a2a2a] dark:bg-[#121212] sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {selectedChat ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b bg-muted/30 p-4 dark:border-[#2a2a2a]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedChat(null)}
                className="h-8 w-8 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarImage src={selectedChat.user.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedChat.user.name
                    ? selectedChat.user.name.substring(0, 2).toUpperCase()
                    : selectedChat.user.email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">
                  {selectedChat.user.name || selectedChat.user.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedChat.user.email}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Pedido #{selectedChat.order.id.slice(0, 8)}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'h-5 px-1.5 text-[10px]',
                      selectedChat.status === 'closed'
                        ? 'border-red-500/20 bg-red-500/10 text-red-500'
                        : 'border-green-500/20 bg-green-500/10 text-green-500',
                    )}
                  >
                    {selectedChat.status === 'closed' ? 'Fechado' : 'Ativo'}
                  </Badge>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 px-4 py-6">
              <div className="flex flex-col gap-4">
                {messages.length === 0 ? (
                  isLoadingMessages ? (
                    <div className="flex flex-col gap-4">
                      {/* Mensagem do Cliente */}
                      <div className="flex w-full justify-start">
                        <div className="flex max-w-[80%] items-start gap-3">
                          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                          <div>
                            <div className="h-16 w-[200px] animate-pulse rounded-2xl rounded-tl-none bg-muted" />
                            <div className="mt-2 flex items-center gap-1">
                              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mensagem do Admin */}
                      <div className="flex w-full justify-end">
                        <div>
                          <div className="h-12 w-[180px] animate-pulse rounded-2xl rounded-tr-none bg-primary/20" />
                          <div className="mt-2 flex items-center justify-end gap-1">
                            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                          </div>
                        </div>
                      </div>

                      {/* Mensagem do Cliente */}
                      <div className="flex w-full justify-start">
                        <div className="flex max-w-[80%] items-start gap-3">
                          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                          <div>
                            <div className="h-20 w-[240px] animate-pulse rounded-2xl rounded-tl-none bg-muted" />
                            <div className="mt-2 flex items-center gap-1">
                              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                      <MessageCircle className="h-12 w-12 opacity-20" />
                      <p>Nenhuma mensagem ainda</p>
                      {selectedChat?.status !== 'closed' ? (
                        <p className="max-w-[250px] text-xs">
                          Envie uma mensagem para iniciar a conversa com o
                          cliente
                        </p>
                      ) : (
                        <p className="max-w-[250px] text-xs">
                          Este chat está fechado e não pode receber novas
                          mensagens
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex w-full',
                        message.sender_id === userProfile?.id
                          ? 'justify-end'
                          : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl p-3 shadow-sm',
                          message.sender_id === userProfile?.id
                            ? 'rounded-tr-none bg-primary text-primary-foreground'
                            : 'rounded-tl-none bg-muted',
                        )}
                      >
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                        <div
                          className={cn(
                            'mt-1 flex items-center justify-end gap-1 text-xs',
                            message.sender_id === userProfile?.id
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground',
                          )}
                        >
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t bg-background p-4 dark:border-[#2a2a2a]">
              {selectedChat?.status === 'closed' ? (
                <div className="flex items-center justify-center rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground dark:bg-[#1a1a1a]">
                  <p>Este chat está fechado pois o pedido foi entregue</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="resize-none rounded-xl focus-visible:ring-primary dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="icon"
                    className="aspect-square h-auto rounded-xl"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <SheetHeader className="h-[48px] border-b px-6 py-4 dark:border-[#2a2a2a]">
              <SheetTitle className="flex items-center gap-2 text-sm">
                <MessageCircleMore className="h-4 w-4" /> Conversas
              </SheetTitle>
            </SheetHeader>

            <Tabs defaultValue="active" className="flex flex-1 flex-col">
              <div className="px-6 pt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="active" className="flex-1">
                    Ativos
                    {activeChatsCount > 0 && (
                      <Badge className="ml-2 bg-green-500 hover:bg-green-600">
                        {activeChatsCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex-1">
                    Todos
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="active" className="mt-0 flex-1">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="grid gap-3 p-6">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={index}
                          className="flex animate-pulse items-center gap-4 rounded-xl border p-4 dark:border-[#2a2a2a]"
                        >
                          <div className="h-12 w-12 rounded-full bg-muted" />
                          <div className="flex flex-1 flex-col gap-2">
                            <div className="h-4 w-24 rounded bg-muted" />
                            <div className="h-3 w-32 rounded bg-muted" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-3 p-6">
                      {chats
                        .filter((chat) => chat.status === 'active')
                        .map((chat) => (
                          <button
                            key={chat.id}
                            className="flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:scale-[0.99] hover:bg-muted/50 active:scale-[0.97] dark:border-[#2a2a2a]"
                            onClick={() => {
                              setSelectedChat(chat)
                              markChatAsViewed(chat.id)
                            }}
                          >
                            <Avatar className="h-12 w-12 border-2 border-primary/10">
                              <AvatarImage src={chat.user.avatar_url || ''} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {chat.user.name
                                  ? chat.user.name.substring(0, 2).toUpperCase()
                                  : chat.user.email
                                      .substring(0, 2)
                                      .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-1 flex-col">
                              <span className="font-medium">
                                {chat.user.name || chat.user.email}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {chat.user.email}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>Pedido #{chat.order.id.slice(0, 8)}</span>
                                {chat.has_new_messages && (
                                  <Badge
                                    variant="outline"
                                    className="h-5 border-blue-500/20 bg-blue-500/10 px-1.5 text-[10px] text-blue-500"
                                  >
                                    Nova mensagem
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {chat.status === 'active' && (
                              <span className="relative flex h-2 w-2">
                                <span
                                  className={cn(
                                    'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                                    'bg-green-500',
                                  )}
                                />
                                <span
                                  className={cn(
                                    'relative inline-flex h-2 w-2 rounded-full',
                                    'bg-green-500',
                                  )}
                                />
                              </span>
                            )}
                          </button>
                        ))}

                      {chats.filter((chat) => chat.status === 'active')
                        .length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                          <MessageCircle className="h-12 w-12 opacity-20" />
                          <p>Nenhuma conversa ativa</p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="all" className="mt-0 flex-1">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="grid gap-3 p-6">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={index}
                          className="flex animate-pulse items-center gap-4 rounded-xl border p-4 dark:border-[#2a2a2a]"
                        >
                          <div className="h-12 w-12 rounded-full bg-muted" />
                          <div className="flex flex-1 flex-col gap-2">
                            <div className="h-4 w-24 rounded bg-muted" />
                            <div className="h-3 w-32 rounded bg-muted" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-3 p-6">
                      {chats.map((chat) => (
                        <button
                          key={chat.id}
                          className="flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:scale-[0.99] hover:bg-muted/50 active:scale-[0.97] dark:border-[#2a2a2a]"
                          onClick={() => {
                            setSelectedChat(chat)
                            markChatAsViewed(chat.id)
                          }}
                        >
                          <Avatar className="h-12 w-12 border-2 border-primary/10">
                            <AvatarImage src={chat.user.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {chat.user.name
                                ? chat.user.name.substring(0, 2).toUpperCase()
                                : chat.user.email.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-1 flex-col">
                            <span className="font-medium">
                              {chat.user.name || chat.user.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {chat.user.email}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span>Pedido #{chat.order.id.slice(0, 8)}</span>
                              {chat.has_new_messages && (
                                <Badge
                                  variant="outline"
                                  className="h-5 border-blue-500/20 bg-blue-500/10 px-1.5 text-[10px] text-blue-500"
                                >
                                  Nova mensagem
                                </Badge>
                              )}
                              {chat.status === 'closed' && (
                                <Badge
                                  variant="outline"
                                  className="h-5 border-red-500/20 bg-red-500/10 px-1.5 text-[10px] text-red-500"
                                >
                                  Fechado
                                </Badge>
                              )}
                            </div>
                          </div>
                          {chat.status === 'active' && (
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                            </span>
                          )}
                        </button>
                      ))}

                      {chats.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                          <MessageCircle className="h-12 w-12 opacity-20" />
                          <p>Nenhuma conversa ainda</p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
