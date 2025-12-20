import { redirect } from "next/navigation";
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

interface HomePageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  
  // If there's an OAuth code parameter, redirect to auth callback
  // This handles cases where Google redirects to the wrong URL
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`);
  }

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
