import { HeroSection } from '@/components/Hero'
import { Header } from '@/components/Header'

export default function Home() {
  return (
    <div className="light" data-theme="light">
      <Header />
      <HeroSection />
    </div>
  )
}
