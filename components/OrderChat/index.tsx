import { MessageCircle } from 'lucide-react'
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

interface OrderChatProps {
  orderId: string
  storeId: string
  storeName: string
}

export function OrderChat({ orderId, storeId, storeName }: OrderChatProps) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClientComponentClient<Database>()
  const { userProfile } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!userProfile?.id || !isOpen) return

    const fetchChat = async () => {
      setIsLoading(true)

      // Tenta buscar um chat existente
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*, store:stores(name)')
        .eq('store_id', storeId)
        .eq('user_id', userProfile.id)
        .eq('order_id', orderId)
        .single()

      if (existingChat) {
        setChat(existingChat as Chat)
      }

      setIsLoading(false)
    }

    fetchChat()
  }, [userProfile?.id, storeId, orderId, isOpen])

  useEffect(() => {
    if (!chat) return

    const fetchMessages = async () => {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true })

      if (messages) {
        setMessages(messages as Message[])
      }
    }

    fetchMessages()

    // Inscreve para atualizações em tempo real das mensagens
    const channel = supabase
      .channel(`chat-${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chat.id}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [chat])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userProfile?.id) return

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

        setChat(newChat as Chat)
        chatId = newChat.id
      }

      // Envia a mensagem
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: userProfile.id,
          content: newMessage.trim(),
          read_at: null,
        })

      if (messageError) throw messageError

      setNewMessage('')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 dark:bg-[#343434]">
          <MessageCircle className="h-4 w-4" />
          Contate a loja
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] max-h-[600px] w-[90vw] flex-col p-0 dark:border-[#343434] dark:bg-[#1c1c1c] sm:max-w-lg">
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
                    'max-w-[80%] rounded-lg p-3',
                    message.sender_id === userProfile?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted',
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  <span className="mt-1 block text-right text-xs opacity-70">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            ))}

            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <MessageCircle className="h-12 w-12" />
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
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="resize-none dark:border-[#343434] dark:bg-[#262626]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                Enviar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
