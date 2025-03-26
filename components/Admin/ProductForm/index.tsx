import { useState } from 'react'
import { Loader2, Plus, Wand2 } from 'lucide-react'
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
import { Database } from '@/lib/database.types'
import { toast } from 'sonner'

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
  storeId?: string
}

export function ProductForm({
  productCategories,
  onProductCreated,
  productToEdit,
  onClose,
  storeId,
}: ProductFormProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(
    productToEdit?.image_url || null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [productDetails, setProductDetails] = useState('')
  const [formData, setFormData] = useState({
    name: productToEdit?.name || '',
    price: productToEdit?.price.toString() || '',
    category_id: productToEdit?.category_id || '',
    is_available: productToEdit?.is_available ?? true,
    image: null as File | null,
    description: productToEdit?.description || '',
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.name ||
      !formData.price ||
      !formData.category_id ||
      !formData.description ||
      !storeId
    ) {
      toast.error('Campos obrigatórios', {
        description: 'Preencha todos os campos obrigatórios',
      })
      return
    }

    setIsLoading(true)

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('price', formData.price)
      submitData.append('category_id', formData.category_id)
      submitData.append('is_available', formData.is_available.toString())
      submitData.append('description', formData.description)
      if (formData.image) {
        submitData.append('image', formData.image)
      }
      if (productToEdit) {
        submitData.append('productId', productToEdit.id)
        submitData.append('image_url', productToEdit.image_url || '')
      }

      const response = await fetch(`/api/stores/${storeId}/products`, {
        method: 'POST',
        body: submitData,
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar produto')
      }

      if (productToEdit) {
        toast.success('Produto atualizado com sucesso!')
      } else {
        toast.success('Produto criado com sucesso!')
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
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar produto', {
        description: 'Ocorreu um erro ao salvar o produto. Tente novamente.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateDescription = async () => {
    if (!productDetails.trim()) {
      toast.error('Detalhes necessários', {
        description: 'Por favor, forneça alguns detalhes sobre o produto.',
      })
      return
    }

    setIsGeneratingDescription(true)
    setFormData((prev) => ({ ...prev, description: '' }))
    setShowAIDialog(false)

    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productDetails }),
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar descrição')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Erro ao ler resposta')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value)
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim()
            if (data === '[DONE]') {
              setProductDetails('')
              toast.success('Descrição gerada com sucesso!')
              return
            }

            try {
              const { text } = JSON.parse(data)
              if (text) {
                setFormData((prev) => ({
                  ...prev,
                  description: prev.description + text,
                }))
              }
            } catch (e) {
              console.error('Erro ao processar chunk:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar descrição', {
        description: 'Ocorreu um erro ao gerar a descrição. Tente novamente.',
      })
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  return (
    <>
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
                  className="text-base dark:bg-[#161616] lg:text-sm"
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
                  className="text-base dark:bg-[#161616] lg:text-sm"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Descrição</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowAIDialog(true)}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva os ingredientes e características do produto"
                className="min-h-[80px] text-base dark:bg-[#161616] lg:text-sm"
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
                  <SelectTrigger className="text-base dark:bg-[#161616] lg:text-sm">
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
                  className="text-base dark:bg-[#161616] lg:text-sm"
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
                className="relative mx-auto w-full sm:w-[140px]"
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

      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="w-[80%] rounded-lg lg:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerar Descrição com IA</DialogTitle>
            <DialogDescription>
              Forneça alguns detalhes sobre o produto para gerar uma descrição
              atraente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ai-details">Detalhes do produto</Label>
              <Textarea
                id="ai-details"
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                placeholder="Ex: Hambúrguer artesanal com blend de carnes nobres, queijo cheddar, bacon crocante e molho especial"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAIDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={generateDescription}
              disabled={isGeneratingDescription}
              className="relative w-full sm:w-[140px]"
            >
              <span className={isGeneratingDescription ? 'invisible' : ''}>
                Gerar Descrição
              </span>
              {isGeneratingDescription && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
