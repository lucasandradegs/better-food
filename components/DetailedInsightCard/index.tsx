'use client'

import type React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import type { DetailedInsight } from '@/app/(auth)/dashboard/insights/types'
import { motion } from 'framer-motion'

interface DetailedInsightCardProps {
  title: string
  icon: LucideIcon
  iconColor: string
  insights: DetailedInsight[]
  renderContent: (insight: DetailedInsight) => React.ReactNode
}

export function DetailedInsightCard({
  title,
  icon: Icon,
  iconColor,
  insights,
  renderContent,
}: DetailedInsightCardProps) {
  return (
    <Card className="bg-white dark:border-[#343434] dark:bg-[#262626]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`rounded-xl ${iconColor} p-2`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {insights?.length > 0 ? (
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="rounded-lg bg-white shadow-sm dark:border-[#343434] dark:bg-[#262626]"
              >
                {renderContent(insight)}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
            <Icon className="mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-xs text-muted-foreground">
              Nenhum dado disponível no momento.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
