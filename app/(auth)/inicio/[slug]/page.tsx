'use client'

import { useEffect, useState, use } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { ProductGrid } from '@/components/ProductGrid'
import { CategoryFilter } from '@/components/CategoryFilter'
import { Skeleton } from '@/components/ui/skeleton'
import { StoreRatingsDialog } from '@/components/StoreRatingsDialog'
import type { Rating } from '@/components/StoreRatingsDialog'

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
  const [showRatings, setShowRatings] = useState(false)
  const [storeRatings, setStoreRatings] = useState<{
    average_rating: number
    total_ratings: number
    ratings: Rating[]
  }>({
    average_rating: 0,
    total_ratings: 0,
    ratings: [],
  })
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

        // Busca as avaliações da loja
        const { data: ratingsData, error: ratingsError } = await supabase.rpc(
          'get_store_ratings',
          {
            p_store_id: matchingStore.id,
          },
        )

        if (ratingsError) {
          console.error('Erro ao buscar avaliações:', ratingsError)
        } else if (ratingsData?.[0]) {
          const {
            avg_rating: averageRating,
            total_ratings: totalRatings,
            ratings,
          } = ratingsData[0]

          const storeRatingsData = {
            average_rating: Number(averageRating) || 0,
            total_ratings: Number(totalRatings) || 0,
            ratings: Array.isArray(ratings) ? ratings : [],
          }

          setStoreRatings(storeRatingsData)
        }
      }

      setIsLoading(false)
    }

    fetchStoreAndProducts()
  }, [resolvedParams.slug])

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Banner Skeleton */}
        <div className="mb-8">
          <Skeleton className="relative mb-6 h-[300px] w-full rounded-lg bg-gray-200 dark:bg-[#262626]" />
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-48 bg-gray-200 dark:bg-[#262626]" />
              <Skeleton className="h-4 w-4 bg-gray-200 dark:bg-[#262626]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-[#262626]" />
              <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <Skeleton className="h-4 w-16 bg-gray-200 dark:bg-[#262626]" />
            </div>
          </div>
        </div>

        {/* Menu Section Skeleton */}
        <div className="mt-8">
          <Skeleton className="mb-6 h-7 w-32 bg-gray-200 dark:bg-[#262626]" />

          {/* Categories Skeleton */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-8 w-24 flex-shrink-0 rounded-full bg-gray-200 dark:bg-[#262626]"
              />
            ))}
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg border dark:border-[#343434] dark:bg-[#232323]"
              >
                <Skeleton className="h-48 w-full bg-gray-200 dark:bg-[#262626]" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-5 w-3/4 bg-gray-200 dark:bg-[#262626]" />
                  <Skeleton className="h-4 w-1/4 bg-gray-200 dark:bg-[#262626]" />
                  <Skeleton className="h-4 w-full bg-gray-200 dark:bg-[#262626]" />
                  <Skeleton className="h-4 w-1/3 bg-gray-200 dark:bg-[#262626]" />
                  <Skeleton className="h-9 w-full bg-gray-200 dark:bg-[#262626]" />
                </div>
              </div>
            ))}
          </div>
        </div>
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
            quality={100}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight dark:text-white">
              {store.name}
            </h1>
            <button
              onClick={() => setShowRatings(true)}
              className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-gray-100 dark:hover:bg-[#343434]"
            >
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{storeRatings.average_rating}</span>
              <span className="text-sm text-gray-500">
                ({storeRatings.total_ratings})
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{store.store_categories?.name}</span>
            <span>•</span>
            <span>Aberto</span>
          </div>
        </div>
      </div>

      <StoreRatingsDialog
        isOpen={showRatings}
        onClose={() => setShowRatings(false)}
        ratings={storeRatings.ratings}
        averageRating={storeRatings.average_rating}
        totalRatings={storeRatings.total_ratings}
      />

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
