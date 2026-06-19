import { BookPreviewSection } from "@/components/marketing/BookPreviewSection";
import { AiGuidanceSection } from "@/components/marketing/AiGuidanceSection";
import { ComparisonSection } from "@/components/marketing/ComparisonSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { FinalCTASection } from "@/components/marketing/FinalCTASection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { LandingHero } from "@/components/marketing/LandingHero";
import { StatsBar } from "@/components/marketing/StatsBar";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-text-primary">
      <LandingHero />
      <AiGuidanceSection />
      <StatsBar />
      <HowItWorksSection />
      <BookPreviewSection />
      <ComparisonSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
