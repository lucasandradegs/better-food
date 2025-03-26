/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import type { AxisDomain } from 'recharts/types/util/types'

interface InsightChartProps {
  title: string
  data: any[]
  type: 'line' | 'bar'
  dataKey: string
  xAxisKey: string
  color?: string
  formatY?: (value: number) => string
  formatX?: (value: any) => string
  height?: number
  domain?: AxisDomain
  subtitle?: string
}

export function InsightChart({
  title,
  data,
  type,
  dataKey,
  xAxisKey,
  color = '#8884d8',
  formatY,
  formatX,
  height = 300,
  domain,
  subtitle,
}: InsightChartProps) {
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-[#262626]">
          <p className="mb-1 font-medium">{formatX ? formatX(label) : label}</p>
          <p className="text-lg font-bold">
            {formatY ? formatY(payload[0].value as number) : payload[0].value}
          </p>
        </div>
      )
    }

    return null
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white dark:border-[#343434] dark:bg-[#262626]">
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-xs text-muted-foreground">
              Nenhum dado disponível
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:border-[#343434] dark:bg-[#262626]">
      <CardHeader>
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }} className="mt-4">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart
                data={data}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.1}
                  vertical={false}
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  dataKey={xAxisKey}
                  tickFormatter={formatX}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  tickFormatter={formatY}
                  tick={{ fontSize: 12 }}
                  domain={domain}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                  fill="url(#colorGradient)"
                />
              </LineChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.1}
                  vertical={false}
                  className="dark:stroke-gray-700"
                />
                <XAxis
                  dataKey={xAxisKey}
                  tickFormatter={formatX}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  className="text-xs text-muted-foreground"
                />
                <YAxis
                  tickFormatter={formatY}
                  tick={{ fontSize: 12 }}
                  domain={domain}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={dataKey}
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  barSize={25}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
