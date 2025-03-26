'use client'

import { CardContent, CardTitle, CardHeader, Card } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Users,
  Star,
  CreditCard,
  Ticket,
  Tag,
  BarChart3,
  ShoppingBag,
  Calendar,
  ArrowDown,
  ArrowUp,
  ChevronDown,
} from 'lucide-react'
import type { StoreInsights, DetailedInsight } from './types'
import { AIInsightsCard } from '@/components/AiInsightsCard'
import { InsightCard } from '@/components/InsightCard'
import { InsightChart } from '@/components/InsightChart'
import { DetailedInsightCard } from '@/components/DetailedInsightCard'
import { ItemListCard } from '@/components/ItemListCard'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TimeRangeOption {
  label: string
  value: number
}

const timeRangeOptions: TimeRangeOption[] = [
  { label: '5 dias', value: 5 },
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
]

async function fetchInsights(daysAgo: number): Promise<StoreInsights> {
  const response = await fetch(`/api/store-insights?daysAgo=${daysAgo}`)
  if (!response.ok) {
    throw new Error('Erro ao buscar insights')
  }
  const data = await response.json()
  return data
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split('-')
  return new Date(`${year}-${month}-${day}T12:00:00`).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
    },
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export default function InsightsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeOption>(
    timeRangeOptions[0],
  )

  const { data, isLoading } = useQuery<StoreInsights>({
    queryKey: ['store-insights', selectedTimeRange.value],
    queryFn: () => fetchInsights(selectedTimeRange.value),
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="mt-6 text-lg font-medium text-gray-600 dark:text-gray-300">
            Gerando insights...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Estamos preparando seus dados
          </p>
        </div>
      </div>
    )
  }

  const { metrics, ratings, topCustomers, insights, detailedInsights } = data

  // Find revenue and orders insights
  const revenueInsight = insights?.find((i) => i.insight_type === 'revenue')
  const ordersInsight = insights?.find((i) => i.insight_type === 'orders')

  return (
    <div className="">
      <main className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight dark:text-white">
              Insights da Loja
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Análise de desempenho e métricas importantes
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 dark:border-[#343434] dark:bg-[#232323]"
              >
                <Calendar className="h-4 w-4" />
                <span>Últimos {selectedTimeRange.label}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-[#232323]">
              {timeRangeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSelectedTimeRange(option)}
                >
                  Últimos {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InsightCard
            title="Faturamento"
            value={formatCurrency(metrics?.total_revenue)}
            icon={TrendingUp}
            color="bg-gradient-to-r from-emerald-500 to-green-600"
            subtitle={`Últimos ${selectedTimeRange.label}`}
            trend={revenueInsight?.trend_percentage}
          />
          <InsightCard
            title="Total de Pedidos"
            value={metrics?.total_orders}
            icon={ShoppingBag}
            color="bg-gradient-to-r from-blue-500 to-indigo-600"
            subtitle="Média de pedidos diários"
            trend={ordersInsight?.trend_percentage}
          />
          <InsightCard
            title="Avaliação Média"
            value={`${ratings.avg_rating.toFixed(1)}`}
            icon={Star}
            color="bg-gradient-to-r from-amber-500 to-yellow-600"
            subtitle={`${ratings.total_ratings} avaliações`}
          />
          <InsightCard
            title="Ticket Médio"
            value={formatCurrency(metrics?.average_order_value)}
            icon={BarChart3}
            color="bg-gradient-to-r from-purple-500 to-violet-600"
            subtitle="Valor médio por pedido"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <InsightChart
            title="Vendas nos Últimos 30 Dias"
            subtitle="Acompanhe a evolução do seu faturamento"
            data={metrics?.sales_by_day}
            type="line"
            dataKey="total"
            xAxisKey="date"
            color="#6366f1"
            formatY={(value) => formatCurrency(value)}
            formatX={(date) => formatDate(date)}
            height={320}
          />
          <AIInsightsCard daysAgo={selectedTimeRange.value} />
        </div>

        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger
              value="payment"
              className="text-sm dark:data-[state=active]:bg-[#343434]"
            >
              Métodos de Pagamento
            </TabsTrigger>
            <TabsTrigger
              value="coupons"
              className="text-sm dark:data-[state=active]:bg-[#343434]"
            >
              Uso de Cupons
            </TabsTrigger>
          </TabsList>
          <TabsContent value="payment">
            <DetailedInsightCard
              title="Método de Pagamento Preferido"
              icon={CreditCard}
              iconColor="bg-gradient-to-r from-blue-500 to-cyan-600"
              insights={detailedInsights?.paymentMethods || []}
              renderContent={(insight: DetailedInsight) => (
                <div className="space-y-4 rounded-xl bg-blue-50/50 p-5 dark:bg-[#202020]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/50">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {insight.additional_info?.payment_method ===
                        'CREDIT_CARD'
                          ? 'Cartão de Crédito'
                          : insight.additional_info?.payment_method ===
                              'DEBIT_CARD'
                            ? 'Cartão de Débito'
                            : insight.additional_info?.payment_method === 'PIX'
                              ? 'PIX'
                              : insight.additional_info?.payment_method}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {insight.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-[#262626]">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total de Pedidos
                      </p>
                      <p className="mt-1 text-sm font-bold lg:text-xl">
                        {insight.additional_info?.total_orders}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-[#262626]">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Percentual
                      </p>
                      <p className="mt-1 text-sm font-bold lg:text-xl">
                        {Number(
                          insight.additional_info?.percentage_of_total,
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Utilização</span>
                      <span className="text-sm font-medium">
                        {Number(
                          insight.additional_info?.percentage_of_total,
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={Number(
                        insight.additional_info?.percentage_of_total,
                      )}
                      className="h-2 bg-blue-100 dark:bg-[#262626]"
                    />
                  </div>
                </div>
              )}
            />
          </TabsContent>
          <TabsContent value="coupons">
            <DetailedInsightCard
              title="Uso de Cupons"
              icon={Ticket}
              iconColor="bg-gradient-to-r from-purple-500 to-fuchsia-600"
              insights={detailedInsights?.couponUsage || []}
              renderContent={(insight: DetailedInsight) => (
                <div className="space-y-4 rounded-xl bg-purple-50/50 p-5 dark:bg-[#202020]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/50">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {insight.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-[#262626]">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Pedidos com Cupom
                      </p>
                      <p className="mt-1 text-sm font-bold lg:text-xl">
                        {insight.additional_info?.total_orders_with_coupon}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-[#262626]">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Desconto Médio
                      </p>
                      <p className="mt-1 text-sm font-bold lg:text-xl">
                        {(
                          Number(insight.additional_info?.average_discount) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Taxa de Utilização
                      </span>
                      <span className="text-sm font-medium">
                        {Number(
                          insight.additional_info?.percentage_of_orders,
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={Number(
                        insight.additional_info?.percentage_of_orders,
                      )}
                      className="h-2 bg-purple-100 dark:bg-[#262626]"
                    />
                  </div>
                </div>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-full lg:col-span-1">
            <Card className="h-full bg-white dark:border-[#343434] dark:bg-[#262626]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-2">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium">
                    Insights de Vendas
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights
                    ?.filter(
                      (i) =>
                        i.insight_type === 'revenue' ||
                        i.insight_type === 'orders',
                    )
                    .map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="rounded-lg bg-gray-50 p-4 shadow-sm dark:border dark:border-[#343434] dark:bg-[#262626]"
                      >
                        <div className="flex items-center gap-3">
                          {Number(insight.trend_percentage) > 0 ? (
                            <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/30">
                              <ArrowUp className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/30">
                              <ArrowDown className="h-4 w-4" />
                            </div>
                          )}
                          <p className="text-sm font-medium">{insight.title}</p>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {insight.description}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-2xl font-bold">
                            {insight.insight_type === 'revenue'
                              ? formatCurrency(Number(insight.metric_value))
                              : insight.metric_value}
                          </span>
                          <Badge
                            variant={
                              Number(insight.trend_percentage) > 0
                                ? 'default'
                                : 'destructive'
                            }
                            className="h-5 text-xs"
                          >
                            {Number(insight.trend_percentage) > 0 ? '+' : ''}
                            {Number(insight.trend_percentage).toFixed(1)}%
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="h-full lg:col-span-2">
            <div className="grid h-full gap-6 md:grid-cols-2">
              <ItemListCard
                title="Produtos Mais Vendidos"
                icon={ShoppingBag}
                items={metrics?.top_products || []}
                renderItem={(product, index) => (
                  <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 shadow-sm dark:border dark:border-[#343434] dark:bg-[#262626]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{product.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{product.total_sales} vendas</span>
                        <span>•</span>
                        <span>{formatCurrency(product.total_revenue)}</span>
                      </div>
                    </div>
                    <Tag className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  </div>
                )}
              />

              <ItemListCard
                title="Melhores Clientes"
                icon={Users}
                items={topCustomers || []}
                renderItem={(customer, index) => (
                  <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 shadow-sm dark:border dark:border-[#343434] dark:bg-[#262626]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{customer.email}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{customer.orders} pedidos</span>
                        <span>•</span>
                        <span>{formatCurrency(customer.total_spent)}</span>
                      </div>
                    </div>
                    <Users className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        <Card className="bg-white dark:border-[#343434] dark:bg-[#262626]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 p-2">
                <Star className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-sm font-medium">
                Avaliações Recentes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {ratings.ratings.map((rating) => (
                <motion.div
                  key={rating.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-lg bg-gray-50 p-4 shadow-sm dark:border dark:border-[#343434] dark:bg-[#262626]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage
                          src={rating.user.avatar_url || undefined}
                          alt={rating.user.name}
                        />
                        <AvatarFallback>
                          {getInitials(rating.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {rating.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rating.created_at).toLocaleDateString(
                            'pt-BR',
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        {rating.rating}
                      </span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Comida</p>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">
                          {rating.food_rating}
                        </span>
                        <Star className="ml-1 h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Entrega</p>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">
                          {rating.delivery_rating}
                        </span>
                        <Star className="ml-1 h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  </div>

                  {rating.comment && (
                    <div className="mt-3 rounded-lg bg-gray-100 p-3 text-xs dark:bg-[#343434]">
                      &quot;{rating.comment}&quot;
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
