import Background from "@/components/global/background";
import Container from "@/components/global/container";
import Wrapper from "@/components/global/wrapper";
import ContactSection from "@/components/marketing/contact";
import React from "react";

export default function ContactPage() {
  return (
    <Background>
      <Wrapper className="py-20 relative">
        <Container className="relative">
          <ContactSection />
        </Container>
      </Wrapper>
    </Background>
  );
}
