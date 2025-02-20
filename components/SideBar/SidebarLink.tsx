'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useSidebar } from '.'

interface Links {
  label: string
  href: string
  icon: React.JSX.Element | React.ReactNode
  onClick?: () => void
}

export function SidebarLink({
  link,
  className,
  ...props
}: {
  link: Links
  className?: string
}) {
  const { open, animate } = useSidebar()
  const pathname = usePathname()

  const isActive = pathname === link.href

  // Se for um link de navegação (não é o botão de logout), adiciona o prefetch
  const linkProps = !link.onClick
    ? {
        prefetch: true,
      }
    : {}

  return (
    <Link
      href={link.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group/sidebar flex items-center justify-start gap-2 rounded-md px-2 py-2 transition-colors',
        'hover:bg-neutral-200 dark:hover:bg-neutral-700',
        'aria-[current=page]:bg-[#ededed] dark:aria-[current=page]:bg-neutral-600',
        className,
      )}
      onClick={link.onClick}
      {...linkProps}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="!m-0 inline-block whitespace-pre !p-0 text-sm text-neutral-700 dark:text-neutral-200"
      >
        {link.label}
      </motion.span>
    </Link>
  )
}
