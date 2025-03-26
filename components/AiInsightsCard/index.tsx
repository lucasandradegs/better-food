'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, RefreshCw, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface AIInsightsCardProps {
  daysAgo: number
}

export function AIInsightsCard({ daysAgo }: AIInsightsCardProps) {
  const [insights, setInsights] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const generateInsights = async () => {
    try {
      setIsLoading(true)
      setInsights('') // Limpa os insights anteriores

      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysAgo }),
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar insights')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Resposta sem corpo')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              const text = parsed.text || ''
              setInsights((prev) => prev + text)
            } catch (e) {
              console.error('Erro ao parsear chunk:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro:', error)
      setInsights('Desculpe, ocorreu um erro ao gerar os insights.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white dark:border-[#343434] dark:bg-[#262626]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 p-2">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-sm font-medium">Insights da IA</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateInsights}
          disabled={isLoading}
          className="gap-1.5 text-xs dark:border-[#343434] dark:bg-[#232323]"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-purple-500" />
          )}
          {isLoading ? 'Gerando...' : 'Gerar Insights'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg bg-gradient-to-r from-purple-50/50 to-purple-100/50 p-5 dark:from-purple-900/20 dark:to-purple-800/20"
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                {insights}
                {isLoading && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ▋
                  </motion.span>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
              <Brain className="mb-2 h-10 w-10 text-purple-300 dark:text-purple-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Insights personalizados para o seu negócio
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nossa IA analisará seus dados e fornecerá sugestões valiosas
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
