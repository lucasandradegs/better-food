/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import type React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface ItemListCardProps {
  title: string
  icon: LucideIcon
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
}

export function ItemListCard({
  title,
  icon: Icon,
  items,
  renderItem,
}: ItemListCardProps) {
  return (
    <Card className="flex h-full flex-col bg-white dark:border-[#343434] dark:bg-[#262626]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-2">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {items?.length > 0 ? (
          <div className="grid h-full gap-3 sm:grid-cols-1">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="overflow-hidden rounded-lg dark:bg-[#262626]"
              >
                {renderItem(item, index)}
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
