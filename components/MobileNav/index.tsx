'use client'

import { User, ReceiptText, ChartArea, Pizza } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Suspense, useEffect, useState } from 'react'

function DashboardItem({ pathname }: { pathname: string }) {
  const { userProfile, isLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!isLoading && userProfile) {
      setIsAdmin(userProfile.role === 'admin')
    }
  }, [userProfile, isLoading])

  if (!isAdmin) return null

  return (
    <Link
      href="/dashboard"
      className={cn(
        'flex flex-col items-center justify-center space-y-1 rounded-full px-4 py-1 transition-all duration-200',
        pathname === '/dashboard'
          ? '-translate-y-1 transform bg-red-50 dark:bg-red-950'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800',
      )}
    >
      <ChartArea
        className={cn(
          'h-5 w-5 transition-colors duration-200',
          pathname === '/dashboard'
            ? 'text-red-500 dark:text-red-400'
            : 'text-gray-500 dark:text-gray-400',
        )}
        strokeWidth={1.5}
      />
      <span
        className={cn(
          'text-xs transition-colors duration-200',
          pathname === '/dashboard'
            ? 'font-medium text-red-500 dark:text-red-400'
            : 'text-gray-500 dark:text-gray-400',
        )}
      >
        Dashboard
      </span>
    </Link>
  )
}

function DashboardItemFallback() {
  return <div className="w-16"></div>
}

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-t-[#dfdfdf] bg-[#f8f8f8] dark:border-t-[#343434] dark:bg-[#1c1c1c] min-[768px]:hidden">
      <Link
        href="/inicio"
        className={cn(
          'flex flex-col items-center justify-center space-y-1 rounded-full px-4 py-1 transition-all duration-200',
          pathname === '/inicio'
            ? '-translate-y-1 transform bg-red-50 dark:bg-red-950'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800',
        )}
      >
        <Pizza
          className={cn(
            'h-5 w-5 transition-colors duration-200',
            pathname === '/inicio'
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400',
          )}
          strokeWidth={1.5}
        />
        <span
          className={cn(
            'text-xs transition-colors duration-200',
            pathname === '/inicio'
              ? 'font-medium text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400',
          )}
        >
          Início
        </span>
      </Link>

      <Link
        href="/pedidos"
        className={cn(
          'flex flex-col items-center justify-center space-y-1 rounded-full px-4 py-1 transition-all duration-200',
          pathname === '/pedidos'
            ? '-translate-y-1 transform bg-red-50 dark:bg-red-950'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800',
        )}
      >
        <ReceiptText
          className={cn(
            'h-5 w-5 transition-colors duration-200',
            pathname === '/pedidos'
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400',
          )}
          strokeWidth={1.5}
        />
        <span
          className={cn(
            'text-xs transition-colors duration-200',
            pathname === '/pedidos'
              ? 'font-medium text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400',
          )}
        >
          Pedidos
        </span>
      </Link>

      <Suspense fallback={<DashboardItemFallback />}>
        <DashboardItem pathname={pathname} />
      </Suspense>

      <Link
        href="/perfil"
        className={cn(
          'flex flex-col items-center justify-center space-y-1 rounded-full px-4 py-1 transition-all duration-200',
          pathname === '/perfil'
            ? '-translate-y-1 transform bg-red-50 dark:bg-red-950'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800',
        )}
      >
        <User
          className={cn(
            'h-5 w-5 transition-colors duration-200',
            pathname === '/perfil'
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400',
          )}
          strokeWidth={1.5}
        />
        <span
          className={cn(
            'text-xs transition-colors duration-200',
            pathname === '/perfil'
              ? 'font-medium text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400',
          )}
        >
          Perfil
        </span>
      </Link>
    </nav>
  )
}
