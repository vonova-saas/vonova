import FooterSection from "@/components/site/navigation/footer-section";
import { Header } from "@/components/site/navigation/header";
import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function LandingLayout({ children }: Props) {
  return (
    <div>
      <Header />
      <main className="mx-auto w-full relative">{children}</main>
      <FooterSection />
    </div>
  );
}
