'use client'

import { Star, Store } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { RoleGuard } from '@/components/RoleGuard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'

const categories = [
  {
    name: 'Pizza',
    image: '/pizzaa.png',
    bgColor: 'bg-pink-100',
  },
  {
    name: 'Carnes',
    image: '/carne.png',
    bgColor: 'bg-pink-100',
  },
  {
    name: 'Italiana',
    image: '/macarrao1.png',
    bgColor: 'bg-green-100',
  },
  {
    name: 'Japonesa',
    image: '/sushi.png',
    bgColor: 'bg-blue-100',
  },
  {
    name: 'Vegetariana',
    image: '/vegetariana.png',
    bgColor: 'bg-green-100',
  },
  {
    name: 'Bebidas',
    image: '/bebidas.png',
    bgColor: 'bg-purple-100',
  },
]

const restaurants = [
  {
    name: 'Pizzaria Bella Napoli',
    rating: 4.8,
    deliveryTime: '30-45',
    image: '/logoPizzaria.png',
  },
  {
    name: 'Burger House',
    rating: 4.5,
    deliveryTime: '25-40',
    image: '/logoHamburguer.png',
  },
  {
    name: 'Sushi Zen',
    rating: 4.7,
    deliveryTime: '40-55',
    image: '/sushiDark.png',
  },
  {
    name: 'Taco Fiesta',
    rating: 4.6,
    deliveryTime: '35-50',
    image: '/logoMexicana.png',
  },
]

export default function HomePage() {
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <RoleGuard allowedRoles={['admin']}>
          <div className="mb-8 flex justify-end">
            <Dialog
              open={isStoreDialogOpen}
              onOpenChange={setIsStoreDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Store className="mr-2 h-4 w-4" />
                  Cadastre sua loja
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] w-[85%] overflow-y-auto rounded-lg lg:max-w-[625px] dark:bg-[#262626]">
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Loja</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes da sua loja. Clique em salvar quando
                    terminar.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da loja</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Pizzaria Bella Napoli"
                      className="text-sm dark:bg-[#161616]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select>
                      <SelectTrigger className="text-sm dark:bg-[#161616]">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pizzaria">Pizzaria</SelectItem>
                        <SelectItem value="hamburgueria">
                          Hamburgueria
                        </SelectItem>
                        <SelectItem value="sushi">Sushi</SelectItem>
                        <SelectItem value="mexicana">Mexicana</SelectItem>
                        <SelectItem value="doceria">Doceria</SelectItem>
                        <SelectItem value="cafeteria">Cafeteria</SelectItem>
                        <SelectItem value="sorveteria">Sorveteria</SelectItem>
                        <SelectItem value="restaurante">Restaurante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Logo da loja</Label>
                    <div className="grid gap-4">
                      <Input
                        id="logo"
                        type="file"
                        className="text-sm dark:bg-[#161616]"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      {logoPreview && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border dark:border-[#2e2e2e]">
                          <Image
                            src={logoPreview}
                            alt="Preview da logo"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsStoreDialogOpen(false)
                      setLogoPreview(null)
                    }}
                    className="w-full bg-transparent sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    Cadastrar loja
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </RoleGuard>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold dark:text-white">
            Categorias
          </h2>
          <div className="hidden gap-4 sm:grid sm:grid-cols-3 md:grid-cols-6">
            {categories.map((category) => (
              <div
                key={category.name}
                className="group relative flex cursor-pointer flex-col items-center overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div
                  className={`absolute top-0 h-1/2 w-full ${category.bgColor}`}
                />
                <div className="relative flex aspect-square w-full items-center justify-center p-4">
                  <Image
                    src={category.image || '/placeholder.svg'}
                    alt={category.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
          <div className="-mx-4 px-4 sm:hidden">
            <Carousel className="w-full">
              <CarouselContent className="-ml-2">
                {categories.map((category) => (
                  <CarouselItem key={category.name} className="basis-1/3 pl-2">
                    <div className="group relative flex cursor-pointer flex-col items-center overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <div
                        className={`absolute top-0 h-1/2 w-full ${category.bgColor}`}
                      />
                      <div className="relative flex aspect-square w-full items-center justify-center p-4">
                        <Image
                          src={category.image || '/placeholder.svg'}
                          alt={category.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-contain"
                          priority
                        />
                      </div>
                      <span className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category.name}
                      </span>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden" />
              <CarouselNext className="hidden" />
            </Carousel>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold dark:text-white">
            Restaurantes em Destaque
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.name}
                className="overflow-hidden transition-all duration-300 hover:scale-[102%] hover:shadow-lg dark:bg-gray-800"
              >
                <Image
                  src={restaurant.image || '/placeholder.svg'}
                  alt={restaurant.name}
                  width={300}
                  height={200}
                  className="h-48 w-full object-cover"
                  priority
                />
                <CardContent className="p-4 dark:bg-[#262626]">
                  <h3 className="mb-2 font-semibold dark:text-white">
                    {restaurant.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                    <Star className="mr-1 h-4 w-4 text-yellow-400" />
                    <span>{restaurant.rating}</span>
                    <span className="mx-2">•</span>
                    <span>{restaurant.deliveryTime} min</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold dark:text-white">
            Promoções
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              <CardContent className="p-6">
                <h3 className="mb-2 text-xl font-bold">
                  50% OFF na primeira compra
                </h3>
                <p className="mb-4">Use o código NOVO50 e aproveite!</p>
                <Badge variant="secondary" className="bg-white text-indigo-600">
                  NOVO50
                </Badge>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-red-500 to-red-800 text-white">
              <CardContent className="p-6">
                <h3 className="mb-2 text-xl font-bold">Frete grátis</h3>
                <p className="mb-4">Em pedidos acima de R$ 50</p>
                <Badge variant="secondary" className="bg-white text-red-600">
                  FRETEFREE
                </Badge>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
