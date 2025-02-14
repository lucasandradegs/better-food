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
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    [],
  )

  const supabase = createClientComponentClient<Database>()
  const { userProfile } = useAuth()

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
    <div className="min-h-screen">
      <main className="space-y-8 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
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

        <DashboardStats />
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
