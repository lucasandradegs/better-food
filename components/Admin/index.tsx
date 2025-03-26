'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { DashboardStats } from './DashboardStats'
import { ProductForm } from './ProductForm'
import { ProductList } from './ProductList'
import { Skeleton } from '../ui/skeleton'
import { queryClient } from '@/app/providers'
import Link from 'next/link'
import { Button } from '../ui/button'

const fetchUserStore = async () => {
  const response = await fetch('/api/user-store')
  if (!response.ok) {
    throw new Error('Erro ao buscar loja')
  }
  return response.json()
}

const fetchDashboardStats = async (storeId: string) => {
  const response = await fetch(`/api/dashboard/stats?storeId=${storeId}`)
  if (!response.ok) {
    throw new Error('Erro ao buscar estatísticas')
  }
  return response.json()
}

const fetchProducts = async (storeId: string) => {
  const response = await fetch(`/api/stores/${storeId}/products`)
  if (!response.ok) {
    throw new Error('Erro ao buscar produtos')
  }
  return response.json()
}

const fetchProductCategories = async () => {
  const response = await fetch('/api/product-categories')
  if (!response.ok) {
    throw new Error('Erro ao buscar categorias')
  }
  return response.json()
}

export default function AdminDashboard() {
  const supabase = createClientComponentClient<Database>()

  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['user-store'],
    queryFn: fetchUserStore,
  })

  const {
    data: dashboardStats = {
      todaySales: 0,
      todayOrders: 0,
      averageTicket: 0,
      previousDaySales: 0,
      previousDayOrders: 0,
      previousDayTicket: 0,
      totalOrders: 0,
      totalSales: 0,
    },
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['dashboard-stats', store?.id],
    queryFn: () => fetchDashboardStats(store?.id),
    enabled: !!store?.id,
  })

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', store?.id],
    queryFn: () => fetchProducts(store?.id),
    enabled: !!store?.id,
  })

  const { data: productCategories = [], isLoading: isLoadingCategories } =
    useQuery({
      queryKey: ['product-categories'],
      queryFn: fetchProductCategories,
    })

  // Configurar os listeners do Supabase para atualizações em tempo real
  useEffect(() => {
    if (!store?.id) return

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
          queryClient.invalidateQueries({
            queryKey: ['dashboard-stats', store.id],
          })
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
          queryClient.invalidateQueries({
            queryKey: ['dashboard-stats', store.id],
          })
        },
      )
      .subscribe()

    // Inscreve para atualizações em tempo real dos produtos
    const productsChannel = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${store.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['products', store.id] })
        },
      )
      .subscribe()

    return () => {
      ordersChannel.unsubscribe()
      storesChannel.unsubscribe()
      productsChannel.unsubscribe()
    }
  }, [store?.id, supabase])

  const handleProductCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['products', store?.id] })
  }

  const isLoading =
    isLoadingStore || isLoadingStats || isLoadingProducts || isLoadingCategories

  return (
    <div className="">
      <main className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {isLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <h1 className="text-lg font-bold tracking-tight dark:text-white">
                {store?.name} - Dashboard
              </h1>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie seus produtos e acompanhe suas vendas
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link href="/dashboard/insights" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full dark:bg-[#232323] dark:hover:bg-[#262626] sm:w-auto"
              >
                Ver insights (BETA)
              </Button>
            </Link>
            <ProductForm
              productCategories={productCategories}
              onProductCreated={handleProductCreated}
              storeId={store?.id}
            />
          </div>
        </div>

        <DashboardStats {...dashboardStats} />
        <ProductList
          products={products}
          productCategories={productCategories}
          onProductUpdated={handleProductCreated}
          isLoading={isLoading}
          storeId={store?.id}
        />
      </main>
    </div>
  )
}
