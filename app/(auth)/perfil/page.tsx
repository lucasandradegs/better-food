'use client'

import ProfileDetails from '@/components/Profile'
import { useAuth } from '@/contexts/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <ProfileDetails
      name={user.user_metadata.name}
      email={user.user_metadata.email}
      image={user.user_metadata.avatar_url}
    />
  )
}
