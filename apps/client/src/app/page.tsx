import HeroSection from "@/components/marketing/hero-section";
import Waitly from "@/components/marketing/waitly-section";
import AIFeaturesSection from "@/components/marketing/ai-features-section";
import LMSFeaturesSection from "@/components/marketing/lms-features-section";
// import Reviews from "@/app/(landing)/components/reviews";
import FAQsSection from "@/components/marketing/faqs-section";
import PricingSection from "@/components/marketing/pricing-section";
import GetStarted from "@/components/marketing/get-started-section";
import FooterSection from "@/components/navigation/footer-section";
import Reviews from "@/components/marketing/reviews";
import ContentSection from "@/components/marketing/content-section";
// import Background from "@/components/global/background";
// import Wrapper from "@/components/global/wrapper";

export default function LandingPage() {
  return (
    // <Background>
    //   <Wrapper>
    <div>
      <HeroSection />
      <ContentSection />
      <LMSFeaturesSection />
      <AIFeaturesSection />
      {/* <Reviews /> */}
      <Reviews />
      <Waitly />
      <FAQsSection />
      <PricingSection />
      <GetStarted />
      <FooterSection />
    </div>
    //  </Wrapper>
    // </Background>
  );
}
