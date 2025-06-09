import { Button } from '@/components/ui/button'
import { ArrowRight, ChartLine, Award } from 'lucide-react'
import Image from 'next/image'
import { TilesBackground } from '../TilesBackground'
import Link from 'next/link'

export function HeroSection() {
  return (
    <div className="container relative z-10 mx-auto flex max-w-screen-2xl flex-col items-center justify-center space-y-8 px-4 py-12 lg:px-12 lg:py-20">
      <TilesBackground />
      <div className="z-10 inline-flex items-center rounded-2xl border border-slate-200 bg-muted px-3 py-1 text-center text-sm font-medium">
        🍔 Peça sua comida favorita com facilidade
      </div>
      <div className="z-10 space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
          <span className="text-red-600">Muita</span> facilidade para matar sua{' '}
          <span className="text-red-600">Fome</span>
        </h1>
        <p className="mx-auto max-w-[700px] text-sm text-muted-foreground md:text-xl">
          Descubra os melhores restaurantes com o MuitaFome. Faça pedidos
          rapidamente e acompanhe a entrega em tempo real.
        </p>
      </div>
      <div className="z-10 flex flex-col gap-4 min-[400px]:flex-row">
        <Link href="/login">
          <Button
            size="lg"
            className="gap-2 bg-red-600 text-white transition-all duration-300 hover:scale-105 hover:bg-red-700"
          >
            Pedir agora <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        {/* <Button
          size="lg"
          variant="outline"
          className="gap-2 transition-all duration-300 hover:scale-105"
        >
          Ver demo <Video className="h-4 w-4" />
        </Button> */}
      </div>
      <div className="mx-auto mt-8 w-full max-w-6xl px-4">
        <div className="relative rounded-lg border bg-background shadow-2xl">
          <div className="overflow-hidden rounded-lg">
            <Image
              src="/heroSection.png"
              alt="MuitaFome Dashboard Preview"
              width={1280}
              height={720}
              className="w-full"
              priority
              loading="eager"
              quality={85}
            />
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>
      <div className="z-10 flex flex-col items-center justify-center gap-8 py-8 lg:flex-row">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ChartLine className="h-5 w-5" />
          <span className="text-sm">Centenas de restaurantes</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Award className="h-5 w-5" />
          <span className="text-sm">Entrega rápida garantida</span>
        </div>
      </div>
    </div>
  )
}
