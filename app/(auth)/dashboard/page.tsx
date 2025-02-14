/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'
import { useAuth } from '@/contexts/AuthContext'
import { CreateStoreDialog } from '@/components/Store/CreateStoreDialog'
import { Store } from 'lucide-react'
import AdminDashboard from '@/components/Admin'

export default function DashboardPage() {
  const [userStore, setUserStore] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const { userProfile } = useAuth()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchUserStore = async () => {
      if (!userProfile?.id) return

      const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .eq('admin_id', userProfile.id)
        .limit(1)

      if (error) {
        console.error('Erro ao buscar loja:', error)
        setIsLoading(false)
        return
      }

      setUserStore(stores?.[0] || null)
      setIsLoading(false)
    }

    fetchUserStore()
  }, [userProfile?.id, refreshKey])

  const handleStoreCreated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!userStore) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center">
        <Store className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-4 text-xl font-semibold">
          Ops... Parece que você ainda não cadastrou sua loja
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Para começar a gerenciar sua loja, você precisa cadastrá-la primeiro.
        </p>
        <CreateStoreDialog onStoreCreated={handleStoreCreated} />
      </div>
    )
  }

  return <AdminDashboard />
}
