import { useState } from 'react'
import { Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface OrderRatingDialogProps {
  orderId: string
  storeId: string
  storeName: string
  isOpen: boolean
  onClose: () => void
  onRatingSubmitted: () => void
}

interface RatingStarsProps {
  rating: number
  onRatingChange: (rating: number) => void
  label: string
}

function RatingStars({ rating, onRatingChange, label }: RatingStarsProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="rounded-md p-1 transition-colors hover:bg-gray-100 dark:hover:bg-[#343434]"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export function OrderRatingDialog({
  orderId,
  storeId,
  storeName,
  isOpen,
  onClose,
  onRatingSubmitted,
}: OrderRatingDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [foodRating, setFoodRating] = useState(0)
  const [deliveryRating, setDeliveryRating] = useState(0)
  const [comment, setComment] = useState('')

  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()
  const { userProfile } = useAuth()

  const handleSubmit = async () => {
    if (!userProfile?.id) return

    if (rating === 0 || foodRating === 0 || deliveryRating === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todas as avaliações',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.from('order_ratings').insert({
        user_id: userProfile.id,
        order_id: orderId,
        store_id: storeId,
        rating,
        food_rating: foodRating,
        delivery_rating: deliveryRating,
        comment: comment.trim() || null,
      })

      if (error) throw error

      // Criar notificação para o cliente
      await supabase.from('notifications').insert({
        user_id: userProfile.id,
        title: 'Avaliação enviada! ⭐',
        description: `Obrigado por avaliar seu pedido em ${storeName}!`,
        status: 'unread',
        viewed: false,
        path: `/pedidos`,
      })

      toast({
        title: 'Sucesso!',
        description: 'Sua avaliação foi enviada com sucesso',
      })

      onRatingSubmitted()
      onClose()
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar sua avaliação',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[85%] overflow-y-auto rounded-lg dark:border-[#343434] dark:bg-[#1c1c1c] lg:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Avaliar Pedido</DialogTitle>
          <DialogDescription>
            Conte-nos como foi sua experiência com este pedido em {storeName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RatingStars
            rating={rating}
            onRatingChange={setRating}
            label="Avaliação Geral"
          />
          <RatingStars
            rating={foodRating}
            onRatingChange={setFoodRating}
            label="Qualidade da Comida"
          />
          <RatingStars
            rating={deliveryRating}
            onRatingChange={setDeliveryRating}
            label="Entrega"
          />

          <div className="space-y-2">
            <span className="text-sm font-medium">Comentário (opcional)</span>
            <Textarea
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] resize-none dark:border-[#343434] dark:bg-[#161616]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="dark:border-[#343434] dark:bg-transparent"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="relative w-[140px]"
          >
            {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
