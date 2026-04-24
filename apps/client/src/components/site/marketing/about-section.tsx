import { Globe2, Rocket, Users } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">About</p>
          <h2 className="text-balance text-3xl font-semibold md:text-4xl">
            Vonova helps ambitious learners build real technical confidence
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            We are building a learning experience where students don&apos;t just consume content - they
            practice, iterate, and grow through guided systems designed for long-term mastery.
          </p>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The mission is simple: give every learner a platform that feels modern, clear, and powerful
            enough to support real career outcomes.
          </p>
        </div>

        <div className="grid gap-3">
          {[
            { icon: Rocket, title: "Mission-first", text: "Practical education with measurable progress." },
            { icon: Users, title: "Learner-centered", text: "Designed around student momentum and clarity." },
            { icon: Globe2, title: "Global quality", text: "Premium experience inspired by top SaaS products." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{item.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

