import { ChatDemoSection } from "@/components/marketing/ChatDemoSection";
import { LandingHero } from "@/components/marketing/LandingHero";
import { StatsBar } from "@/components/marketing/StatsBar";

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-text-primary">
      <LandingHero />
      <ChatDemoSection />
      <StatsBar />
    </main>
  );
}
