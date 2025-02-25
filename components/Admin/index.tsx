'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardStats } from './DashboardStats'
import { ProductForm } from './ProductForm'
import { ProductList } from './ProductList'
import { Skeleton } from '../ui/skeleton'

type ProductCategory = Database['public']['Tables']['product_categories']['Row']
type Product = Database['public']['Tables']['products']['Row'] & {
  product_categories: {
    name: string
  } | null
  description: string
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [storeName, setStoreName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [, setStoreId] = useState<string | null>(null)
  const [dashboardStats, setDashboardStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    averageTicket: 0,
    previousDaySales: 0,
    previousDayOrders: 0,
    previousDayTicket: 0,
    totalOrders: 0,
    totalSales: 0,
  })
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    [],
  )

  const supabase = createClientComponentClient<Database>()
  const { userProfile } = useAuth()

  // Função para buscar dados do dashboard
  const fetchDashboardData = async (storeId: string) => {
    // Obtém a data local e ajusta para o início do dia em UTC
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    // Ajusta para UTC considerando o offset local
    const todayUTC = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000,
    )

    const yesterday = new Date(todayUTC)
    yesterday.setDate(yesterday.getDate() - 1)

    const tomorrow = new Date(todayUTC)
    tomorrow.setDate(tomorrow.getDate() + 1)

    console.log('Períodos de busca:', {
      hoje: {
        inicio: todayUTC.toISOString(),
        fim: tomorrow.toISOString(),
      },
      ontem: {
        inicio: yesterday.toISOString(),
        fim: todayUTC.toISOString(),
      },
    })

    // Buscar pedidos de hoje
    const { data: todayOrdersData } = await supabase
      .from('orders')
      .select(
        `
        id, 
        total_amount,
        created_at,
        payments!inner (
          status
        )
      `,
      )
      .eq('store_id', storeId)
      .eq('payments.status', 'PAID')
      .gte('created_at', todayUTC.toISOString())
      .lt('created_at', tomorrow.toISOString())

    // Buscar pedidos de ontem
    const { data: yesterdayOrdersData } = await supabase
      .from('orders')
      .select(
        `
        id, 
        total_amount,
        created_at,
        payments!inner (
          status
        )
      `,
      )
      .eq('store_id', storeId)
      .eq('payments.status', 'PAID')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', todayUTC.toISOString())

    console.log('Pedidos encontrados:', {
      hoje: todayOrdersData,
      ontem: yesterdayOrdersData,
    })

    // Buscar total de pedidos
    const { data: storeData } = await supabase
      .from('stores')
      .select('order_count')
      .eq('id', storeId)
      .single()

    // Buscar total de vendas
    const { data: allOrders } = await supabase
      .from('orders')
      .select(
        `
        total_amount,
        payments!inner (
          status
        )
      `,
      )
      .eq('store_id', storeId)
      .eq('payments.status', 'PAID')

    const todayOrders = todayOrdersData || []
    const yesterdayOrders = yesterdayOrdersData || []

    const todaySales = todayOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0,
    )
    const previousDaySales = yesterdayOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0,
    )

    const totalSales = (allOrders || []).reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0,
    )

    const averageTicket =
      todayOrders.length > 0 ? todaySales / todayOrders.length : 0
    const previousDayTicket =
      yesterdayOrders.length > 0 ? previousDaySales / yesterdayOrders.length : 0

    console.log('Cálculos finais:', {
      todaySales,
      todayOrders: todayOrders.length,
      averageTicket,
      previousDaySales,
      previousDayOrders: yesterdayOrders.length,
      previousDayTicket,
      totalOrders: storeData?.order_count || 0,
      totalSales,
    })

    setDashboardStats({
      todaySales,
      todayOrders: todayOrders.length,
      averageTicket,
      previousDaySales,
      previousDayOrders: yesterdayOrders.length,
      previousDayTicket,
      totalOrders: storeData?.order_count || 0,
      totalSales,
    })
  }

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userProfile?.id) return

      setIsLoading(true)

      const { data: store } = await supabase
        .from('stores')
        .select('id, name')
        .eq('admin_id', userProfile.id)
        .single()

      if (!store) return

      setStoreName(store.name)
      setStoreId(store.id)

      // Buscar dados do dashboard
      await fetchDashboardData(store.id)

      // Inscrever para atualizações em tempo real dos pedidos
      const ordersChannel = supabase
        .channel('orders_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `store_id=eq.${store.id}`,
          },
          () => {
            // Atualizar dados do dashboard quando houver mudanças nos pedidos
            fetchDashboardData(store.id)
          },
        )
        .subscribe()

      // Inscrever para atualizações em tempo real da loja
      const storesChannel = supabase
        .channel('stores_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'stores',
            filter: `id=eq.${store.id}`,
          },
          () => {
            // Atualizar dados do dashboard quando houver mudanças na loja
            fetchDashboardData(store.id)
          },
        )
        .subscribe()

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
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar produtos:', error)
        return
      }

      setProducts(data || [])
      setIsLoading(false)

      // Inscreve para atualizações em tempo real
      const channel = supabase
        .channel('products_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: `store_id=eq.${store.id}`,
          },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              // Busca os detalhes completos do produto incluindo a categoria
              const { data: newProduct } = await supabase
                .from('products')
                .select(
                  `
                  *,
                  product_categories (
                    name
                  )
                `,
                )
                .eq('id', payload.new.id)
                .single()

              if (newProduct) {
                setProducts((current) => [newProduct, ...current])
              }
            } else if (payload.eventType === 'DELETE') {
              setProducts((current) =>
                current.filter((product) => product.id !== payload.old.id),
              )
            } else if (payload.eventType === 'UPDATE') {
              // Busca os detalhes atualizados do produto
              const { data: updatedProduct } = await supabase
                .from('products')
                .select(
                  `
                  *,
                  product_categories (
                    name
                  )
                `,
                )
                .eq('id', payload.new.id)
                .single()

              if (updatedProduct) {
                setProducts((current) =>
                  current.map((product) =>
                    product.id === updatedProduct.id ? updatedProduct : product,
                  ),
                )
              }
            }
          },
        )
        .subscribe()

      return () => {
        ordersChannel.unsubscribe()
        storesChannel.unsubscribe()
        channel.unsubscribe()
      }
    }

    fetchProducts()
  }, [userProfile?.id, refreshKey])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Erro ao buscar categorias:', error)
        return
      }

      setProductCategories(data || [])
    }

    fetchCategories()
  }, [])

  const handleProductCreated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="">
      <main className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <h1 className="text-lg font-bold tracking-tight dark:text-white">
                {storeName} - Dashboard
              </h1>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie seus produtos e acompanhe suas vendas
            </p>
          </div>
          <ProductForm
            productCategories={productCategories}
            onProductCreated={handleProductCreated}
          />
        </div>

        <DashboardStats {...dashboardStats} />
        <ProductList
          products={products}
          productCategories={productCategories}
          onProductUpdated={handleProductCreated}
          isLoading={isLoading}
        />
      </main>
    </div>
  )
}
