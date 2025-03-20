'use client'

import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Database } from '@/lib/database.types'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

type Store = Database['public']['Tables']['stores']['Row'] & {
  store_categories: {
    name: string
  } | null
}

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const fetchFeaturedRestaurants = async (): Promise<Store[]> => {
  const response = await fetch('/api/featured-restaurants')
  if (!response.ok) {
    throw new Error('Erro ao buscar restaurantes')
  }
  return response.json()
}

export function FeaturedRestaurants() {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['featured-restaurants'],
    queryFn: fetchFeaturedRestaurants,
  })

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

  if (stores.length === 0) {
    return null
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-lg font-bold tracking-tight dark:text-white">
        Restaurantes em Destaque
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stores.map((store) => (
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
                    <Star className="mr-1 h-4 w-4 text-yellow-400" />
                    <span>Novo</span>
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
