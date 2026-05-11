import Background from "@/components/global/background";
import {
  MarketingCTABand,
  MarketingFeatureCard,
  MarketingHero,
  MarketingSection,
  MarketingStatCard,
} from "@/components/site/marketing/page-shell";
import {
  Award,
  BookOpen,
  Gift,
  Globe2,
  HeartHandshake,
  Megaphone,
  Mic,
  Send,
  Sparkles,
  Trophy,
} from "lucide-react";

const PERKS = [
  {
    icon: Trophy,
    accent: "amber" as const,
    title: "Free annual plan",
    description:
      "Full Vonova Pro on us for the full year you're an ambassador — plus AI Tutor quota refilled monthly.",
  },
  {
    icon: Gift,
    accent: "rose" as const,
    title: "Vonova swag pack",
    description:
      "T-shirt, sticker set, notebook, and an enamel pin. Shipped twice a year, worldwide.",
  },
  {
    icon: Mic,
    accent: "violet" as const,
    title: "Speaker stage",
    description:
      "Reserved Q&A slots on Vonova events, plus instructor-team office hours every month.",
  },
  {
    icon: BookOpen,
    accent: "primary" as const,
    title: "Early access",
    description:
      "Preview new features two weeks before public launch and ship your feedback directly to the team.",
  },
  {
    icon: Award,
    accent: "emerald" as const,
    title: "Certificate of recognition",
    description:
      "Verifiable digital badge for your LinkedIn + a signed certificate at the end of your term.",
  },
  {
    icon: HeartHandshake,
    accent: "sky" as const,
    title: "Referral rewards",
    description:
      "Every learner that joins via your link earns you credits redeemable as paid courses or cash.",
  },
];

const RESPONSIBILITIES = [
  "Host one community session per month (online).",
  "Welcome 5+ new learners on the forums every month.",
  "Share monthly feedback on a single Vonova feature.",
  "Represent Vonova kindly, in your own voice.",
];

export default function AmbassadorsPage() {
  return (
    <Background>
      <MarketingHero
        badge="Apply"
        eyebrow="Ambassadors program"
        title="Champion learning. Get rewarded."
        description="Vonova Ambassadors are passionate learners and instructors who help newcomers find their footing. The program is small on purpose — we pick people, not numbers."
        actions={[
          {
            label: "Apply now",
            href: "/site/contact?topic=ambassador",
            icon: Send,
            variant: "default",
          },
        ]}
        meta="Next cohort opens July 1, 2026"
      />

      <MarketingSection>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MarketingStatCard label="Ambassadors" value="48" />
          <MarketingStatCard
            label="Countries"
            value="22"
            accent="text-sky-600 dark:text-sky-400"
          />
          <MarketingStatCard
            label="Sessions / month"
            value="60+"
            accent="text-violet-600 dark:text-violet-400"
          />
          <MarketingStatCard
            label="Learners reached"
            value="9k"
            accent="text-emerald-600 dark:text-emerald-400"
          />
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Perks" title="What you get">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((p) => (
            <MarketingFeatureCard
              key={p.title}
              icon={p.icon}
              accent={p.accent}
              title={p.title}
              description={p.description}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="In return"
        title="What we ask of you"
        description="No quotas. No NDAs. Just a small, real commitment to the community."
      >
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
          <ul className="space-y-3">
            {RESPONSIBILITIES.map((r) => (
              <li key={r} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                  <Sparkles className="h-3 w-3" />
                </span>
                <span className="text-muted-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </MarketingSection>

      <MarketingCTABand
        title="Three minutes is all it takes to apply."
        description="Tell us your story, link your favorite course, and we'll follow up within a week."
        actions={[
          {
            label: "Start application",
            href: "/site/contact?topic=ambassador",
            icon: Megaphone,
            variant: "default",
          },
          {
            label: "How it works",
            href: "#",
            icon: Globe2,
            variant: "outline",
          },
        ]}
      />
    </Background>
  );
}
