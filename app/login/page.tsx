'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { UserRoundPlus } from 'lucide-react'
import { useRouter } from 'next/dist/client/components/navigation'
import Image from 'next/image'
import { useEffect } from 'react'

export default function Login() {
  const { signInWithGoogle, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/inicio')
    }
  }, [user, router, isLoading])

  if (isLoading) {
    return null
  }

  return (
    <div className="grid h-screen w-full grid-cols-1 items-center justify-center pl-4 md:grid-cols-2">
      <div className="mx-auto flex flex-col items-start justify-center px-2 lg:w-[500px]">
        <div className="flex items-center justify-start">
          <UserRoundPlus className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tighter sm:text-4xl">
          Faça login para começar a ter o controle do seu restaurante
        </h1>
        <span className="text-muted-foreground mt-4 pb-10 text-sm">
          Faça login com sua conta do Google para acessar o seu dashboard
        </span>
        <Button
          className="border-1 w-full rounded-full border-gray-300 bg-transparent text-base text-black hover:bg-gray-100"
          size={'lg'}
          onClick={signInWithGoogle}
        >
          <Image src="/googleIcon.svg" alt="Google" width={20} height={20} />
          Entrar com Google
        </Button>

        <span className="text-muted-foreground pt-4 text-sm">
          Criando uma conta, você aceita os termos e condições de uso
        </span>
      </div>
      <div className="relative hidden h-screen w-full md:block">
        <Image
          src="/loginPI2.png"
          alt="Imagem"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
