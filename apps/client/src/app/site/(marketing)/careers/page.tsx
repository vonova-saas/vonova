import Background from "@/components/global/background";
import {
  MarketingCTABand,
  MarketingFeatureCard,
  MarketingHero,
  MarketingSection,
  MarketingStatCard,
} from "@/components/site/marketing/page-shell";
import {
  ArrowRight,
  Briefcase,
  Coffee,
  Globe,
  GraduationCap,
  HeartHandshake,
  Mail,
  MapPin,
  Sparkles,
  Stethoscope,
  Wallet,
} from "lucide-react";

const OPENINGS = [
  {
    team: "Engineering",
    title: "Senior Full-stack Engineer",
    location: "Remote · Worldwide",
    type: "Full-time",
  },
  {
    team: "Engineering",
    title: "Frontend Engineer, Course Player",
    location: "Remote · Europe / Africa",
    type: "Full-time",
  },
  {
    team: "AI",
    title: "ML Engineer — Tutor & Personalization",
    location: "Hybrid · Cairo / Remote",
    type: "Full-time",
  },
  {
    team: "Design",
    title: "Product Designer",
    location: "Remote · Worldwide",
    type: "Full-time",
  },
  {
    team: "Customer Success",
    title: "Instructor Success Lead",
    location: "Remote · Worldwide",
    type: "Full-time",
  },
];

const VALUES = [
  {
    icon: Sparkles,
    accent: "primary" as const,
    title: "Ship work that matters",
    description:
      "We pick problems with measurable impact on real learners — not vanity metrics.",
  },
  {
    icon: HeartHandshake,
    accent: "violet" as const,
    title: "Trust by default",
    description:
      "Async-first, transparent decisions, written-down context. No surveillance, ever.",
  },
  {
    icon: GraduationCap,
    accent: "sky" as const,
    title: "Keep learning",
    description:
      "We dogfood our own platform. Every engineer takes one course a quarter.",
  },
];

const BENEFITS = [
  { icon: Globe, label: "Fully remote", text: "Work from wherever you ship best." },
  { icon: Wallet, label: "Competitive equity", text: "Real ownership in what we build." },
  { icon: Stethoscope, label: "Health & wellness", text: "Stipend for medical, dental, mental health." },
  { icon: Coffee, label: "Two on-sites / year", text: "Team meet-ups in Cairo + a rotating second city." },
];

export default function CareersPage() {
  return (
    <Background>
      <MarketingHero
        badge="We're hiring"
        eyebrow="Careers"
        title="Build the future of how the next million engineers learn."
        description="Vonova is a small, async, and very ambitious team. We move quickly, write everything down, and care deeply about the craft of teaching."
        actions={[
          {
            label: "See open roles",
            href: "#openings",
            icon: ArrowRight,
            variant: "default",
          },
          {
            label: "people@vonova.app",
            href: "mailto:people@vonova.app",
            icon: Mail,
            variant: "outline",
          },
        ]}
      />

      <MarketingSection>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MarketingStatCard
            label="Team"
            value="22"
            accent="text-foreground"
          />
          <MarketingStatCard
            label="Time zones"
            value="9"
            accent="text-sky-600 dark:text-sky-400"
          />
          <MarketingStatCard
            label="Open roles"
            value={OPENINGS.length}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <MarketingStatCard
            label="Remote"
            value="100%"
            accent="text-violet-600 dark:text-violet-400"
          />
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="How we work" title="Three things we take seriously">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {VALUES.map((v) => (
            <MarketingFeatureCard
              key={v.title}
              icon={v.icon}
              accent={v.accent}
              title={v.title}
              description={v.description}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Perks" title="Benefits">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.label}
              className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-sm"
            >
              <b.icon className="mb-3 h-5 w-5 text-primary" />
              <p className="font-medium">{b.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        id="openings"
        eyebrow="Open roles"
        title="Find your team"
        description="Don't see the right role? Email us — we always want to talk to exceptional people."
      >
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-sm">
          <ul className="divide-y divide-border/60">
            {OPENINGS.map((role) => (
              <li
                key={role.title}
                className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold sm:text-base">
                      {role.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{role.team}</span>
                      <span aria-hidden>•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {role.location}
                      </span>
                      <span aria-hidden>•</span>
                      <span>{role.type}</span>
                    </div>
                  </div>
                </div>
                <a
                  href={`mailto:people@vonova.app?subject=${encodeURIComponent(
                    "Application: " + role.title,
                  )}`}
                  className="inline-flex items-center gap-1 self-start rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 sm:self-center"
                >
                  Apply
                  <ArrowRight className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </MarketingSection>

      <MarketingCTABand
        title="Nothing matches? Tell us anyway."
        description="If you can show us extraordinary work, we'll make room. Send a one-page intro and links to people@vonova.app."
        actions={[
          {
            label: "Email people team",
            href: "mailto:people@vonova.app",
            icon: Mail,
            variant: "default",
          },
        ]}
      />
    </Background>
  );
}
