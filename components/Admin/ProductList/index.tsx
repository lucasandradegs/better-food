import { ChevronDown, Pencil, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { Database } from '@/lib/database.types'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ProductForm } from '../ProductForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function ProductListSkeleton() {
  return (
    <div className="rounded-lg shadow dark:bg-[#262626]">
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-7 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
      <div className="border-t dark:border-[#2e2e2e]">
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Preço</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((index) => (
                <tr
                  key={index}
                  className="border-b last:border-b-0 dark:border-[#2e2e2e]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

type Product = Database['public']['Tables']['products']['Row'] & {
  product_categories: {
    name: string
  } | null
  description: string
}

interface ProductListProps {
  products: Product[]
  productCategories: Database['public']['Tables']['product_categories']['Row'][]
  onProductUpdated: () => void
  isLoading?: boolean
  storeId?: string
}

export function ProductList({
  products,
  productCategories,
  onProductUpdated,
  isLoading = false,
  storeId,
}: ProductListProps) {
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { toast } = useToast()

  if (isLoading) {
    return <ProductListSkeleton />
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' ||
      product.product_categories?.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDelete = async () => {
    if (!productToDelete || !storeId) return

    try {
      const response = await fetch(
        `/api/stores/${storeId}/products/${productToDelete.id}`,
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        throw new Error('Erro ao excluir produto')
      }

      toast({
        title: 'Sucesso!',
        description: 'Produto excluído com sucesso',
      })

      onProductUpdated()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o produto',
        variant: 'destructive',
      })
    } finally {
      setProductToDelete(null)
    }
  }

  return (
    <div className="rounded-lg bg-white shadow dark:border dark:border-[#343434] dark:bg-[#262626]">
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold dark:text-white">Produtos</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Buscar produto..."
                className="pl-8 dark:border-[#343434]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="dark:border-[#343434] dark:bg-[#262626]"
                >
                  {selectedCategory === 'all'
                    ? 'Todas as Categorias'
                    : selectedCategory}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dark:border-[#343434] dark:bg-[#262626]">
                <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                  Todas as Categorias
                </DropdownMenuItem>
                {productCategories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    className="hover:bg-gray-100 dark:hover:bg-[#343434]"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="border-t dark:border-[#2e2e2e]">
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Preço</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b last:border-b-0 dark:border-[#2e2e2e]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={product.image_url || '/better-food.png'}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded-md"
                      />
                      <span className="font-medium dark:text-white">
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {product.product_categories?.name}
                  </td>
                  <td className="px-6 py-4 dark:text-white">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(product.price)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        product.is_available ? 'secondary' : 'destructive'
                      }
                      className={`dark:border-[#343434] dark:bg-[#1c1c1c] ${
                        !product.is_available && 'bg-red-500 dark:bg-red-500'
                      }`}
                    >
                      {product.is_available ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProductToEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProductToDelete(product)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {productToEdit && (
        <ProductForm
          productCategories={productCategories}
          onProductCreated={onProductUpdated}
          productToEdit={productToEdit}
          onClose={() => setProductToEdit(null)}
          storeId={storeId}
        />
      )}

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
      >
        <AlertDialogContent className="w-[85%] rounded-lg dark:border-[#343434] dark:bg-[#1c1c1c] lg:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              produto &quot;{productToDelete?.name}&quot; e removerá os dados do
              servidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-[#343434] dark:bg-[#262626]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
