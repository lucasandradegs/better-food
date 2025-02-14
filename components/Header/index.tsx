import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-b-gray-200 backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between scroll-smooth px-4">
        <nav className="hidden items-center space-x-6 md:flex">
          <Link
            href="#features"
            className="hover:text-primary text-sm font-medium transition-colors"
          >
            Funcionalidades
          </Link>
          <Link
            href="#testimonials"
            className="hover:text-primary text-sm font-medium transition-colors"
          >
            Depoimentos
          </Link>
        </nav>

        <div className="hidden items-center space-x-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Button
            size="sm"
            className="bg-red-600 text-white transition-all duration-300 hover:bg-red-700"
          >
            Começar agora
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm" className="px-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <nav className="mt-6 flex flex-col space-y-4">
              <Link
                href="#features"
                className="hover:text-primary text-sm font-medium transition-colors"
              >
                Funcionalidades
              </Link>
              <Link
                href="#testimonials"
                className="hover:text-primary text-sm font-medium transition-colors"
              >
                Depoimentos
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
                <Button size="sm">Começar agora</Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
