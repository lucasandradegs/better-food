'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { Database } from '@/lib/database.types'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product: {
    name: string
    image_url: string | null
  }
}

interface Order {
  id: string
  total_amount: number
  status: Database['public']['Enums']['order_status']
  items: OrderItem[]
}

export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setIsLoading(false)
        return
      }

      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderError) throw orderError

        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(
            `
            *,
            product:products (
              name,
              image_url
            )
          `,
          )
          .eq('order_id', orderId)

        if (itemsError) throw itemsError

        setOrder({
          ...orderData,
          items: itemsData,
        })
      } catch (error) {
        console.error('Erro ao buscar pedido:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, supabase])

  return { order, isLoading }
}
