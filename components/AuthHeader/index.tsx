import Image from 'next/image'
import { ThemeToggle } from '../Theme'
import { NotificationsPopover } from '../Notifications'
import { CartSheet } from '../Cart'
import { usePathname } from 'next/navigation'
import { RemoveScroll } from 'react-remove-scroll'

export function AuthHeader() {
  const pathname = usePathname()
  const isCheckout = pathname.includes('checkout')

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b border-b-[#dfdfdf] bg-[#f8f8f8] dark:border-b-[#343434] dark:bg-[#1c1c1c] ${RemoveScroll.classNames.zeroRight}`}
    >
      <div className="mx-auto flex h-12 items-center justify-between scroll-smooth px-4">
        <Image src="/muitafome.png" alt="Logo" width={40} height={40} />
        <div className="flex items-center gap-6">
          {!isCheckout && <CartSheet />}
          <NotificationsPopover />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
