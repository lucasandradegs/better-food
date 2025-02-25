'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function Promotions() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold tracking-tight dark:text-white">
        Promoções
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <h3 className="mb-2 text-xl font-bold">
              50% OFF na primeira compra
            </h3>
            <p className="mb-4">Use o código NOVO50 e aproveite!</p>
            <Badge variant="secondary" className="bg-white text-indigo-600">
              NOVO50
            </Badge>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-500 to-red-800 text-white">
          <CardContent className="p-6">
            <h3 className="mb-2 text-xl font-bold">Frete grátis</h3>
            <p className="mb-4">Em pedidos acima de R$ 50</p>
            <Badge variant="secondary" className="bg-white text-red-600">
              FRETEFREE
            </Badge>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
