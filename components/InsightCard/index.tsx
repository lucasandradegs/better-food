'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InsightCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  subtitle?: string
  trend?: number
}

export function InsightCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
}: InsightCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="h-full"
    >
      <Card className="relative h-full overflow-hidden bg-white dark:border-[#343434] dark:bg-[#262626]">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className={`rounded-xl p-2 ${color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            {trend !== undefined && (
              <div
                className={cn(
                  'flex items-center rounded-full px-2 py-1 text-xs font-medium',
                  trend >= 0
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                )}
              >
                {trend >= 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`} />
      </Card>
    </motion.div>
  )
}
