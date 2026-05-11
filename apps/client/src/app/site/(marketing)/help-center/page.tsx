"use client";

import { useMemo, useState } from "react";
import Background from "@/components/global/background";
import {
  MarketingFeatureCard,
  MarketingHero,
  MarketingSection,
} from "@/components/site/marketing/page-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  GraduationCap,
  LifeBuoy,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  {
    icon: GraduationCap,
    accent: "primary" as const,
    title: "Getting started",
    description: "Account setup, profile, enrolling in your first course.",
  },
  {
    icon: Sparkles,
    accent: "violet" as const,
    title: "AI features",
    description:
      "PDF Summary, AI Tutor, code feedback, monthly usage limits.",
  },
  {
    icon: CreditCard,
    accent: "emerald" as const,
    title: "Billing",
    description: "Subscriptions, invoices, refunds, instructor payouts.",
  },
  {
    icon: ShieldCheck,
    accent: "amber" as const,
    title: "Privacy & Security",
    description: "2FA, sessions, data export, account deletion.",
  },
  {
    icon: Settings,
    accent: "sky" as const,
    title: "Course management",
    description: "Lessons, materials, quizzes, problems, visibility, students.",
  },
  {
    icon: MessageSquare,
    accent: "rose" as const,
    title: "Community",
    description: "Forums etiquette, reporting, ambassadors program.",
  },
];

const FAQ = [
  {
    q: "How do I reset my password?",
    a: "Go to the sign-in page → \"Forgot password\" → enter your email. You'll receive a one-time link valid for 30 minutes. Set the new password and you'll be signed back in everywhere.",
  },
  {
    q: "How do I enroll in a course?",
    a: "Open the course detail page and tap \"Enroll\". Free courses unlock immediately; paid courses go through checkout. You can leave and resume any time — your progress is auto-saved.",
  },
  {
    q: "Why does the AI Tutor say I'm out of credit?",
    a: "Every plan includes a monthly AI quota. You can see your current usage on your dashboard. Upgrade your plan or wait until the next billing cycle for a fresh quota.",
  },
  {
    q: "Can I download course videos and books?",
    a: "No. Course videos and books open in our in-app protected viewer to respect instructor copyright. You can stream them as many times as you want while enrolled.",
  },
  {
    q: "How do refunds work?",
    a: "Each paid course lists its refund window (typically 14 days from purchase, provided you haven't completed the course). Use the \"Request refund\" button from your purchase history or email billing@vonova.app.",
  },
  {
    q: "How do I become an instructor?",
    a: "From your profile, switch on \"Instructor mode\". You'll get a course-builder, lesson editor, analytics, and a wallet for payouts. Read /site/instructors for the full overview.",
  },
  {
    q: "How do I delete my account?",
    a: "Settings → Privacy → \"Delete account\". You'll get a 14-day grace period to recover, then everything is anonymized. Billing records are kept where the law requires.",
  },
  {
    q: "Where do I report abuse or a bug?",
    a: "Use the form on /site/contact, or email security@vonova.app for security issues. We acknowledge every report within 48 hours.",
  },
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return FAQ;
    return FAQ.filter(
      (item) =>
        item.q.toLowerCase().includes(needle) ||
        item.a.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <Background>
      <MarketingHero
        badge="Support"
        eyebrow="Help Center"
        title="How can we help you learn?"
        description="Search the answers below or jump to one of the categories. If nothing fits, our team replies in under a business day."
        actions={[
          {
            label: "Contact support",
            href: "/site/contact",
            icon: LifeBuoy,
            variant: "default",
          },
        ]}
      />

      <MarketingSection>
        <div className="relative mx-auto max-w-2xl">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search 'reset password', 'refund', 'AI limit'…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 rounded-2xl bg-card pl-11 text-base shadow-sm"
          />
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Browse" title="Pick a category">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <MarketingFeatureCard
              key={c.title}
              icon={c.icon}
              accent={c.accent}
              title={c.title}
              description={c.description}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="Top questions"
        title={
          query.trim()
            ? `${filtered.length} answers matching "${query.trim()}"`
            : "Frequently asked"
        }
      >
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/60 p-10 text-center">
            <LifeBuoy className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">
              No matches — our team can help directly.
            </p>
            <p className="text-xs text-muted-foreground">
              Email{" "}
              <a
                className="underline"
                href="mailto:support@vonova.app"
              >
                support@vonova.app
              </a>{" "}
              or use the contact form.
            </p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-border/60 bg-card/70 px-4 shadow-sm backdrop-blur-sm sm:px-6"
          >
            {filtered.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-border/60"
              >
                <AccordionTrigger className="text-left text-sm font-medium sm:text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground sm:text-[15px]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </MarketingSection>
    </Background>
  );
}
