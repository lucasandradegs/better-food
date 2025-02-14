import { TrendingUp, DollarSign, ShoppingBag, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardStats() {
  return (
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
          <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
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
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
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
  )
}
