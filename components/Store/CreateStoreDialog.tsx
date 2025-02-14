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
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface CreateStoreDialogProps {
  onStoreCreated?: () => void
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

  const { toast } = useToast()
  const { userProfile } = useAuth()
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  const [storeCategories, setStoreCategories] = useState<
    Array<{
      id: string
      name: string
    }>
  >([])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('store_categories')
        .select('id, name')
        .order('name')

      if (data && !error) {
        setStoreCategories(data)
      }
    }

    fetchCategories()
  }, [])

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

  const uploadLogo = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `store-logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error('Erro ao fazer upload da logo')
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('logos').getPublicUrl(filePath)

    return publicUrl
  }

  function isValidUUID(uuid: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  const createNotification = async (storeName: string) => {
    const { error } = await supabase.from('notifications').insert({
      user_id: userProfile?.id,
      title: 'Loja cadastrada com sucesso! 🎉',
      description: `Sua loja "${storeName}" está pronta para o uso!`,
      status: 'unread',
    })

    if (error) {
      console.error('Erro ao criar notificação:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.category_id) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      let logoUrl = null

      if (formData.logo) {
        logoUrl = await uploadLogo(formData.logo)
      }

      if (!isValidUUID(formData.category_id)) {
        toast({
          title: 'Erro',
          description: 'Categoria inválida',
          variant: 'destructive',
        })
        return
      }

      const { error: submitError } = await supabase.from('stores').insert({
        name: formData.name,
        category_id: formData.category_id,
        logo_url: logoUrl,
        admin_id: userProfile?.id,
      })

      if (submitError) throw submitError

      // Cria a notificação após cadastrar a loja
      await createNotification(formData.name)

      toast({
        title: 'Sucesso!',
        description: 'Sua loja foi cadastrada com sucesso',
      })

      setIsStoreDialogOpen(false)
      setFormData({
        name: '',
        category_id: '',
        logo: null,
      })
      setLogoPreview(null)

      // Chama o callback se ele existir
      onStoreCreated?.()

      // Recarrega a página após o cadastro
      router.refresh()
    } catch (err) {
      console.error('Erro completo:', err)
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar sua loja. Tente novamente.',
        variant: 'destructive',
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
      <DialogContent className="max-h-[90vh] w-[85%] overflow-y-auto rounded-lg lg:max-w-[625px] dark:bg-[#262626]">
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
