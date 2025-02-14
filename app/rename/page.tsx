'use client'

import { useState } from 'react'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/SideBar'
import { useAuth } from '@/contexts/AuthContext'
import { LayoutDashboard, UserCog, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleGuard } from '@/components/RoleGuard'
import { AuthHeader } from '@/components/AuthHeader'

export default function HomeAuthenticated() {
  const { signOut } = useAuth()
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
      href: '/profile',
      icon: (
        <UserCog className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: 'Configurações',
      href: '/settings',
      icon: (
        <Settings className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
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
          <div className="flex flex-col gap-4 pt-20 md:pt-14">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <RoleGuard allowedRoles={['admin']}>
              <div>
                <h1>Painel do Administrador</h1>
                {/* Conteúdo específico do admin aqui */}
              </div>
            </RoleGuard>
          </div>
        </main>
      </div>
    </>
  )
}
