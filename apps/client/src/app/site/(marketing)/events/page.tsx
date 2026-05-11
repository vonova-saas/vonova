import Background from "@/components/global/background";
import {
  MarketingCTABand,
  MarketingHero,
  MarketingSection,
} from "@/components/site/marketing/page-shell";
import {
  ArrowRight,
  CalendarDays,
  Globe2,
  MapPin,
  Mic,
  Sparkles,
  Users,
} from "lucide-react";

const UPCOMING = [
  {
    date: "Thu, June 27 · 6 PM CET",
    title: "Live build: a streak-tracking dashboard with the Vonova API",
    location: "Online · YouTube + Discord",
    speaker: "Mohamed Aboliyazeed, Front-end Lead",
    tag: "Live build",
    accent: "from-sky-500/40 via-violet-500/30 to-fuchsia-500/30",
  },
  {
    date: "Sat, July 13 · 11 AM EET",
    title: "AMA: building learning platforms for the next billion",
    location: "Online · Discord stage",
    speaker: "Founders & engineering team",
    tag: "AMA",
    accent: "from-emerald-500/40 via-teal-500/30 to-sky-500/30",
  },
  {
    date: "Wed, August 7 · 5 PM EET",
    title: "Workshop: writing AI-tutorable lesson content",
    location: "Online · limited seats",
    speaker: "Instructor success team",
    tag: "Workshop",
    accent: "from-rose-500/40 via-orange-500/30 to-amber-500/30",
  },
];

const PAST = [
  { date: "May 18", title: "Office hours: shipping your first course" },
  { date: "April 22", title: "Behind the scenes: protected viewer launch" },
  { date: "March 30", title: "AI tutors that actually help" },
];

export default function EventsPage() {
  return (
    <Background>
      <MarketingHero
        badge="Live"
        eyebrow="Events"
        title="Workshops, AMAs, and live builds — every week."
        description="Most events are free and online. Show up to learn out loud, ask questions, and meet other Vonova learners."
        actions={[
          {
            label: "Subscribe to event reminders",
            href: "/site/contact?topic=events",
            icon: ArrowRight,
            variant: "default",
          },
        ]}
      />

      <MarketingSection eyebrow="Coming up" title="Next 3 events">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {UPCOMING.map((e) => (
            <article
              key={e.title}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                aria-hidden
                className={`h-1.5 w-full bg-linear-to-r ${e.accent}`}
              />
              <div className="flex flex-1 flex-col p-5">
                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" />
                  {e.tag}
                </span>
                <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {e.date}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{e.title}</h3>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {e.location}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Mic className="h-3.5 w-3.5" />
                  {e.speaker}
                </p>
                <a
                  href="/site/contact?topic=events"
                  className="mt-5 inline-flex items-center gap-1 self-start rounded-full bg-linear-to-r from-primary to-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg"
                >
                  RSVP
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection eyebrow="Replays" title="Past events you can still watch">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-sm">
          <ul className="divide-y divide-border/60">
            {PAST.map((p) => (
              <li
                key={p.title}
                className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Globe2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Watched by 1.2k learners
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{p.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </MarketingSection>

      <MarketingCTABand
        title="Want to speak at a Vonova event?"
        description="We host short-form talks (≤ 20 min) from instructors, alumni, and the wider community. Pitch us a topic and we'll book a stage."
        actions={[
          {
            label: "Submit a talk",
            href: "/site/contact?topic=speaker",
            icon: Users,
            variant: "default",
          },
        ]}
      />
    </Background>
  );
}
