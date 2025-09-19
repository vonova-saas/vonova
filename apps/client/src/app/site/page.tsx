import HeroSection from "@/components/site/marketing/hero-section";
import Waitly from "@/components/site/marketing/waitly-section";
import AIFeaturesSection from "@/components/site/marketing/ai-features-section";
import LMSFeaturesSection from "@/components/site/marketing/lms-features-section";
// import Reviews from "@/app/(landing)/components/reviews";
import FAQsSection from "@/components/site/marketing/faqs-section";
import PricingSection from "@/components/site/marketing/pricing-section";
import GetStarted from "@/components/site/marketing/get-started-section";
import FooterSection from "@/components/site/navigation/footer-section";
import Reviews from "@/components/site/marketing/reviews";
import ContentSection from "@/components/site/marketing/content-section";
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
