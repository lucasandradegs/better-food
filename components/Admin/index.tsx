'use client'

import { useState } from 'react'
import {
  ChevronDown,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'

export default function AdminDashboard() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen">
      <main className="space-y-8 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight dark:text-white">
              Burger House - Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gerencie seus produtos e acompanhe suas vendas
            </p>
          </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[85%] overflow-y-auto rounded-lg lg:max-w-[625px] dark:bg-[#262626]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do produto. Clique em salvar quando
                  terminar.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome do produto</Label>
                    <Input
                      id="name"
                      placeholder="Ex: X-Burger Especial"
                      className="text-sm dark:bg-[#161616]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Preço</Label>
                    <Input
                      id="price"
                      placeholder="Ex: 29.90"
                      className="text-sm dark:bg-[#161616]"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva os ingredientes e características do produto"
                    className="min-h-[80px] text-sm dark:bg-[#161616]"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select>
                      <SelectTrigger className="text-sm dark:bg-[#161616]">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="burgers">Hambúrgueres</SelectItem>
                        <SelectItem value="drinks">Bebidas</SelectItem>
                        <SelectItem value="sides">Acompanhamentos</SelectItem>
                        <SelectItem value="desserts">Sobremesas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Disponibilidade</Label>
                    <div className="flex h-10 items-center space-x-2">
                      <Switch
                        id="status"
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                      />
                      <Label htmlFor="status">Disponível para venda</Label>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Imagem do produto</Label>
                  <div className="grid gap-4">
                    <Input
                      id="picture"
                      type="file"
                      className="text-sm dark:bg-[#161616]"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border dark:border-[#2e2e2e]">
                        <Image
                          src={imagePreview}
                          alt="Preview do produto"
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
                    setIsEditDialogOpen(false)
                    setImagePreview(null)
                  }}
                  className="w-full bg-transparent sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Salvar produto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white dark:bg-[#262626]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 2.350,00</div>
              <p className="text-muted-foreground text-xs">
                +20.1% em relação a ontem
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#262626]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pedidos Hoje
              </CardTitle>
              <ShoppingBag className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-muted-foreground text-xs">
                +15% em relação a ontem
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#262626]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ticket Médio
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 55,95</div>
              <p className="text-muted-foreground text-xs">
                +2.5% em relação a ontem
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#262626]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32 min</div>
              <p className="text-muted-foreground text-xs">
                -3 min em relação a ontem
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg bg-white shadow dark:bg-[#262626]">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold dark:text-white">
                Produtos
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <Input placeholder="Buscar produto..." className="pl-8" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Categoria
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Todos</DropdownMenuItem>
                    <DropdownMenuItem>Hambúrgueres</DropdownMenuItem>
                    <DropdownMenuItem>Bebidas</DropdownMenuItem>
                    <DropdownMenuItem>Acompanhamentos</DropdownMenuItem>
                    <DropdownMenuItem>Sobremesas</DropdownMenuItem>
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
                  {[
                    {
                      name: 'X-Burger Especial',
                      image: '/placeholder.svg',
                      category: 'Hambúrgueres',
                      price: 'R$ 32,90',
                      status: 'available',
                    },
                    {
                      name: 'Coca-Cola 350ml',
                      image: '/placeholder.svg',
                      category: 'Bebidas',
                      price: 'R$ 6,90',
                      status: 'available',
                    },
                    {
                      name: 'Batata Frita G',
                      image: '/placeholder.svg',
                      category: 'Acompanhamentos',
                      price: 'R$ 18,90',
                      status: 'unavailable',
                    },
                  ].map((product, index) => (
                    <tr
                      key={index}
                      className="border-b last:border-b-0 dark:border-[#2e2e2e]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={product.image || '/placeholder.svg'}
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
                        {product.category}
                      </td>
                      <td className="px-6 py-4 dark:text-white">
                        {product.price}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            product.status === 'available'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {product.status === 'available'
                            ? 'Disponível'
                            : 'Indisponível'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
