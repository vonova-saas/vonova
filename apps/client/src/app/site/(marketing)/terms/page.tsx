import Background from "@/components/global/background";
import {
  MarketingHero,
  MarketingSection,
} from "@/components/site/marketing/page-shell";
import {
  AlertOctagon,
  BookOpen,
  CreditCard,
  Gavel,
  Globe,
  Mail,
  ScrollText,
  ShieldX,
  UserCheck,
} from "lucide-react";

const SECTIONS = [
  {
    id: "agreement",
    icon: ScrollText,
    title: "1. Your agreement with Vonova",
    body: "By creating an account or using Vonova, you agree to these terms and our Privacy Policy. If you don't agree, please don't use the platform.",
  },
  {
    id: "account",
    icon: UserCheck,
    title: "2. Your account",
    body: "You are responsible for keeping your credentials safe and for activity under your account. You must be at least 13 years old, or the minimum age required by your country, to register.",
  },
  {
    id: "content",
    icon: BookOpen,
    title: "3. Course content & ownership",
    body: "Instructors own the materials they upload. By publishing on Vonova, instructors grant us a license to host, distribute, and stream their content to enrolled students. Students may not redistribute, mirror, or resell course content.",
  },
  {
    id: "acceptable-use",
    icon: ShieldX,
    title: "4. Acceptable use",
    body: "No scraping, no bypassing access controls, no uploading malware, no harassment, no copyright infringement, no spam. We may suspend accounts that violate these rules.",
  },
  {
    id: "billing",
    icon: CreditCard,
    title: "5. Billing & refunds",
    body: "Paid plans renew automatically until cancelled. Course refunds follow each course's listed policy and applicable consumer-protection law. Subscriptions can be cancelled at any time from your billing portal.",
  },
  {
    id: "ip",
    icon: Gavel,
    title: "6. Intellectual property",
    body: "Vonova, the platform UI, and the AI features are protected by intellectual property laws. You receive a limited, revocable license to use them for personal, non-commercial learning, plus any expanded rights described in your subscription.",
  },
  {
    id: "termination",
    icon: AlertOctagon,
    title: "7. Termination",
    body: "Either party can end this agreement. We may suspend or close accounts that materially violate these terms; you can close yours at any time from your account settings.",
  },
  {
    id: "law",
    icon: Globe,
    title: "8. Governing law",
    body: "These terms are governed by the laws of the jurisdiction where Vonova is established, subject to any mandatory consumer protections in your country of residence.",
  },
];

export default function TermsPage() {
  return (
    <Background>
      <MarketingHero
        badge="Legal"
        eyebrow="Terms of Service"
        title="The rules of the road."
        description="Plain-language terms that govern your use of Vonova, our courses, and our AI features."
        meta="Effective June 1, 2026"
        actions={[
          {
            label: "Email legal team",
            href: "mailto:legal@vonova.app",
            icon: Mail,
            variant: "outline",
          },
        ]}
      />

      <MarketingSection
        eyebrow="In detail"
        title="Eight quick sections"
        description="Each block is a self-contained agreement so you can scan to the section you need."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <nav
            aria-label="Terms sections"
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
          <div className="space-y-6">
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
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {s.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>
    </Background>
  );
}
