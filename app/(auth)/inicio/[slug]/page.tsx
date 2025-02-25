'use client'

import { useEffect, useState, use } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { ProductGrid } from '@/components/ProductGrid'
import { CategoryFilter } from '@/components/CategoryFilter'

type Store = Database['public']['Tables']['stores']['Row'] & {
  store_categories: {
    name: string
  } | null
}

type Product = Database['public']['Tables']['products']['Row'] & {
  product_categories: {
    name: string
  } | null
  description: string
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      const { data: stores, error } = await supabase.from('stores').select(
        `
          *,
          store_categories (
            name
          )
        `,
      )

      if (error) {
        console.error('Erro ao buscar loja:', error)
        setIsLoading(false)
        return
      }

      // Encontra a loja que corresponde ao slug
      const matchingStore = stores?.find(
        (s) => generateSlug(s.name) === resolvedParams.slug,
      )
      setStore(matchingStore || null)

      if (matchingStore) {
        // Busca os produtos da loja
        const { data: storeProducts, error: productsError } = await supabase
          .from('products')
          .select(
            `
            *,
            product_categories (
              name
            )
          `,
          )
          .eq('store_id', matchingStore.id)
          .eq('is_available', true)
          .order('created_at', { ascending: false })

        if (productsError) {
          console.error('Erro ao buscar produtos:', productsError)
        } else {
          setProducts(storeProducts || [])
        }
      }

      setIsLoading(false)
    }

    fetchStoreAndProducts()
  }, [resolvedParams.slug])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-gray-900 dark:border-white" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Restaurante não encontrado</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            O restaurante que você está procurando não existe.
          </p>
        </div>
      </div>
    )
  }

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
    <div className="">
      <div className="mb-8">
        <div className="relative mb-6 h-[300px] w-full overflow-hidden rounded-lg">
          <Image
            src={store.logo_url || '/placeholder-restaurant.png'}
            alt={store.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight dark:text-white">
              {store.name}
            </h1>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{store.store_categories?.name}</span>
            <span>•</span>
            <span>Aberto</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-6 text-lg font-bold tracking-tight">Cardápio</h2>
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  )
}
