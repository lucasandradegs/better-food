'use client'

import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Database } from '@/lib/database.types'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useCategoryStore } from '@/store/useCategoryStore'

type Store = Database['public']['Tables']['stores']['Row'] & {
  store_categories: {
    name: string
  } | null
  ratings_summary?: {
    average_rating: number
    total_ratings: number
  }
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const categoryMapping: Record<string, string> = {
  Pizza: 'd0b5e2f9-0bf0-4936-b200-cbfce73fe6d4',
  Japonesa: '3d5e0c2f-08c9-4751-a89e-042621cf03bf',
  Carnes: '5f743533-0879-410d-b907-9089cb40d4c3',
  Italiana: '5f743533-0879-410d-b907-9089cb40d4c3',
  Vegetariana: '5f743533-0879-410d-b907-9089cb40d4c3',
  Bebidas: '1004c5c7-3871-42f7-a761-cff63f643ca0',
}

const fetchFeaturedRestaurants = async (): Promise<Store[]> => {
  const response = await fetch('/api/featured-restaurants')
  if (!response.ok) {
    throw new Error('Erro ao buscar restaurantes')
  }
  const stores = await response.json()

  // Buscar as avaliações para cada restaurante
  const storesWithRatings = await Promise.all(
    stores.map(async (store: Store) => {
      const ratingResponse = await fetch(`/api/store-ratings/${store.id}`)
      if (ratingResponse.ok) {
        const ratingsData = await ratingResponse.json()
        return {
          ...store,
          ratings_summary: {
            average_rating: Number(ratingsData.average_rating) || 0,
            total_ratings: Number(ratingsData.total_ratings) || 0,
          },
        }
      }
      return store
    }),
  )

  return storesWithRatings
}

export function FeaturedRestaurants() {
  const { selectedCategory } = useCategoryStore()
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['featured-restaurants'],
    queryFn: fetchFeaturedRestaurants,
  })

  const filteredStores = selectedCategory
    ? stores.filter(
        (store) => store.category_id === categoryMapping[selectedCategory],
      )
    : stores

  if (isLoading) {
    return (
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">
          Restaurantes em Destaque
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="overflow-hidden transition-all duration-300 hover:scale-[102%] hover:shadow-lg dark:bg-[#262626]"
            >
              <div className="h-48 w-full animate-pulse bg-gray-200 dark:bg-[#232323]" />
              <CardContent className="p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-[#232323]" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-[#232323]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (filteredStores.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-bold tracking-tight dark:text-white">
          Restaurantes em Destaque
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum restaurante encontrado nesta categoria.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-lg font-bold tracking-tight dark:text-white">
        {selectedCategory
          ? `Restaurantes - ${selectedCategory}`
          : 'Restaurantes em Destaque'}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filteredStores.map((store) => (
          <Link
            key={store.id}
            href={`/inicio/${generateSlug(store.name)}`}
            className="block"
          >
            <Card className="overflow-hidden transition-all duration-300 hover:scale-[102%] hover:shadow-lg dark:border-[#343434] dark:bg-[#262626]">
              <div className="relative h-48 w-full">
                <Image
                  src={store.logo_url || '/placeholder-restaurant.png'}
                  alt={store.name}
                  fill
                  className="object-cover"
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <CardContent className="p-4 dark:bg-[#232323]">
                <h3 className="mb-2 font-semibold dark:text-white">
                  {store.name}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-300">
                  <span>{store.store_categories?.name}</span>
                  <div className="flex items-center">
                    {store.ratings_summary?.total_ratings ? (
                      <>
                        <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {store.ratings_summary.average_rating.toFixed(1)}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">
                          ({store.ratings_summary.total_ratings})
                        </span>
                      </>
                    ) : (
                      <>
                        <Star className="mr-1 h-4 w-4 text-yellow-400" />
                        <span>Novo</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
