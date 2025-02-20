import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

type ProductCategory = Database['public']['Tables']['product_categories']['Row']

type Product = Database['public']['Tables']['products']['Row'] & {
  product_categories: {
    name: string
  } | null
  description: string
}

interface ProductFormProps {
  productCategories: ProductCategory[]
  onProductCreated: () => void
  productToEdit?: Product | null
  onClose?: () => void
}

export function ProductForm({
  productCategories,
  onProductCreated,
  productToEdit,
  onClose,
}: ProductFormProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(
    productToEdit?.image_url || null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: productToEdit?.name || '',
    price: productToEdit?.price.toString() || '',
    category_id: productToEdit?.category_id || '',
    is_available: productToEdit?.is_available ?? true,
    image: null as File | null,
    description: productToEdit?.description || '',
  })

  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()
  const { userProfile } = useAuth()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string | boolean } },
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `product-images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error('Erro ao fazer upload da imagem')
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('logos').getPublicUrl(filePath)

    return publicUrl
  }

  const createNotification = async (productName: string) => {
    const { error } = await supabase.from('notifications').insert({
      user_id: userProfile?.id,
      title: 'Novo produto cadastrado! 🎉',
      description: `O produto "${productName}" foi cadastrado com sucesso em sua loja.`,
      status: 'unread',
    })

    if (error) {
      console.error('Erro ao criar notificação:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.name ||
      !formData.price ||
      !formData.category_id ||
      !formData.description
    ) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      let imageUrl = imagePreview

      if (formData.image) {
        imageUrl = await uploadImage(formData.image)
      }

      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('admin_id', userProfile?.id)
        .single()

      if (storeError || !stores) {
        throw new Error('Erro ao buscar informações da loja')
      }

      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        is_available: formData.is_available,
        image_url: imageUrl,
        store_id: stores.id,
        description: formData.description,
      }

      if (productToEdit) {
        const { error: submitError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productToEdit.id)

        if (submitError) throw submitError

        await supabase.from('notifications').insert({
          user_id: userProfile?.id,
          title: 'Produto atualizado com sucesso! ✏️',
          description: `O produto "${formData.name}" foi atualizado com sucesso.`,
          status: 'unread',
        })

        toast({
          title: 'Sucesso!',
          description: 'Produto atualizado com sucesso',
        })
      } else {
        const { error: submitError } = await supabase
          .from('products')
          .insert(productData)

        if (submitError) throw submitError

        await createNotification(formData.name)

        toast({
          title: 'Sucesso!',
          description: 'Produto cadastrado com sucesso',
        })
      }

      setIsEditDialogOpen(false)
      setFormData({
        name: '',
        price: '',
        category_id: '',
        is_available: true,
        image: null,
        description: '',
      })
      setImagePreview(null)
      onProductCreated()
      if (onClose) onClose()
    } catch (err) {
      console.error('Erro completo:', err)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o produto. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={productToEdit ? true : isEditDialogOpen}
      onOpenChange={(open) => {
        if (!open && onClose) onClose()
        setIsEditDialogOpen(open)
      }}
    >
      {!productToEdit && (
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] w-[85%] overflow-y-auto rounded-lg dark:border-[#343434] dark:bg-[#1c1c1c] lg:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            {productToEdit ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes do produto. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do produto</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: X-Burger Especial"
                className="text-sm dark:bg-[#161616]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço</Label>
              <Input
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Ex: 29.90"
                type="number"
                step="0.01"
                className="text-sm dark:bg-[#161616]"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descreva os ingredientes e características do produto"
              className="min-h-[80px] text-sm dark:bg-[#161616]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              >
                <SelectTrigger className="text-sm dark:bg-[#161616]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#161616]">
                  {productCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="is_available">Disponibilidade</Label>
              <div className="flex h-10 items-center space-x-2">
                <Switch
                  id="is_available"
                  name="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) =>
                    handleInputChange({
                      target: { name: 'is_available', value: checked },
                    })
                  }
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                />
                <Label htmlFor="is_available">Disponível para venda</Label>
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
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onClose) onClose()
                setIsEditDialogOpen(false)
              }}
              className="w-full bg-transparent dark:border-[#343434] sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="relative w-[140px] sm:w-[140px]"
              disabled={isLoading}
            >
              <div className={`${isLoading ? 'invisible' : ''}`}>
                Salvar produto
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
