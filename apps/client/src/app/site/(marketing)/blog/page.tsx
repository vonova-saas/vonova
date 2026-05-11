import Background from "@/components/global/background";
import {
  MarketingFeatureCard,
  MarketingHero,
  MarketingSection,
} from "@/components/site/marketing/page-shell";
import {
  ArrowRight,
  BookMarked,
  Clock,
  GraduationCap,
  Lightbulb,
  Mail,
  Rocket,
  Sparkles,
} from "lucide-react";

const FEATURED = [
  {
    tag: "Product",
    accent: "primary" as const,
    icon: Rocket,
    title: "Inside Vonova's protected viewer",
    description:
      "Why we replaced 'open in new tab' with a watermarked in-app viewer, and what it means for instructor IP and student trust.",
    readTime: "6 min read",
  },
  {
    tag: "Learning",
    accent: "violet" as const,
    icon: Lightbulb,
    title: "Spaced repetition for engineering interviews",
    description:
      "A practical look at how Vonova's review prompts compress weeks of cramming into 20 minutes a day.",
    readTime: "8 min read",
  },
  {
    tag: "AI",
    accent: "sky" as const,
    icon: Sparkles,
    title: "Designing AI tutors that don't hallucinate",
    description:
      "The five guardrails our AI Tutor follows so it explains course material instead of inventing it.",
    readTime: "5 min read",
  },
];

const TAGS = [
  "Product",
  "Learning",
  "AI",
  "Instructors",
  "Career",
  "Open-source",
];

export default function BlogPage() {
  return (
    <Background>
      <MarketingHero
        badge="Stories"
        eyebrow="Blog"
        title="Notes from the team building Vonova."
        description="Product changelogs, learning research, AI experiments, and the occasional behind-the-scenes engineering deep dive."
        actions={[
          {
            label: "Get articles by email",
            href: "#newsletter",
            icon: Mail,
            variant: "default",
          },
        ]}
      />

      <MarketingSection eyebrow="This week" title="Featured posts">
        <div className="mb-6 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              #{t}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURED.map((post) => (
            <article
              key={post.title}
              className="group relative flex h-full flex-col rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <post.icon className="h-3 w-3" />
                {post.tag}
              </span>
              <BookMarked className="mb-4 h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {post.description}
              </p>
              <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </span>
                <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Read
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        eyebrow="What you'll find here"
        title="Three streams, one feed"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MarketingFeatureCard
            icon={Rocket}
            accent="primary"
            title="Product"
            description="Release notes, feature deep dives, and roadmap updates straight from the team."
          />
          <MarketingFeatureCard
            icon={GraduationCap}
            accent="violet"
            title="Learning"
            description="Research-backed essays on how to learn faster — applied to real Vonova courses."
          />
          <MarketingFeatureCard
            icon={Sparkles}
            accent="sky"
            title="AI"
            description="How we build, prompt, and evaluate the AI features behind PDF Summary and the AI Tutor."
          />
        </div>
      </MarketingSection>

      <MarketingSection id="newsletter" eyebrow="Subscribe">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-8 text-center shadow-sm backdrop-blur-sm sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            One email a month. Zero spam.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            A short digest of the best posts, plus the next-month roadmap.
          </p>
          <form
            className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
            method="get"
            action="#"
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="h-11 flex-1 rounded-xl border bg-background px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              className="h-11 rounded-xl bg-linear-to-r from-primary to-primary/90 px-5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:from-primary/90 hover:to-primary hover:shadow-xl"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-3 text-[11px] text-muted-foreground">
            By subscribing you agree to our{" "}
            <a className="underline" href="/site/privacy">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </MarketingSection>
    </Background>
  );
}
