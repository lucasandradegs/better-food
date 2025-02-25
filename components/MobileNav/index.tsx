'use client'

import { Home, User, ReceiptText, ChartArea } from 'lucide-react'
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
      className="flex flex-col items-center justify-center space-y-1 transition-all duration-200"
    >
      <div className="relative h-5 w-5">
        <ChartArea
          className={cn(
            'absolute inset-0 h-5 w-5 text-gray-500 transition-opacity duration-300',
            pathname === '/dashboard' ? 'opacity-0' : 'opacity-100',
          )}
          strokeWidth={1.5}
        />
        <ChartArea
          className={cn(
            'absolute inset-0 h-5 w-5 text-black transition-opacity duration-300 dark:text-white',
            pathname === '/dashboard' ? 'opacity-100' : 'opacity-0',
          )}
          strokeWidth={1.5}
          fill={pathname === '/dashboard' ? 'rgb(239, 68, 68)' : 'none'}
        />
      </div>
      <span
        className={cn(
          'text-xs transition-colors duration-300',
          pathname === '/dashboard'
            ? 'font-medium text-black dark:text-white'
            : 'text-gray-500',
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-12 items-center justify-around border-t border-t-[#dfdfdf] bg-[#f8f8f8] dark:border-t-[#343434] dark:bg-[#1c1c1c] min-[768px]:hidden">
      <Link
        href="/inicio"
        className="flex flex-col items-center justify-center space-y-1 transition-all duration-200"
      >
        <div className="relative h-5 w-5">
          <Home
            className={cn(
              'absolute inset-0 h-5 w-5 text-gray-500 transition-opacity duration-300',
              pathname === '/inicio' ? 'opacity-0' : 'opacity-100',
            )}
            strokeWidth={1.5}
          />
          <Home
            className={cn(
              'absolute inset-0 h-5 w-5 text-black transition-opacity duration-300 dark:text-white',
              pathname === '/inicio' ? 'opacity-100' : 'opacity-0',
            )}
            strokeWidth={1.5}
            fill={pathname === '/inicio' ? 'rgb(239, 68, 68)' : 'none'}
          />
        </div>
        <span
          className={cn(
            'text-xs transition-colors duration-300',
            pathname === '/inicio'
              ? 'font-medium text-black dark:text-white'
              : 'text-gray-500',
          )}
        >
          Início
        </span>
      </Link>
      <Link
        href="/pedidos"
        className="flex flex-col items-center justify-center space-y-1 transition-all duration-200"
      >
        <div className="relative h-5 w-5">
          <ReceiptText
            className={cn(
              'absolute inset-0 h-5 w-5 text-gray-500 transition-opacity duration-300',
              pathname === '/pedidos' ? 'opacity-0' : 'opacity-100',
            )}
            strokeWidth={1.5}
          />
          <ReceiptText
            className={cn(
              'absolute inset-0 h-5 w-5 text-black transition-opacity duration-300 dark:text-white',
              pathname === '/pedidos' ? 'opacity-100' : 'opacity-0',
            )}
            strokeWidth={1.5}
            fill={pathname === '/pedidos' ? 'rgb(239, 68, 68)' : 'none'}
          />
        </div>
        <span
          className={cn(
            'text-xs transition-colors duration-300',
            pathname === '/pedidos'
              ? 'font-medium text-black dark:text-white'
              : 'text-gray-500',
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
        className="flex flex-col items-center justify-center space-y-1 transition-all duration-200"
      >
        <div className="relative h-5 w-5">
          <User
            className={cn(
              'absolute inset-0 h-5 w-5 text-gray-500 transition-opacity duration-300',
              pathname === '/perfil' ? 'opacity-0' : 'opacity-100',
            )}
            strokeWidth={1.5}
          />
          <User
            className={cn(
              'absolute inset-0 h-5 w-5 text-black transition-opacity duration-300 dark:text-white',
              pathname === '/perfil' ? 'opacity-100' : 'opacity-0',
            )}
            strokeWidth={1.5}
            fill={pathname === '/perfil' ? 'rgb(239, 68, 68)' : 'none'}
          />
        </div>
        <span
          className={cn(
            'text-xs transition-colors duration-300',
            pathname === '/perfil'
              ? 'font-medium text-black dark:text-white'
              : 'text-gray-500',
          )}
        >
          Perfil
        </span>
      </Link>
    </nav>
  )
}
