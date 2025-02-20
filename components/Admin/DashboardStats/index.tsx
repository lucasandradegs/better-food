import { TrendingUp, DollarSign, ShoppingBag, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import NumberFlow from '@number-flow/react'

interface DashboardStatsProps {
  todaySales: number
  todayOrders: number
  averageTicket: number
  previousDaySales: number
  previousDayOrders: number
  previousDayTicket: number
  totalOrders: number
}

export function DashboardStats({
  todaySales,
  todayOrders,
  averageTicket,
  previousDaySales,
  previousDayOrders,
  previousDayTicket,
  totalOrders,
}: DashboardStatsProps) {
  // Calcula as variações percentuais
  const salesChange =
    previousDaySales > 0
      ? ((todaySales - previousDaySales) / previousDaySales) * 100
      : 0
  const ordersChange =
    previousDayOrders > 0
      ? ((todayOrders - previousDayOrders) / previousDayOrders) * 100
      : 0
  const ticketChange =
    previousDayTicket > 0
      ? ((averageTicket - previousDayTicket) / previousDayTicket) * 100
      : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:border-[#343434] dark:bg-[#262626]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R${' '}
            <NumberFlow
              value={todaySales}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {salesChange > 0 ? '+' : ''}
            <NumberFlow
              value={salesChange}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
            % em relação a ontem
          </p>
        </CardContent>
      </Card>
      <Card className="bg-white dark:border-[#343434] dark:bg-[#262626]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <NumberFlow
              value={todayOrders}
              format={{ maximumFractionDigits: 0 }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {ordersChange > 0 ? '+' : ''}
            <NumberFlow
              value={ordersChange}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
            % em relação a ontem
          </p>
        </CardContent>
      </Card>
      <Card className="bg-white dark:border-[#343434] dark:bg-[#262626]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R${' '}
            <NumberFlow
              value={averageTicket}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {ticketChange > 0 ? '+' : ''}
            <NumberFlow
              value={ticketChange}
              format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            />
            % em relação a ontem
          </p>
        </CardContent>
      </Card>
      <Card className="bg-white dark:border-[#343434] dark:bg-[#262626]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Pedidos
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <NumberFlow
              value={totalOrders}
              format={{ maximumFractionDigits: 0 }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Total de pedidos realizados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
