import { Loader2 } from 'lucide-react'

export default function LoginLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}
