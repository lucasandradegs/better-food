'use client'

import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { useCategoryStore } from '@/store/useCategoryStore'

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
    image: '/macarraoQ.png',
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

export function Categories() {
  const { selectedCategory, setSelectedCategory } = useCategoryStore()

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(categoryName)
    }
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-lg font-bold tracking-tight dark:text-white">
        Categorias
      </h2>
      <div className="hidden gap-4 sm:grid sm:grid-cols-3 md:grid-cols-6">
        {categories.map((category) => (
          <div
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className={`group relative flex cursor-pointer flex-col items-center overflow-hidden rounded-2xl transition-all duration-300 ${
              selectedCategory === category.name
                ? 'scale-105 shadow-lg'
                : 'hover:scale-105 hover:shadow-lg'
            }`}
          >
            <div
              className={`absolute top-0 h-1/2 w-full transition-all duration-300 ${
                category.bgColor
              } ${
                selectedCategory === category.name
                  ? 'opacity-100'
                  : 'opacity-75 group-hover:opacity-90'
              }`}
            />
            <div className="relative flex aspect-square w-full items-center justify-center p-4">
              <Image
                src={category.image || '/placeholder.svg'}
                alt={category.name}
                width={256}
                height={256}
                quality={100}
                priority
                sizes="(max-width: 640px) 33vw, 16vw"
                className={`h-full w-full object-contain transition-transform duration-300 ${
                  selectedCategory === category.name
                    ? 'scale-110'
                    : 'group-hover:scale-105'
                }`}
              />
            </div>
            <span
              className={`pb-3 text-sm font-medium transition-colors duration-300 ${
                selectedCategory === category.name
                  ? 'font-semibold text-primary'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
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
                <div
                  onClick={() => handleCategoryClick(category.name)}
                  className={`group relative flex cursor-pointer flex-col items-center overflow-hidden rounded-2xl transition-all duration-300 ${
                    selectedCategory === category.name
                      ? 'scale-105 shadow-lg'
                      : 'hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  <div
                    className={`absolute top-0 h-1/2 w-full transition-all duration-300 ${
                      category.bgColor
                    } ${
                      selectedCategory === category.name
                        ? 'opacity-100'
                        : 'opacity-75 group-hover:opacity-90'
                    }`}
                  />
                  <div className="relative flex aspect-square w-full items-center justify-center p-4">
                    <Image
                      src={category.image || '/placeholder.svg'}
                      alt={category.name}
                      width={256}
                      height={256}
                      className={`h-full w-full object-contain transition-transform duration-300 ${
                        selectedCategory === category.name
                          ? 'scale-110'
                          : 'group-hover:scale-105'
                      }`}
                      priority
                    />
                  </div>
                  <span
                    className={`pb-3 text-sm font-medium transition-colors duration-300 ${
                      selectedCategory === category.name
                        ? 'font-semibold text-primary'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
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
  )
}
