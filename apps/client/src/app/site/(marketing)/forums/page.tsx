import Background from "@/components/global/background";
import {
  MarketingCTABand,
  MarketingFeatureCard,
  MarketingHero,
  MarketingSection,
} from "@/components/site/marketing/page-shell";
import {
  ArrowRight,
  Cpu,
  Heart,
  Layers,
  MessageCircle,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const SPACES = [
  {
    icon: Layers,
    accent: "primary" as const,
    title: "Course discussion",
    description:
      "Per-course threads. Ask questions, share solutions, and learn how peers approached the same problem.",
    count: "12 courses",
  },
  {
    icon: Cpu,
    accent: "violet" as const,
    title: "Code review circle",
    description:
      "Submit a pull request, get peer + AI review, and grow your skills by reviewing others.",
    count: "Weekly cycles",
  },
  {
    icon: Sparkles,
    accent: "sky" as const,
    title: "AI lab",
    description:
      "Experiments with the AI Tutor, prompt patterns, and feedback on what works for your subject.",
    count: "Open lab",
  },
  {
    icon: Users,
    accent: "emerald" as const,
    title: "Career corner",
    description:
      "Interview retrospectives, referrals from the community, resume reviews, and mentorship matches.",
    count: "Mentor list",
  },
];

const PILLARS = [
  {
    icon: Heart,
    title: "Kindness over cleverness",
    description:
      "We're here to learn. Help others where they are now, not where you wish they were.",
  },
  {
    icon: ShieldCheck,
    title: "Safe to be a beginner",
    description:
      "Zero tolerance for ridicule. Reports are read by humans within a business day.",
  },
  {
    icon: MessageSquareText,
    title: "Search before you ask",
    description:
      "Then ask anyway if you don't find it — that's how the next learner finds an answer.",
  },
];

export default function ForumsPage() {
  return (
    <Background>
      <MarketingHero
        badge="Community"
        eyebrow="Forums"
        title="Learning is better with people."
        description="The Vonova forums are where learners stuck on lesson 7 meet learners who finished it last week. Moderated, respectful, AI-augmented, and very alive."
        actions={[
          {
            label: "Join the waitlist",
            href: "/site/contact?topic=forums",
            icon: ArrowRight,
            variant: "default",
          },
        ]}
        meta="Opening in private beta — join the waitlist to get an invite."
      />

      <MarketingSection eyebrow="Spaces" title="Where the conversations happen">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SPACES.map((s) => (
            <MarketingFeatureCard
              key={s.title}
              icon={s.icon}
              accent={s.accent}
              title={s.title}
              description={s.description}
              tag={s.count}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Code of conduct" title="Three pillars we won't bend">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <MarketingFeatureCard
              key={p.title}
              icon={p.icon}
              title={p.title}
              description={p.description}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingCTABand
        title="Be there on launch day."
        description="We're opening to a small group every week. Tell us what you're learning and we'll send you an invite."
        actions={[
          {
            label: "Request an invite",
            href: "/site/contact?topic=forums",
            icon: MessageCircle,
            variant: "default",
          },
        ]}
      />
    </Background>
  );
}
