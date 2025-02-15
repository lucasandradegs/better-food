'use client'

import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'

export function ForcedLightThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isPublicRoute = pathname === '/' || pathname === '/login'

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={isPublicRoute ? 'light' : 'system'}
      enableSystem={!isPublicRoute}
      forcedTheme={isPublicRoute ? 'light' : undefined}
    >
      {children}
    </ThemeProvider>
  )
}
