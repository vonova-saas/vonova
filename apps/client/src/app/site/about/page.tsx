import { Header } from "@/components/site/navigation/header";
import FooterSection from "@/components/site/navigation/footer-section";
import AboutSection from "@/components/site/marketing/about-section";
import TeamSection from "@/components/site/marketing/team-section";

const teamMembers = [
  {
    id: "01",
    name: "Ahmed Badawi",
    role: "Co-Founder & CTO",
    bio: "Owns platform architecture, delivery quality, and scalable learning workflows.",
    initials: "AB",
    image: "/avatars/Badawi.jpg",
  },
  {
    id: "02",
    name: "Mohamed Abolyazeed",
    role: "Founder & CEO",
    bio: "Leads product direction and ensures Vonova solves real learner pain points.",
    initials: "MA",
    image: "/avatars/photo_2026-02-15_05-48-16.jpg",
  },
  {
    id: "03",
    name: "Moataz Rashwan",
    role: "Co-Founder & CFO",
    bio: "Handles financial strategy, investment, and operational efficiency.",
    initials: "MR",
    image: "/avatars/Moataz Rashwan.webp",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">About Vonova</h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
              Meet the mission, people, and story behind the platform.
            </p>
          </div>
        </section>

        <TeamSection members={teamMembers} />

        <AboutSection />
      </main>
      <FooterSection />
    </div>
  );
}

