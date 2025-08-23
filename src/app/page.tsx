import Navigation from '@/components/layout/Navigation'
import HeroSection from '@/components/sections/HeroSection'
import FeaturedRestaurants from '@/components/sections/FeaturedRestaurants'
import HowItWorks from '@/components/sections/HowItWorks'
import StatsSection from '@/components/sections/StatsSection'
import TrustSignals from '@/components/sections/TrustSignals'
import RestaurantPartners from '@/components/sections/RestaurantPartners'
import RidersSection from '@/components/sections/RidersSection'
import MobileAppSection from '@/components/sections/MobileAppSection'
import FinalCTASection from '@/components/sections/FinalCTASection'
import Footer from '@/components/layout/Footer'
import LazySection from '@/components/ui/LazySection'

export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      <Navigation />
      <HeroSection />
      
      <LazySection fallback={<div className="h-screen bg-gray-50 animate-pulse" />}>
        <FeaturedRestaurants />
      </LazySection>
      
      <LazySection fallback={<div className="h-96 bg-white animate-pulse" />}>
        <HowItWorks />
      </LazySection>
      
      <LazySection fallback={<div className="h-64 bg-gray-50 animate-pulse" />}>
        <StatsSection />
      </LazySection>
      
      <LazySection fallback={<div className="h-96 bg-white animate-pulse" />}>
        <TrustSignals />
      </LazySection>
      
      <LazySection fallback={<div className="h-screen bg-gray-50 animate-pulse" />}>
        <RestaurantPartners />
      </LazySection>
      
      <LazySection fallback={<div className="h-screen bg-orange-50 animate-pulse" />}>
        <RidersSection />
      </LazySection>
      
      <LazySection fallback={<div className="h-screen bg-orange-50 animate-pulse" />}>
        <MobileAppSection />
      </LazySection>
      
      <LazySection fallback={<div className="h-96 bg-orange-500 animate-pulse" />}>
        <FinalCTASection />
      </LazySection>
      
      <LazySection fallback={<div className="h-96 bg-gray-900 animate-pulse" />}>
        <Footer />
      </LazySection>
    </main>
  )
}