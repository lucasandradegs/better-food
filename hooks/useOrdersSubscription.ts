import { useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { Database } from '@/lib/database.types'

export function useOrdersSubscription(isAdmin: boolean) {
  const supabase = createClientComponentClient<Database>()
  const queryClient = useQueryClient()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>

    async function setupSubscription() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      if (isAdmin) {
        // Buscar o ID da loja do admin
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('admin_id', user.id)
          .single()

        if (!storeData?.id) return

        // Inscrever nos pedidos da loja
        channel = supabase
          .channel('orders-admin')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `store_id=eq.${storeData.id}`,
            },
            () => {
              // Invalidar o cache para recarregar os pedidos
              queryClient.invalidateQueries({ queryKey: ['orders'] })
            },
          )
          .subscribe()
      } else {
        // Inscrever nos pedidos do cliente
        channel = supabase
          .channel('orders-customer')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              // Invalidar o cache para recarregar os pedidos
              queryClient.invalidateQueries({ queryKey: ['orders'] })
            },
          )
          .subscribe()
      }
    }

    setupSubscription()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [supabase, isAdmin, queryClient])
}
