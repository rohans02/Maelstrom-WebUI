import { HeroSection } from "@/components/landing/hero-section"
import { ValuePropsSection } from "@/components/landing/value-props-section"

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen overflow-x-hidden">
      <main className="w-full bg-gradient-pattern overflow-x-hidden">
        <HeroSection />
        <ValuePropsSection />
        {/* <StatsSection /> */}
      </main>
    </div>
  )
}
