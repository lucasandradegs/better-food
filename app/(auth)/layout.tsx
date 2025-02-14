'use client'

import { Sidebar, SidebarBody, SidebarLink } from '@/components/SideBar'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, UserCog, LogOut, ChartArea } from 'lucide-react'
import { AuthHeader } from '@/components/AuthHeader'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const links = [
    {
      label: 'Início',
      href: '/inicio',
      icon: (
        <LayoutDashboard className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: 'Perfil',
      href: '/perfil',
      icon: (
        <UserCog className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <ChartArea className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, router, isLoading])

  if (!user) {
    return null
  }

  return (
    <>
      <AuthHeader />
      <div
        className={cn(
          'flex min-h-screen w-full bg-white dark:bg-neutral-800',
          'flex-col md:flex-row',
        )}
      >
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
              <div className="flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
          </SidebarBody>
        </Sidebar>
        <main
          className={cn(
            'w-full flex-1 overflow-auto p-4 md:p-8',
            'transition-[margin] duration-300 ease-in-out',
            'md:ml-[68px]',
            open ? 'md:ml-[200px]' : 'md:ml-[68px]',
            'bg-white dark:bg-[#161616]',
          )}
        >
          <div className="flex flex-col gap-4 pt-20 md:pt-14">{children}</div>
        </main>
      </div>
      <Toaster />
    </>
  )
}
