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
      <div className="min-h-screen">
        <main className="space-y-8 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="h-6 w-48 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
              <div className="mt-2 h-4 w-64 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
            </div>
            <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="rounded-lg border bg-white p-6 dark:border-[#343434] dark:bg-[#262626]"
              >
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-5 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
                  <div className="h-4 w-4 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
                </div>
                <div className="mt-4">
                  <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
                  <div className="mt-2 h-4 w-40 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-white p-6 dark:border-[#343434] dark:bg-[#262626]">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-6 w-48 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
              <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
            </div>
            <div className="grid gap-4">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="h-8 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]"
                />
              ))}
            </div>
          </div>
        </main>
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
