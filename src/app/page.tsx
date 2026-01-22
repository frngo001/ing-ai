import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import SocialProof from '@/components/landing/SocialProof'
import BentoGrid from '@/components/landing/BentoGrid'
import dynamic from 'next/dynamic'

const UseCases = dynamic(() => import('@/components/landing/UseCases').then(mod => mod.UseCases), { loading: () => null })
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(mod => mod.HowItWorks), { loading: () => null })
const Testimonials = dynamic(() => import('@/components/landing/Testimonials').then(mod => mod.Testimonials), { loading: () => null })
const Pricing = dynamic(() => import('@/components/landing/Pricing'), { loading: () => null })
const WhyIng = dynamic(() => import('@/components/landing/WhyIng'), { loading: () => null })
const BlogSection = dynamic(() => import('@/components/landing/BlogSection').then(mod => mod.BlogSection), { loading: () => null })
const TutorialsSection = dynamic(() => import('@/components/landing/TutorialsSection').then(mod => mod.TutorialsSection), { loading: () => null })
const FAQ = dynamic(() => import('@/components/landing/FAQ').then(mod => mod.FAQ), { loading: () => null })
const CTASection = dynamic(() => import('@/components/landing/CTASection').then(mod => mod.CTASection), { loading: () => null })
const Footer = dynamic(() => import('@/components/landing/Footer').then(mod => mod.Footer), { loading: () => null })

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-4">
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

