import { BookPreviewSection } from "@/components/marketing/BookPreviewSection";
import { ComparisonSection } from "@/components/marketing/ComparisonSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { FinalCTASection } from "@/components/marketing/FinalCTASection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { LandingHero } from "@/components/marketing/LandingHero";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf8] text-slate-950">
      <LandingHero />
      <HowItWorksSection />
      <BookPreviewSection />
      <ComparisonSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
