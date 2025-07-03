import FooterSection from "@/components/navigation/footer-section";
import { Header } from "@/components/navigation/header";
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
