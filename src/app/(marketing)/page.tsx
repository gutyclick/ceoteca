import { BookPreviewSection } from "@/components/marketing/BookPreviewSection";
import { ChatDemoSection } from "@/components/marketing/ChatDemoSection";
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
      <ChatDemoSection />
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
