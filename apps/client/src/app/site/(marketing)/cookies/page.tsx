import Background from "@/components/global/background";
import {
  MarketingFeatureCard,
  MarketingHero,
  MarketingSection,
} from "@/components/site/marketing/page-shell";
import { Cookie, KeyRound, LineChart, Mail, Settings2 } from "lucide-react";

const COOKIE_TYPES = [
  {
    icon: KeyRound,
    title: "Strictly necessary",
    accent: "primary" as const,
    description:
      "Keep you signed in, remember your session, and protect against CSRF. Cannot be disabled or the site won't work.",
    examples: ["vonova_session", "csrf_token", "auth_jwt"],
  },
  {
    icon: Settings2,
    title: "Preferences",
    accent: "sky" as const,
    description:
      "Store your theme, language, and UI choices so the platform looks the same on every visit.",
    examples: ["theme", "lang", "course_view"],
  },
  {
    icon: LineChart,
    title: "Analytics",
    accent: "violet" as const,
    description:
      "Aggregated, anonymized usage signals so we can fix broken pages and improve the learning experience.",
    examples: ["vonova_anon_id", "_vn_ga"],
  },
] as const;

export default function CookiesPage() {
  return (
    <Background>
      <MarketingHero
        badge="Legal"
        eyebrow="Cookie Policy"
        title="A short, honest cookie inventory."
        description="Vonova uses cookies for three things: keep you signed in, remember your preferences, and understand which features are useful. That's it."
        meta="Last updated June 1, 2026"
        actions={[
          {
            label: "Email privacy team",
            href: "mailto:privacy@vonova.app",
            icon: Mail,
            variant: "outline",
          },
        ]}
      />

      <MarketingSection
        eyebrow="By category"
        title="What we actually store"
        description="You can manage analytics cookies from your browser settings or via the cookie banner. Strictly-necessary cookies cannot be disabled without breaking sign-in."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COOKIE_TYPES.map((c) => (
            <MarketingFeatureCard
              key={c.title}
              icon={c.icon}
              title={c.title}
              accent={c.accent}
              description={
                <>
                  {c.description}
                  <span className="mt-3 flex flex-wrap gap-1">
                    {c.examples.map((e) => (
                      <span
                        key={e}
                        className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {e}
                      </span>
                    ))}
                  </span>
                </>
              }
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Control"
        title="Manage your cookies"
        description="You're always in charge."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MarketingFeatureCard
            icon={Cookie}
            title="From Vonova"
            description="Open the cookie banner (bottom of any page on first visit) to accept, reject, or customize categories. Your choice is remembered for 12 months."
          />
          <MarketingFeatureCard
            icon={Settings2}
            title="From your browser"
            description="All modern browsers let you block, allow, or wipe cookies per-site. Vonova respects the Global Privacy Control signal when sent."
          />
        </div>
      </MarketingSection>
    </Background>
  );
}
