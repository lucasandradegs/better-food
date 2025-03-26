'use client'

import { useQuery } from '@tanstack/react-query'
import { Store } from 'lucide-react'
import { CreateStoreDialog } from '@/components/Store/CreateStoreDialog'
import AdminDashboard from '@/components/Admin'

const fetchUserStore = async () => {
  const response = await fetch('/api/user-store')
  if (!response.ok) {
    throw new Error('Erro ao buscar loja')
  }
  return response.json()
}

export default function DashboardPage() {
  const {
    data: userStore,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['user-store'],
    queryFn: fetchUserStore,
  })

  const handleStoreCreated = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <main className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="h-6 w-48 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
              <div className="mt-2 h-4 w-64 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
            </div>
            <div className="h-10 w-full animate-pulse rounded-md bg-gray-200 dark:bg-[#343434] lg:w-[20rem]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="rounded-lg border bg-white p-6 dark:border-[#343434] dark:bg-[#262626] lg:h-[132px]"
              >
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-5 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
                  <div className="h-4 w-4 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]" />
                </div>
                <div className="mt-[5px]">
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
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-md bg-gray-200 dark:bg-[#343434]"
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
