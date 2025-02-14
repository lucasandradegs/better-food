import Image from 'next/image'
import { ThemeToggle } from '../Theme'

export function AuthHeader() {
  return (
    <header className="supports-[backdrop-filter]:bg-background/60 fixed top-0 z-50 w-full border-b border-b-gray-200 bg-[#f5f5f5] backdrop-blur dark:border-b-[#2e2e2e] dark:bg-neutral-800">
      <div className="container mx-auto flex h-12 max-w-screen-2xl items-center justify-between scroll-smooth px-4">
        <Image src="/betterfood.png" alt="Logo" width={40} height={40} />

        <div className="items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
