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
  BarChart3,
  BookOpen,
  Cpu,
  GraduationCap,
  Library,
  ListChecks,
  PlayCircle,
  Puzzle,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: PlayCircle,
    accent: "primary" as const,
    title: "Bite-sized lessons",
    description:
      "Most lessons are under 10 minutes. Watch, take a quiz, ship a tiny challenge, move on.",
  },
  {
    icon: Sparkles,
    accent: "violet" as const,
    title: "AI Tutor 24/7",
    description:
      "Stuck on a step? Ask the AI tutor — it knows your course, your code, and your progress.",
  },
  {
    icon: Puzzle,
    accent: "sky" as const,
    title: "Coding problems",
    description:
      "Run, test, and submit code inside the browser. Instant feedback + peer solutions.",
  },
  {
    icon: ListChecks,
    accent: "emerald" as const,
    title: "Progress that respects your time",
    description:
      "Auto-saved progress, resume-from-last-lesson, and weekly streak reminders.",
  },
  {
    icon: BarChart3,
    accent: "amber" as const,
    title: "Personal dashboard",
    description:
      "See what you've learned, how you're trending, and what to do next.",
  },
  {
    icon: Award,
    accent: "rose" as const,
    title: "Verifiable certificates",
    description:
      "Finish a course and get a signed PDF + a public verification URL for LinkedIn.",
  },
];

const STEPS = [
  {
    icon: GraduationCap,
    title: "1. Create your free account",
    description: "Email + a strong password. No card required.",
  },
  {
    icon: BookOpen,
    title: "2. Enroll in your first course",
    description:
      "Browse the catalogue, pick a track, preview the first lesson for free.",
  },
  {
    icon: Timer,
    title: "3. Learn 20 min a day",
    description:
      "Vonova is designed for the daily commute. Small, consistent, compounding.",
  },
];

export default function StudentsPage() {
  return (
    <Background>
      <MarketingHero
        badge="For students"
        eyebrow="Learn on Vonova"
        title="Learn engineering by building, not by watching."
        description="Vonova turns every lesson into a small project. By the end of the course, you have a portfolio — not a stack of bookmarks."
        actions={[
          {
            label: "Create free account",
            href: "/site/auth/register",
            icon: GraduationCap,
            variant: "default",
          },
          {
            label: "Browse courses",
            href: "/site/courses",
            icon: Library,
            variant: "outline",
          },
        ]}
      />

      <MarketingSection>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MarketingStatCard label="Active learners" value="18k" />
          <MarketingStatCard
            label="Lessons completed"
            value="1.2M"
            accent="text-sky-600 dark:text-sky-400"
          />
          <MarketingStatCard
            label="Avg. session"
            value="22 min"
            accent="text-violet-600 dark:text-violet-400"
          />
          <MarketingStatCard
            label="Course finish rate"
            value="61%"
            accent="text-emerald-600 dark:text-emerald-400"
          />
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="What's inside" title="Tools that meet you where you are">
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

      <MarketingSection eyebrow="Three steps" title="Get started in under 5 minutes">
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
        title="The next 20 minutes can change the next 20 months."
        description="Sign up free, preview the first lesson, decide if Vonova is for you. No card required."
        actions={[
          {
            label: "Sign up free",
            href: "/site/auth/register",
            icon: GraduationCap,
            variant: "default",
          },
          {
            label: "Talk to a learner",
            href: "/site/contact",
            icon: Users,
            variant: "outline",
          },
        ]}
      />
    </Background>
  );
}
