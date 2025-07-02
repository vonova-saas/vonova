import FooterSection from "@/components/sections/footer-section";
import HeroSection from "@/components/sections/hero-section";
import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: Props) {
  return (
    <div>
      {/* <div
        id="home"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,23,23,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,23,23,0.4)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] h-full mt-[63px"
      /> */}
      <HeroSection />
      <main className="mx-auto w-full z-40 relative">{children}</main>
      <FooterSection />
    </div>
  );
}
