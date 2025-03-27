import { MessageCircle, Clock, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'

type Chat = {
  id: string
  store_id: string
  user_id: string
  order_id: string
  status: 'active' | 'closed'
  created_at: string
  updated_at: string
  has_new_messages: boolean
  last_viewed_at: string | null
  store: {
    name: string
  }
}

type Message = {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

type ClientChatNotification = {
  chat_id: string
  has_unread_messages: boolean
  last_read_at: string | null
}

type PostgresChangesPayload = {
  new: ClientChatNotification
  old: ClientChatNotification
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

interface OrderChatProps {
  orderId: string
  storeId: string
  storeName: string
}

// Novo hook para gerenciar notificações do cliente
const useClientChatNotifications = (orderId: string, storeId: string) => {
  const supabase = createClientComponentClient<Database>()
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const { userProfile } = useAuth()
  const [chatId, setChatId] = useState<string | null>(null)

  // Efeito para buscar o chat e configurar o chatId
  useEffect(() => {
    if (!userProfile?.id) return

    const fetchChat = async () => {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('store_id', storeId)
        .eq('user_id', userProfile.id)
        .eq('order_id', orderId)
        .single()

      if (existingChat) {
        setChatId(existingChat.id)
      }
    }

    fetchChat()
  }, [userProfile?.id, orderId, storeId])

  // Efeito separado para buscar e monitorar notificações
  useEffect(() => {
    if (!userProfile?.id) return

    // Busca o estado inicial das notificações
    const fetchNotifications = async () => {
      const { data: notifications } = await supabase.rpc(
        'get_client_chats_with_notifications',
        {
          profile_id_param: userProfile.id,
        },
      )

      if (notifications?.length > 0) {
        // Se temos chatId, procura por ele
        if (chatId) {
          const chatNotification = notifications.find(
            (n: ClientChatNotification) => n.chat_id === chatId,
          )
          setHasUnreadMessages(chatNotification?.has_unread_messages ?? false)
        } else {
          // Se não temos chatId ainda, procura por orderId e storeId
          const { data: chat } = await supabase
            .from('chats')
            .select('id')
            .eq('store_id', storeId)
            .eq('user_id', userProfile.id)
            .eq('order_id', orderId)
            .single()

          if (chat) {
            const chatNotification = notifications.find(
              (n: ClientChatNotification) => n.chat_id === chat.id,
            )
            setHasUnreadMessages(chatNotification?.has_unread_messages ?? false)
          }
        }
      }
    }

    fetchNotifications()

    // Inscreve para mudanças nas notificações do cliente
    const notificationsChannel = supabase
      .channel(`client-notifications-${userProfile.id}-${orderId}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'client_chat_notifications',
        },
        async (payload: PostgresChangesPayload) => {
          // Quando receber uma notificação, verifica se é para este chat
          if (payload.new) {
            // Se temos chatId, verifica diretamente
            if (chatId && payload.new.chat_id === chatId) {
              setHasUnreadMessages(payload.new.has_unread_messages)
              return
            }

            // Se não temos chatId, busca o chat para verificar
            const { data: chat } = await supabase
              .from('chats')
              .select('id')
              .eq('store_id', storeId)
              .eq('user_id', userProfile.id)
              .eq('order_id', orderId)
              .single()

            if (chat && payload.new.chat_id === chat.id) {
              setHasUnreadMessages(payload.new.has_unread_messages)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationsChannel)
    }
  }, [userProfile?.id, orderId, storeId, chatId])

  const markAsRead = async () => {
    if (!chatId) return

    await supabase.rpc('mark_client_chat_as_read', {
      chat_id_param: chatId,
    })
    setHasUnreadMessages(false)
  }

  return { hasUnreadMessages, markAsRead }
}

export function OrderChat({ orderId, storeId, storeName }: OrderChatProps) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClientComponentClient<Database>()
  const { userProfile } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Integrar o hook de notificações com orderId e storeId
  const { hasUnreadMessages, markAsRead } = useClientChatNotifications(
    orderId,
    storeId,
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Novo useEffect para manter o foco no input
  useEffect(() => {
    if (isOpen && chat?.status !== 'closed') {
      inputRef.current?.focus()
    }
  }, [isOpen, messages, chat?.status])

  const setupRealtimeSubscriptions = (chatId?: string) => {
    const channelName = chatId ? `messages-${chatId}` : 'messages-new'

    const messagesChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          ...(chatId && { filter: `chat_id=eq.${chatId}` }),
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message

            // Atualiza as mensagens independente do remetente
            setMessages((current) => {
              // Evita duplicatas
              if (current.some((msg) => msg.id === newMessage.id)) {
                return current
              }
              return [...current, newMessage]
            })
          }
        },
      )
      .subscribe()

    return () => {
      messagesChannel.unsubscribe()
    }
  }

  // Modificar o useEffect que busca o chat para incluir a marcação como lido
  useEffect(() => {
    if (!userProfile?.id || !isOpen) return

    let cleanup: (() => void) | undefined

    const fetchChat = async () => {
      setIsLoading(true)

      try {
        const { data: existingChat } = await supabase
          .from('chats')
          .select('*, store:stores(name)')
          .eq('store_id', storeId)
          .eq('user_id', userProfile.id)
          .eq('order_id', orderId)
          .single()

        if (existingChat) {
          setChat(existingChat as Chat)

          // Busca as mensagens iniciais
          const { data: initialMessages } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('chat_id', existingChat.id)
            .order('created_at', { ascending: true })

          if (initialMessages) {
            setMessages(initialMessages as Message[])
          }

          // Marca como lido quando o chat é aberto
          if (hasUnreadMessages) {
            await markAsRead()
          }

          cleanup = setupRealtimeSubscriptions(existingChat.id)
        } else {
          cleanup = setupRealtimeSubscriptions()
        }
      } catch (error) {
        console.error('Erro ao buscar chat:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChat()

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [userProfile?.id, storeId, orderId, isOpen, hasUnreadMessages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userProfile?.id || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    // Foca no input imediatamente após limpar a mensagem
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
    setIsSending(true)

    try {
      let chatId = chat?.id

      // Se não existir chat, cria um novo
      if (!chatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({
            store_id: storeId,
            user_id: userProfile.id,
            order_id: orderId,
            status: 'active',
            has_new_messages: false,
            last_viewed_at: new Date().toISOString(),
          })
          .select('*, store:stores(name)')
          .single()

        if (chatError) throw chatError
        if (!newChat) throw new Error('Erro ao criar chat')

        chatId = newChat.id
        setChat(newChat as Chat)

        // Configura real-time para o novo chat
        setupRealtimeSubscriptions(chatId)
      }

      if (!chatId) throw new Error('Chat ID não disponível')

      // Cria um ID temporário para a mensagem
      const tempMessageId = `temp-${Date.now()}`

      // Adiciona a mensagem localmente primeiro
      const tempMessage: Message = {
        id: tempMessageId,
        chat_id: chatId,
        sender_id: userProfile.id,
        content: messageContent,
        created_at: new Date().toISOString(),
        read_at: null,
      }

      setMessages((current) => [...current, tempMessage])

      // Envia a mensagem
      const { data: newMessage, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: userProfile.id,
          content: messageContent,
          read_at: null,
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Atualiza a mensagem temporária com a real
      if (newMessage) {
        setMessages((current) =>
          current.map((msg) =>
            msg.id === tempMessageId ? (newMessage as Message) : msg,
          ),
        )
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setNewMessage(messageContent)
      // Remove a mensagem temporária em caso de erro
      setMessages((current) =>
        current.filter((msg) => !msg.id.startsWith('temp-')),
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 dark:bg-[#343434]"
        >
          <div className="relative">
            <MessageCircle className="h-4 w-4" />
            {hasUnreadMessages && (
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          Contate a loja
        </Button>
      </DialogTrigger>
      <DialogContent
        className="flex h-[80vh] max-h-[600px] w-[90vw] flex-col p-0 focus-visible:outline-none dark:border-[#343434] dark:bg-[#1c1c1c] sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <DialogHeader className="border-b p-4 dark:border-[#343434]">
          <div className="flex items-center gap-2">
            <DialogTitle>Chat com {storeName}</DialogTitle>
            {chat?.status === 'closed' && (
              <Badge
                variant="outline"
                className="border-red-500/20 bg-red-500/10 text-red-500"
              >
                Fechado
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
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
                  <p className="text-sm leading-relaxed">{message.content}</p>
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
            ))}

            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <MessageCircle className="h-12 w-12 opacity-20" />
                <p>Nenhuma mensagem ainda</p>
                {chat?.status === 'closed' ? (
                  <p>
                    Este chat está fechado e não pode receber novas mensagens
                  </p>
                ) : (
                  <p>Comece uma conversa com a loja!</p>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4 dark:border-[#343434]">
          {chat?.status === 'closed' ? (
            <div className="flex items-center justify-center rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground dark:bg-[#161616]">
              <p>Este chat está fechado pois o pedido foi entregue</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="resize-none rounded-xl focus-visible:outline-none focus-visible:ring-primary dark:border-[#343434] dark:bg-[#262626]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                size="icon"
                className="aspect-square h-auto rounded-xl"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
