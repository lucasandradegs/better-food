'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ReactNode } from 'react'

type RoleGuardProps = {
  children: ReactNode
  allowedRoles: ('admin' | 'customer')[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { userProfile, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return null
  }

  return <>{children}</>
}
