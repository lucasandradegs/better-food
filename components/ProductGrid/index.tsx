import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Database } from '@/lib/database.types'
import { useCart } from '@/contexts/CartContext'

type Product = Database['public']['Tables']['products']['Row'] & {
  product_categories: {
    name: string
  } | null
  description: string
}

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const { addItem } = useCart()

  if (products.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhum produto cadastrado ainda
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card
          key={product.id}
          className="flex flex-col dark:border-[#343434] dark:bg-[#232323]"
        >
          <CardHeader>
            <Image
              src={product.image_url || '/better-food.png'}
              alt={product.name}
              width={200}
              height={200}
              className="h-48 w-full rounded-t-lg object-cover"
              quality={100}
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </CardHeader>
          <CardContent className="flex-grow pb-2">
            <CardTitle className="mb-1 text-base font-medium">
              {product.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {product.product_categories?.name}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {product.description}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-between">
            <span className="flex-start flex w-full text-sm font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(product.price)}
            </span>
            <Button
              variant="default"
              className="mt-3 w-full"
              onClick={() =>
                addItem({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image_url: product.image_url,
                  store_id: product.store_id,
                })
              }
            >
              Adicionar ao Carrinho
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
