"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ImageIcon, Presentation, Library, CheckCircle2, HelpCircle, Sparkles, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import useStudentId from "@/hooks/student/use-student-id";

export default function MaterialLibrary() {
  const studentId = useStudentId();

  const fakeUser = {
    name: "Badawi",
    exploredSections: 1, // For demo
    totalSections: 3,
  };

  const sections = [
    {
      title: "Online Books",
      description:
        "Browse and read free computer science books directly in Vonova.",
      icon: Book,
      link: `/${studentId}/material-library/online-books`,
      button: "Explore Books",
      completed: true, // For demo
    },
    {
      title: "Visual Guides",
      description:
        "Quick visual guides and cheatsheets for fast learning.",
      icon: ImageIcon,
      link: `/${studentId}/material-library/visual-guides`,
      button: "View Guides",
      badge: "New",
    },
    {
      title: "Presentation Material",
      description:
        "Presentations created by instructors for your courses.",
      icon: Presentation,
      link: `/${studentId}/material-library/presentation-material`,
      button: "See Presentations",
    },
  ];

  // Fake stats for summary card
  const totalSections = sections.length;
  const totalMaterials = 24; // Example fake stat
  const totalTopics = 8; // Example fake stat
  const exploredSections = fakeUser.exploredSections;
  const progressPercent = Math.round((exploredSections / totalSections) * 100);

  return (
    <div className="min-h-full w-full pb-16">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center">
          <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Student hub
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">Material Library</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Access books, guides, and presentations to boost your computer science journey.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-primary/25 bg-background/60 backdrop-blur"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 text-center md:gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalSections}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Sections
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalTopics}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Topics
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 shadow-sm backdrop-blur-sm md:py-5">
              <div className="text-2xl font-semibold tabular-nums md:text-3xl">{totalMaterials}+</div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
                Materials
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10 flex flex-col items-center">
      {/* Summary Card with Help Button */}
      <Card className="w-full max-w-5xl mb-6 shadow-lg border-2 backdrop-blur-sm relative">
        {/* Help Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-20"
              aria-label="Need help?"
            >
              <HelpCircle className="w-6 h-6 text-primary" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>How to use the Material Library</DialogTitle>
              <DialogDescription asChild>
                <div>
                  <ul className="list-disc pl-5 space-y-2 mt-2 text-base">
                    <li>
                      <b>Browse Sections:</b> Choose from Online Books, Visual Guides, or Presentation Material.
                    </li>
                    <li>
                      <b>Explore Resources:</b> Click on a section to view and use the materials inside.
                    </li>
                    <li>
                      <b>Track Progress:</b> Your progress is shown at the top. Complete sections to boost your learning!
                    </li>
                    <li>
                      <b>Need more help?</b> Contact support or check the FAQ in the dashboard menu.
                    </li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button variant="outline" className="mt-4 w-full">Close</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
        <CardContent className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Icon and Main Stat */}
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary rounded-full p-4 flex items-center justify-center shadow-sm">
              <Library className="w-8 h-8" aria-hidden="true" focusable="false" />
            </div>
            <div className="min-w-[220px] md:min-w-[300px] w-full">
              {/* Personalized Greeting */}
              <div className="text-lg font-semibold text-primary mb-1">
                Welcome back, {fakeUser.name} 😃
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-primary drop-shadow-sm">
                  {totalSections}
                </span>
                <span className="text-base font-medium text-muted-foreground mb-1">
                  Sections
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                  {totalTopics} Topics
                </span>
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/10">
                  {totalMaterials}+ Materials
                </span>
              </div>
              {/* Progress Bar */}
              <div className="mt-4 w-full max-w-xs">
                <div className="flex justify-between mb-1 text-xs font-medium text-muted-foreground">
                  <span>Progress</span>
                  <span>
                    {exploredSections}/{totalSections} sections
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <span className="sr-only">Progress: {progressPercent}%</span>
              </div>
            </div>
          </div>
          {/* Motivational Message */}
          <div className="flex-1 text-center md:text-right flex flex-col justify-center">
            <span className="text-lg font-semibold text-primary">
              Empower your learning!
            </span>
            <span className="text-muted-foreground text-sm mt-1">
              Access books, guides, and presentations to boost your computer
              science journey.
            </span>
          </div>
        </CardContent>
      </Card>
      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title}>
              <Card className="h-full flex flex-col justify-between shadow-md border hover:shadow-xl group relative">
                {/* Badge */}
                {section.badge && (
                  <span className="absolute top-4 right-4 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md animate-pulse">
                    {section.badge}
                  </span>
                )}
                {/* Completed Badge */}
                {section.completed && (
                  <span className="absolute top-4 left-4 z-10 bg-primary text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" focusable="false" /> Completed
                  </span>
                )}
                <CardHeader className="flex flex-col items-center gap-2">
                  <Icon className="w-10 h-10 text-primary" aria-hidden="true" focusable="false" />
                  <CardTitle className="text-xl text-center">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 flex-1">
                  <p className="text-center text-muted-foreground mb-4">
                    {section.description}
                  </p>
                  <Button asChild>
                    <Link href={section.link}>{section.button}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
