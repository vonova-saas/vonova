import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";

export default function PricingSection() {
  return (
    <section id="pricing" className="pricing py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl space-y-4 text-center md:space-y-6">
          <h1 className="text-center text-balance text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            Pricing that Scales with You
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
            Choose the plan that matches your stage. Start free, then scale as
            your learning needs, team size, and platform usage grow.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:mt-10 md:mt-14 md:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          <Card className="flex h-full flex-col rounded-2xl border-border/60 bg-card/70 shadow-sm">
            <CardHeader>
              <CardTitle className="font-medium">Free</CardTitle>
              <span className="my-3 block text-2xl font-semibold">$0 / mo</span>
              <CardDescription className="text-sm">Per learner</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <hr className="border-dashed" />

              <ul className="list-outside space-y-2.5 text-sm md:space-y-3">
                {[
                  "Access to core LMS courses",
                  "Basic quizzes and attempts",
                  "Community feed access",
                  "Material library access",
                  "AI roadmap generator (1 roadmap)",
                  "PDF summary tool (1 file upload)",
                  "Problem-solving workspace",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="mt-auto">
              <Button asChild variant="outline" className="w-full rounded-lg">
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="relative flex h-full flex-col rounded-2xl border-border/60 bg-card/70 shadow-sm">
            <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">
              Popular
            </span>

            <div className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="font-medium">Pro</CardTitle>
                <span className="my-3 block text-2xl font-semibold">
                  $19 / mo
                </span>
                <CardDescription className="text-sm">
                  Per learner
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <hr className="border-dashed" />
                <ul className="list-outside space-y-2.5 text-sm md:space-y-3">
                  {[
                    "Everything in Free Plan",
                    "AI roadmap generator (multiple roadmaps)",
                    "PDF summary tool (multiple files)",
                    "Advanced quizzes and detailed results",
                    "Priority support",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="size-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto">
                <Button asChild className="w-full rounded-lg">
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </CardFooter>
            </div>
          </Card>

          <Card className="flex h-full flex-col rounded-2xl border-border/60 bg-card/70 shadow-sm">
            <CardHeader>
              <CardTitle className="font-medium">Startup</CardTitle>
              <span className="my-3 block text-2xl font-semibold">
                $29 / mo
              </span>
              <CardDescription className="text-sm">Per team seat</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <hr className="border-dashed" />

              <ul className="list-outside space-y-2.5 text-sm md:space-y-3">
                {[
                  "Everything in Pro Plan",
                  "Instructor dashboard and analytics",
                  "Course management tools",
                  "Quiz management tools",
                  "Problem-solving management",
                  "Material library management",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="size-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="mt-auto">
              <Button asChild variant="outline" className="w-full rounded-lg">
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
