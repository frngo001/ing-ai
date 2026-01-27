import Navbar from '@/components/landing/Navbar'
import dynamic from 'next/dynamic'
import { LandingSections } from '@/components/landing/LandingSections'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <LandingSections />
    </div>
  )
}

