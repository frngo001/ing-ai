import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import dynamic from 'next/dynamic'

const SocialProof = dynamic(() => import('@/components/landing/SocialProof'), { ssr: false })
const BentoGrid = dynamic(() => import('@/components/landing/BentoGrid'), { ssr: false })
const UseCases = dynamic(() => import('@/components/landing/UseCases').then(mod => mod.UseCases), { ssr: false })
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(mod => mod.HowItWorks), { ssr: false })
const Testimonials = dynamic(() => import('@/components/landing/Testimonials').then(mod => mod.Testimonials), { ssr: false })
const Pricing = dynamic(() => import('@/components/landing/Pricing'), { ssr: false })
const WhyIng = dynamic(() => import('@/components/landing/WhyIng'), { ssr: false })
const BlogSection = dynamic(() => import('@/components/landing/BlogSection').then(mod => mod.BlogSection), { ssr: false })
const TutorialsSection = dynamic(() => import('@/components/landing/TutorialsSection').then(mod => mod.TutorialsSection), { ssr: false })
const FAQ = dynamic(() => import('@/components/landing/FAQ').then(mod => mod.FAQ), { ssr: false })
const CTASection = dynamic(() => import('@/components/landing/CTASection').then(mod => mod.CTASection), { ssr: false })
const Footer = dynamic(() => import('@/components/landing/Footer').then(mod => mod.Footer), { ssr: false })

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

