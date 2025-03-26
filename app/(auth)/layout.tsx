'use client'

import { Sidebar, SidebarBody, SidebarLink } from '@/components/SideBar'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import React, { Suspense, useEffect, useState } from 'react'
import { UserCog, LogOut, ChartArea, Package, Pizza } from 'lucide-react'
import { AuthHeader } from '@/components/AuthHeader'
import { cn } from '@/lib/utils'
import { RoleGuard } from '@/components/RoleGuard'
import MobileNav from '@/components/MobileNav'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    {
      label: 'Início',
      href: '/inicio',
      icon: (
        <Pizza className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: 'Pedidos',
      href: '/pedidos',
      icon: (
        <Package className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      divider: true,
    },
    {
      label: 'Perfil',
      href: '/perfil',
      icon: (
        <UserCog className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      divider: true,
    },
    {
      label: 'Sair',
      href: '#',
      icon: (
        <LogOut className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
      onClick: signOut,
    },
  ]

  const adminLinks = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <ChartArea className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ]

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, router, isLoading])

  if (!user) {
    return null
  }

  const isCheckoutPage = pathname === '/checkout'

  return (
    <>
      <div
        className={cn(
          'grid min-h-screen w-full',
          'grid-areas-mobile md:grid-areas-desktop',
          'md:grid-cols-sidebar grid-cols-1',
          'grid-rows-header',
          'bg-[#f8f8f8] dark:bg-[#1c1c1c]',
        )}
      >
        <header className="grid-in-header">
          <AuthHeader />
        </header>

        <aside
          className={cn('grid-in-sidebar', 'h-full', {
            'hidden md:block': !isCheckoutPage,
            hidden: isCheckoutPage,
          })}
        >
          <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody
              className={cn('justify-between gap-10', {
                'hidden md:hidden': isCheckoutPage,
              })}
            >
              <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col gap-2">
                  {links.map((link, idx) => (
                    <React.Fragment key={idx}>
                      <SidebarLink link={link} />
                      {link.divider && (
                        <div className="h-[1px] bg-[#dfdfdf] dark:bg-neutral-700" />
                      )}
                    </React.Fragment>
                  ))}
                  <RoleGuard allowedRoles={['admin']}>
                    {adminLinks.map((link, idx) => (
                      <SidebarLink key={`admin-${idx}`} link={link} />
                    ))}
                  </RoleGuard>
                </div>
              </div>
            </SidebarBody>
          </Sidebar>
        </aside>

        <main
          className={cn(
            'grid-in-main',
            'w-full overflow-auto p-4 md:p-8',
            'bg-[#f8f8f8] dark:bg-[#1c1c1c] max-md:pb-20',
          )}
        >
          <div className="flex flex-col gap-4">
            {children}
            <Suspense fallback={null}>
              <MobileNav />
            </Suspense>
          </div>
        </main>
      </div>
    </>
  )
}
