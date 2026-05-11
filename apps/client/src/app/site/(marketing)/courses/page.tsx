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
  Award,
  BookOpen,
  Code2,
  Cpu,
  Database,
  Globe,
  GraduationCap,
  Hammer,
  PenTool,
  PlayCircle,
  Server,
  Sparkles,
} from "lucide-react";

const TRACKS = [
  {
    icon: Code2,
    accent: "primary" as const,
    title: "Frontend Engineering",
    description:
      "React, Next.js, Tailwind, TypeScript, accessibility, performance. Ship production-grade UIs.",
    tag: "12 courses",
  },
  {
    icon: Server,
    accent: "violet" as const,
    title: "Backend & APIs",
    description:
      "Node.js, NestJS, REST + GraphQL, queues, caching, observability. Build systems that scale.",
    tag: "9 courses",
  },
  {
    icon: Database,
    accent: "sky" as const,
    title: "Data & Databases",
    description:
      "SQL, MongoDB, vector search, query plans, modeling. From CRUD to analytics.",
    tag: "6 courses",
  },
  {
    icon: Cpu,
    accent: "emerald" as const,
    title: "AI & ML for engineers",
    description:
      "RAG, embeddings, evaluation. Ship LLM features without the hype.",
    tag: "5 courses",
  },
  {
    icon: Hammer,
    accent: "amber" as const,
    title: "DevOps & Cloud",
    description:
      "Docker, CI/CD, AWS basics, monitoring, SRE fundamentals.",
    tag: "7 courses",
  },
  {
    icon: PenTool,
    accent: "rose" as const,
    title: "Product & UX for engineers",
    description:
      "Design systems, user research, writing better PRs and design docs.",
    tag: "4 courses",
  },
];

export default function CoursesOverviewPage() {
  return (
    <Background>
      <MarketingHero
        badge="Catalogue"
        eyebrow="Courses"
        title="Project-first courses. No fluff."
        description="Every Vonova course pairs a short, focused lesson with a real challenge, instant AI feedback, and a peer-review loop. You build the portfolio while you learn."
        actions={[
          {
            label: "Browse all tracks",
            href: "#tracks",
            icon: ArrowRight,
            variant: "default",
          },
        ]}
      />

      <MarketingSection>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MarketingStatCard label="Courses" value="50+" />
          <MarketingStatCard
            label="Hours of content"
            value="700+"
            accent="text-sky-600 dark:text-sky-400"
          />
          <MarketingStatCard
            label="Coding problems"
            value="1,200"
            accent="text-violet-600 dark:text-violet-400"
          />
          <MarketingStatCard
            label="Active learners"
            value="18k"
            accent="text-emerald-600 dark:text-emerald-400"
          />
        </div>
      </MarketingSection>

      <MarketingSection
        id="tracks"
        eyebrow="By track"
        title="Pick where you want to grow"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((t) => (
            <MarketingFeatureCard
              key={t.title}
              icon={t.icon}
              accent={t.accent}
              title={t.title}
              description={t.description}
              tag={t.tag}
            />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="What's in every course" title="The Vonova format">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MarketingFeatureCard
            icon={PlayCircle}
            accent="primary"
            title="Short-form lessons"
            description="Watch a 5–10 minute lesson, take a quiz, then ship a tiny challenge before moving on."
          />
          <MarketingFeatureCard
            icon={Sparkles}
            accent="violet"
            title="AI Tutor 24/7"
            description="Stuck on a step? Ask the AI tutor — it knows the course material and your progress."
          />
          <MarketingFeatureCard
            icon={Award}
            accent="emerald"
            title="Verifiable certificate"
            description="Finish the course and receive a signed PDF + a public verifiable URL for LinkedIn."
          />
        </div>
      </MarketingSection>

      <MarketingCTABand
        title="Browse the live catalogue."
        description="Sign up free to enroll. Most courses include a free preview lesson."
        actions={[
          {
            label: "Create free account",
            href: "/site/auth/register",
            icon: GraduationCap,
            variant: "default",
          },
          {
            label: "How instructors build courses",
            href: "/site/instructors",
            icon: BookOpen,
            variant: "outline",
          },
        ]}
      />
    </Background>
  );
}
