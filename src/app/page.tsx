import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import SocialProof from '@/components/landing/SocialProof'
import BentoGrid from '@/components/landing/BentoGrid'
import { UseCases } from '@/components/landing/UseCases'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import Pricing from '@/components/landing/Pricing'
import WhyIng from '@/components/landing/WhyIng'
import { BlogSection } from '@/components/landing/BlogSection'
import { TutorialsSection } from '@/components/landing/TutorialsSection'
import { FAQ } from '@/components/landing/FAQ'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <BentoGrid />
        <UseCases />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <WhyIng />
        <BlogSection />
        <TutorialsSection />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

