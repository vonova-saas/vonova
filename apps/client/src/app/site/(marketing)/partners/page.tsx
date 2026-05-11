import Background from "@/components/global/background";
import {
  MarketingCTABand,
  MarketingFeatureCard,
  MarketingHero,
  MarketingSection,
} from "@/components/site/marketing/page-shell";
import {
  ArrowRight,
  Building2,
  Cpu,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Plug,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const TIERS = [
  {
    icon: Plug,
    accent: "sky" as const,
    title: "Technology partner",
    description:
      "Integrate your dev tool, IDE, or sandbox directly with the Vonova classroom. We support OAuth, webhooks, and a partner-only API.",
    examples: ["Replit", "GitHub", "Linear", "Notion"],
  },
  {
    icon: GraduationCap,
    accent: "violet" as const,
    title: "Education partner",
    description:
      "Bring Vonova into your bootcamp, university, or developer community. Co-branded courses, seat licenses, and instructor onboarding included.",
    examples: ["Universities", "Bootcamps", "Developer communities"],
  },
  {
    icon: Building2,
    accent: "primary" as const,
    title: "Enterprise partner",
    description:
      "Teach your engineering organization the way you would your favorite hires. SSO, audit logs, custom analytics, and a dedicated success manager.",
    examples: ["Engineering teams", "Talent programs"],
  },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Co-marketed launches",
    description:
      "Joint blog posts, conference talks, and a feature spot on the Vonova home page during launch.",
  },
  {
    icon: HeartHandshake,
    title: "Dedicated team",
    description:
      "A named partner manager + a Slack channel with the Vonova engineering team.",
  },
  {
    icon: Cpu,
    title: "Engineering support",
    description:
      "Early access to our public API, partner-only endpoints, and design review for your integration.",
  },
];

export default function PartnersPage() {
  return (
    <Background>
      <MarketingHero
        badge="Partner with us"
        eyebrow="Partners"
        title="Build with Vonova."
        description="From IDE makers and bootcamps to universities and engineering orgs, we partner with anyone who shares the mission: teach engineering the way it should be taught."
        actions={[
          {
            label: "Become a partner",
            href: "/site/contact?topic=partner",
            icon: Send,
            variant: "default",
          },
        ]}
      />

      <MarketingSection eyebrow="Three tiers" title="Find your shape">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.title}
              className="group relative flex h-full flex-col rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
                  t.accent === "primary"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : t.accent === "violet"
                      ? "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                      : "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                }`}
              >
                <t.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-semibold">{t.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {t.description}
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {t.examples.map((e) => (
                  <li
                    key={e}
                    className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {e}
                  </li>
                ))}
              </ul>
              <a
                href="/site/contact?topic=partner"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100"
              >
                Talk to us
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="What partners get" title="The boring details">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {BENEFITS.map((b) => (
            <MarketingFeatureCard
              key={b.title}
              icon={b.icon}
              title={b.title}
              description={b.description}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingCTABand
        title="Let's build something."
        description="Email partnerships@vonova.app with a one-paragraph pitch and we'll book a 30-minute call."
        actions={[
          {
            label: "Start the conversation",
            href: "mailto:partnerships@vonova.app",
            icon: Handshake,
            variant: "default",
          },
          {
            label: "See platform features",
            href: "/site#features",
            icon: Sparkles,
            variant: "outline",
          },
        ]}
      />
    </Background>
  );
}
