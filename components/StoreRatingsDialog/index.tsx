import { Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface Rating {
  id: string
  rating: number
  food_rating: number
  delivery_rating: number
  comment: string | null
  created_at: string
  user: {
    name: string | null
    avatar_url: string | null
    email: string
  }
}

interface StoreRatingsDialogProps {
  isOpen: boolean
  onClose: () => void
  ratings: Rating[]
  averageRating: number
  totalRatings: number
}

export function StoreRatingsDialog({
  isOpen,
  onClose,
  ratings,
  averageRating,
  totalRatings,
}: StoreRatingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-h-[90vh] w-[85%] overflow-y-auto rounded-lg dark:border-[#343434] dark:bg-[#1c1c1c] lg:max-w-[600px]"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Avaliações</span>
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-bold">{averageRating}</span>
              <span className="text-sm text-gray-500">({totalRatings})</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="border-b pb-4 last:border-0 dark:border-[#343434]"
            >
              <div className="mb-2 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={rating.user.avatar_url || ''} />
                  <AvatarFallback>
                    {rating.user.name
                      ? rating.user.name.substring(0, 2).toUpperCase()
                      : rating.user.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {rating.user.name || rating.user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(rating.created_at), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>

              <div className="mb-2 flex gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{rating.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">Comida:</span>
                  <span className="text-sm">{rating.food_rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">Entrega:</span>
                  <span className="text-sm">{rating.delivery_rating}</span>
                </div>
              </div>

              {rating.comment && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {rating.comment}
                </p>
              )}
            </div>
          ))}

          {ratings.length === 0 && (
            <div className="text-center text-gray-500">
              Nenhuma avaliação ainda
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
