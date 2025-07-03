import Background from "@/components/global/background";
import Container from "@/components/global/container";
import Wrapper from "@/components/global/wrapper";
import React from "react";

export default function PrivacyPage() {
  return (
    <Background>
      <Wrapper className="py-20 relative">
        <Container className="relative">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-semibold font-heading text-center mt-6 !leading-tight">
            Privacy Page
          </h1>
        </Container>
      </Wrapper>
    </Background>
  );
}
