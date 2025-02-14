'use client'

import { Categories } from '@/components/Categories'
import { FeaturedRestaurants } from '@/components/FeaturedRestaurants'
import { Promotions } from '@/components/Promotions'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Categories />
        <FeaturedRestaurants />
        <Promotions />
      </main>
    </div>
  )
}
