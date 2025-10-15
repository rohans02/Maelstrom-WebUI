import { HeroSection } from "@/components/landing/hero-section"
import { ValuePropsSection } from "@/components/landing/value-props-section"
import { StatsSection } from "@/components/landing/stats-section"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <main className="bg-gradient-pattern overflow-hidden">
        <HeroSection />
        <ValuePropsSection />
        {/* <StatsSection /> */}
      </main>
    </div>
  )
}
