'use client'

import { Store, Loader2 } from 'lucide-react'
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
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

interface CreateStoreDialogProps {
  onStoreCreated?: () => void
}

interface StoreCategory {
  id: string
  name: string
}

const fetchCategories = async (): Promise<StoreCategory[]> => {
  const response = await fetch('/api/store-categories')
  if (!response.ok) {
    throw new Error('Erro ao buscar categorias')
  }
  return response.json()
}

export function CreateStoreDialog({ onStoreCreated }: CreateStoreDialogProps) {
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    logo: null as File | null,
  })

  const router = useRouter()

  const { data: storeCategories = [] } = useQuery({
    queryKey: ['store-categories'],
    queryFn: fetchCategories,
  })

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } },
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.category_id) {
      toast.error('Campos obrigatórios', {
        description: 'Preencha todos os campos obrigatórios',
      })
      return
    }

    setIsLoading(true)

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('category_id', formData.category_id)
      if (formData.logo) {
        submitData.append('logo', formData.logo)
      }

      const response = await fetch('/api/stores', {
        method: 'POST',
        body: submitData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar loja')
      }

      toast.success('Loja criada com sucesso!', {
        description: 'Você será redirecionado para a página da sua loja.',
      })

      setIsStoreDialogOpen(false)
      setFormData({
        name: '',
        category_id: '',
        logo: null,
      })
      setLogoPreview(null)

      onStoreCreated?.()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar loja', {
        description: 'Ocorreu um erro ao criar sua loja. Tente novamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Store className="mr-2 h-4 w-4" />
          Cadastre sua loja
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[85%] overflow-y-auto rounded-lg dark:bg-[#262626] lg:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Loja</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da sua loja. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da loja</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Pizzaria Bella Napoli"
              className="text-sm dark:bg-[#161616]"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              name="category_id"
              value={formData.category_id}
              onValueChange={(value) =>
                handleInputChange({
                  target: { name: 'category_id', value },
                })
              }
              required
            >
              <SelectTrigger className="text-sm dark:bg-[#161616]">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {storeCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
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
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsStoreDialogOpen(false)
                setLogoPreview(null)
                setFormData({
                  name: '',
                  category_id: '',
                  logo: null,
                })
              }}
              className="w-full bg-transparent sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="relative w-[140px] sm:w-[140px]"
              disabled={isLoading}
            >
              <div className={`${isLoading ? 'invisible' : ''}`}>
                Cadastrar loja
              </div>
              {isLoading && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
