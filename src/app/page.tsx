import {
  LandingHeader,
  HeroSection,
  FeaturesSection,
  GoalsSection,
  HowItWorksSection,
  PricingSection,
  CTASection,
  Footer,
} from "@/components/landing";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <GoalsSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
