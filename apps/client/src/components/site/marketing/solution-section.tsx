import { BadgeCheck, Cpu, Layers3, Sparkles } from "lucide-react";

const pillars = [
  {
    icon: Layers3,
    title: "Unified Learning Stack",
    text: "Courses, problem solving, AI guidance, and community live in one flow so learners stay focused.",
  },
  {
    icon: Cpu,
    title: "AI-Native Workflow",
    text: "Smart assistants help explain concepts, review progress, and suggest next steps at the right time.",
  },
  {
    icon: BadgeCheck,
    title: "Outcome-Driven Progress",
    text: "Clear checkpoints and practical tasks keep students moving from knowledge to real execution.",
  },
];

export default function SolutionSection() {
  return (
    <section id="solution" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-8 shadow-sm backdrop-blur-sm md:p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Solution</p>
          <h2 className="max-w-3xl text-balance text-3xl font-semibold md:text-4xl">
            A modern platform for students who want to learn like builders
          </h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Vonova is designed to remove friction between learning and doing. Learners get structure,
            momentum, and guidance in one professional experience.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pillars.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/60 bg-background/60 p-5">
                <item.icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 inline-flex items-center rounded-full border border-primary/25 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            Built for consistent growth, not one-time motivation.
          </div>
        </div>
      </div>
    </section>
  );
}

