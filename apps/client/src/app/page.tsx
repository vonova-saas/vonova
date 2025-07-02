import HeroSection from "@/components/sections/hero-section";
import GetStarted from "@/components/sections/get-started-section";
import FooterSection from "@/components/sections/footer-section";
// import Reviews from "@/app/(landing)/components/reviews";
import Waitly from "@/components/sections/waitly-section";
import FeaturesSection12 from "@/components/sections/ai-features-section";
import FeaturesSection9 from "@/components/sections/features-9";

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection9 />
      <FeaturesSection12 />
      {/* <Reviews /> */}
      <Waitly />
      <GetStarted />
      <FooterSection />
    </div>
  );
}
