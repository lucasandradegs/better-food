'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { useEffect, useState } from 'react'
import { CategoryFilter } from '@/components/CategoryFilter'
import { ProductGrid } from '@/components/ProductGrid'

type Product = Database['public']['Tables']['products']['Row'] & {
  product_categories: {
    name: string
  } | null
  description: string
}

export default function StorePage({ params }: { params: { id: string } }) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [storeName, setStoreName] = useState('')
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('id', params.id)
        .single()

      if (store) {
        setStoreName(store.name)
      }

      const { data } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories (
            name
          )
        `,
        )
        .eq('store_id', params.id)
        .eq('is_available', true)
        .order('created_at', { ascending: false })

      if (data) {
        setProducts(data)
      }
    }

    fetchProducts()
  }, [params.id])

  // Extrai as categorias únicas dos produtos
  const categories = Array.from(
    new Set(
      products
        .filter((product) => product.product_categories?.name)
        .map((product) => product.product_categories!.name),
    ),
  ).sort()

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === 'Todos') return true
    return product.product_categories?.name === selectedCategory
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold dark:text-white">{storeName}</h1>
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <ProductGrid products={filteredProducts} />
    </div>
  )
}
