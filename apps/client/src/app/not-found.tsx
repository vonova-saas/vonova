"use client";

import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-2">Page Not Found</h2>
      <p className="mb-6">
        Sorry, the page you are looking for does not exist.
      </p>
      <div
        key={1}
        className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
      >
        <Button asChild size="lg" className="rounded-xl px-5 text-base">
          <Link href="/">
            <Home className="mr-2 size-4" />
            <span className="text-nowrap">Go Home</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
