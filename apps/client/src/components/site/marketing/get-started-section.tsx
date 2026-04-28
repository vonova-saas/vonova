import { Button } from "@/components/ui/button";
import { ArrowRight, Gem } from "lucide-react";
import Link from "next/link";

export default function GetStarted() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border bg-card/70 px-6 py-12 md:px-10 md:py-20 backdrop-blur-sm">
          <div
            aria-hidden
            className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"
          />
          <div className="relative text-center">
            <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold lg:text-5xl">
              Ready to upgrade your learning experience?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
              Join Vonova today and turn your study routine into consistent,
              measurable progress.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="rounded-xl px-6">
                <Link href="/auth/register">
                  <Gem className="mr-2 size-4" />
                  <span className="text-nowrap">Register now</span>
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="rounded-xl px-6">
                <Link href="/site/auth/login">
                  <span>Sign in</span>
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}