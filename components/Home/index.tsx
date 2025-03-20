import { Categories } from '@/components/Categories'
import { FeaturedRestaurants } from '@/components/FeaturedRestaurants'
import { Promotions } from '@/components/Promotions'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Categories />
      <FeaturedRestaurants />
      <Promotions />
    </div>
  )
}
