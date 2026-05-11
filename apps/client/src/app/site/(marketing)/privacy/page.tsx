import Background from "@/components/global/background";
import {
  MarketingHero,
  MarketingSection,
} from "@/components/site/marketing/page-shell";
import {
  Cookie,
  Database,
  EyeOff,
  FileLock,
  Mail,
  Server,
  ShieldCheck,
  UserCog,
} from "lucide-react";

const SECTIONS = [
  {
    id: "what-we-collect",
    icon: Database,
    title: "1. What we collect",
    body: [
      "Account details you provide directly: name, email, profile picture, role (student / instructor), and authentication identifiers.",
      "Usage signals required to make the LMS work: lessons viewed, quiz attempts, problem submissions, course progress, and last-activity timestamps.",
      "Technical metadata: IP address, browser, device type, and pages visited, used solely for security, fraud prevention, and product analytics.",
    ],
  },
  {
    id: "how-we-use-it",
    icon: UserCog,
    title: "2. How we use your data",
    body: [
      "Deliver the core learning experience — courses, AI features, progress tracking, and certificates.",
      "Personalize content, send transactional emails (receipts, password reset, course updates) and, if you opt in, product news.",
      "Detect abuse, secure your account, and meet legal obligations (tax, accounting, etc.).",
    ],
  },
  {
    id: "we-never-sell",
    icon: EyeOff,
    title: "3. We do not sell your data",
    body: [
      "Vonova does not sell personal data to advertisers or data brokers.",
      "Trusted infrastructure subprocessors (e.g. hosting, payments, email delivery) receive only the minimum data required to do their job, under strict contractual safeguards.",
    ],
  },
  {
    id: "your-rights",
    icon: ShieldCheck,
    title: "4. Your rights",
    body: [
      "You can access, export, correct, or delete your personal data at any time from your account settings, or by emailing privacy@vonova.app.",
      "If you're in the EU/UK, you also have rights under GDPR including data portability, restriction, and lodging a complaint with your local supervisory authority.",
    ],
  },
  {
    id: "retention",
    icon: Server,
    title: "5. How long we keep it",
    body: [
      "Active accounts: as long as your account is open. Closed accounts: anonymized within 90 days of deletion, except where law requires longer retention (e.g. billing records).",
      "Backups containing personal data are encrypted and rotated on a 30-day cycle.",
    ],
  },
  {
    id: "transfers",
    icon: FileLock,
    title: "6. International transfers",
    body: [
      "Data may be processed in the EU, UK, and the US by Vonova or its subprocessors. Where transfers happen, we rely on Standard Contractual Clauses and equivalent safeguards.",
    ],
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "7. Cookies & tracking",
    body: [
      "We use a small number of essential cookies for sign-in, preferences, and security, and optional analytics cookies you can disable in your browser.",
      "Full details and the cookie inventory live on our Cookies page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <Background>
      <MarketingHero
        badge="Legal"
        eyebrow="Privacy Policy"
        title="Your data, your terms."
        description="We collect only what is needed to deliver Vonova, store it safely, and give you full control. This document explains exactly what that means."
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
        eyebrow="At a glance"
        title="Four promises we keep"
        description="The full text is below. Here's the short version."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, label: "Minimum data, max care" },
            { icon: EyeOff, label: "We never sell your data" },
            { icon: UserCog, label: "Full export & delete" },
            { icon: FileLock, label: "Encrypted at rest & in transit" },
          ].map((p) => (
            <div
              key={p.label}
              className="rounded-2xl border border-border/60 bg-card/70 p-4 text-sm shadow-sm backdrop-blur-sm"
            >
              <p.icon className="mb-2 h-5 w-5 text-primary" />
              <p className="font-medium">{p.label}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="In detail"
        title="What this policy covers"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <nav
            aria-label="Privacy policy sections"
            className="md:sticky md:top-24 md:self-start"
          >
            <ul className="space-y-1 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <article
                key={s.id}
                id={s.id}
                className="scroll-mt-24 rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-semibold sm:text-xl">
                    {s.title}
                  </h2>
                </div>
                {s.body.map((p, i) => (
                  <p
                    key={i}
                    className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
                  >
                    {p}
                  </p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>
    </Background>
  );
}
