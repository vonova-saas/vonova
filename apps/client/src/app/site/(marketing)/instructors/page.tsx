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
  BarChart3,
  BookPlus,
  Cpu,
  DollarSign,
  Globe2,
  HeartHandshake,
  Library,
  Megaphone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: BookPlus,
    accent: "primary" as const,
    title: "Course builder",
    description:
      "Drag-and-drop chapters, lessons, quizzes, and coding problems. Reorder anything with a keystroke.",
  },
  {
    icon: Library,
    accent: "violet" as const,
    title: "Material Library",
    description:
      "Manage books, presentations, and visual guides centrally. Reuse them across courses with one click.",
  },
  {
    icon: ShieldCheck,
    accent: "amber" as const,
    title: "Protected viewer",
    description:
      "Videos and books open in a watermarked, no-download viewer. Your IP stays yours.",
  },
  {
    icon: Cpu,
    accent: "sky" as const,
    title: "AI feedback",
    description:
      "Vonova grades coding submissions and gives students hints — so you focus on teaching, not triage.",
  },
  {
    icon: BarChart3,
    accent: "emerald" as const,
    title: "Real analytics",
    description:
      "Per-student progress, drop-off heatmaps on lessons, quiz score breakdowns. Improve the course as it runs.",
  },
  {
    icon: DollarSign,
    accent: "rose" as const,
    title: "Wallet & payouts",
    description:
      "Track earnings, set prices in your currency, withdraw monthly. Transparent revenue share.",
  },
];

const STEPS = [
  {
    icon: BookPlus,
    title: "1. Outline",
    description:
      "Drop your chapters in. The course builder writes the structure for you.",
  },
  {
    icon: Sparkles,
    title: "2. Record & ship lessons",
    description:
      "Upload video, attach materials, write quizzes — all with AI-assisted drafting.",
  },
  {
    icon: Globe2,
    title: "3. Launch & earn",
    description:
      "Publish to 18k+ learners. Vonova handles payments, support, and infrastructure.",
  },
];

export default function InstructorsPage() {
  return (
    <Background>
      <MarketingHero
        badge="For instructors"
        eyebrow="Teach on Vonova"
        title="Teach what you wish someone had taught you."
        description="Vonova hands you a polished classroom — course builder, AI assist, watermarked viewer, real-time analytics, and instant payouts. You focus on the teaching."
        actions={[
          {
            label: "Apply to teach",
            href: "/site/contact?topic=instructor",
            icon: ArrowRight,
            variant: "default",
          },
          {
            label: "See the catalogue",
            href: "/site/courses",
            icon: Library,
            variant: "outline",
          },
        ]}
      />

      <MarketingSection>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MarketingStatCard
            label="Avg. payout share"
            value="70%"
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <MarketingStatCard
            label="Time to first lesson"
            value="< 1 hr"
            accent="text-sky-600 dark:text-sky-400"
          />
          <MarketingStatCard
            label="Active learners"
            value="18k"
            accent="text-violet-600 dark:text-violet-400"
          />
          <MarketingStatCard
            label="Countries"
            value="42"
            accent="text-amber-600 dark:text-amber-400"
          />
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Built for teaching" title="What you get out of the box">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <MarketingFeatureCard
              key={f.title}
              icon={f.icon}
              accent={f.accent}
              title={f.title}
              description={f.description}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Three steps" title="From idea to launch">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <MarketingFeatureCard
              key={s.title}
              icon={s.icon}
              title={s.title}
              description={s.description}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingCTABand
        title="Apply to teach on Vonova."
        description="We review every application personally. Tell us what you'd teach and why."
        actions={[
          {
            label: "Start application",
            href: "/site/contact?topic=instructor",
            icon: Megaphone,
            variant: "default",
          },
          {
            label: "Read instructor stories",
            href: "/site/blog",
            icon: HeartHandshake,
            variant: "outline",
          },
        ]}
      />
    </Background>
  );
}
