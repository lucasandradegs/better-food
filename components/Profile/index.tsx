import { MapPin, ShoppingBag, Star, Heart, Mail } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ProfileDetailsProps {
  name: string
  email: string
  image: string
}

export default function ProfileDetails({
  name,
  email,
  image,
}: ProfileDetailsProps) {
  console.log(image)
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-[#262626]">
          <div className="relative h-32 bg-gradient-to-r from-red-500 to-red-800">
            <div className="absolute -bottom-12 left-4">
              <Avatar className="h-24 w-24 border-4 border-white dark:border-[#161616] dark:bg-[#161616]">
                <AvatarImage src={image} alt="User" />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="px-4 pb-6 pt-16 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {name}
                </h1>
                <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-300">
                  <MapPin className="mr-1 h-4 w-4" />
                  Timoteo, MG
                </p>
                <p className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300">
                  <Mail className="mr-1 h-4 w-4" />
                  {email}
                </p>
              </div>
              <Button>Editar Perfil</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="dark:bg-[#262626]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">
                Total de Pedidos
              </CardTitle>
              <ShoppingBag className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">127</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-[#262626]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">
                Avaliação Média
              </CardTitle>
              <Star className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">4.8</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-[#262626]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-white">
                Restaurantes Favoritos
              </CardTitle>
              <Heart className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">15</div>
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-[#262626]">
          <CardHeader>
            <CardTitle className="dark:text-white">Nível do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge>Nível Prata</Badge>
                  <span className="text-muted-foreground text-sm dark:text-gray-300">
                    127/200 pedidos para o próximo nível
                  </span>
                </div>
                <span className="text-sm font-medium dark:text-white">63%</span>
              </div>
              <Progress value={63} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#262626]">
          <CardHeader>
            <CardTitle className="dark:text-white">Últimos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  restaurant: 'Pizzaria Bella Napoli',
                  date: '12 Jun 2023',
                  items: 'Pizza Margherita, Bruschetta',
                },
                {
                  restaurant: 'Sushi Zen',
                  date: '5 Jun 2023',
                  items: 'Combo Sushi (30 peças)',
                },
                {
                  restaurant: 'Burger House',
                  date: '1 Jun 2023',
                  items: 'Cheese Burger, Batata Frita',
                },
              ].map((order, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Avatar>
                      <AvatarFallback>{order.restaurant[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium dark:text-white">
                      {order.restaurant}
                    </p>
                    <p className="text-muted-foreground text-xs dark:text-gray-300">
                      {order.items}
                    </p>
                  </div>
                  <div className="text-muted-foreground text-xs dark:text-gray-300">
                    {order.date}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
