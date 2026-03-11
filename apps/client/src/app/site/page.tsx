import dynamic from "next/dynamic";
import HeroSection from "@/components/site/marketing/hero-section";
import Waitly from "@/components/site/marketing/waitly-section";
import FAQsSection from "@/components/site/marketing/faqs-section";
import PricingSection from "@/components/site/marketing/pricing-section";
import GetStarted from "@/components/site/marketing/get-started-section";
import FooterSection from "@/components/site/navigation/footer-section";
import Reviews from "@/components/site/marketing/reviews";
import ContentSection from "@/components/site/marketing/content-section";

// Lazy-load sections that pull in recharts, motion, dotted-map to speed up initial compile
const LMSFeaturesSection = dynamic(
  () => import("@/components/site/marketing/lms-features-section").then((m) => ({ default: m.default })),
  { ssr: true, loading: () => <section className="min-h-[200px]" aria-hidden /> }
);
const AIFeaturesSection = dynamic(
  () => import("@/components/site/marketing/ai-features-section").then((m) => ({ default: m.default })),
  { ssr: true, loading: () => <section className="min-h-[200px]" aria-hidden /> }
);

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <ContentSection />
      <LMSFeaturesSection />
      <AIFeaturesSection />
      <Reviews />
      <Waitly />
      <FAQsSection />
      <PricingSection />
      <GetStarted />
      <FooterSection />
    </div>
  );
}
