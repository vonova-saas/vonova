"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Gem, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { TextEffect } from "@/components/global/motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/global/motion-primitives/animated-group";
import { Header } from "@/components/site/navigation/header";

import { BorderBeam } from "@/components/global/magicui/border-beam";

const MOTION = {
  micro: 0.4,
  section: 0.8,
  hero: 1.2,
  easeOutCubic: [0.22, 1, 0.36, 1] as const,
};

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration: MOTION.hero,
        ease: MOTION.easeOutCubic,
      },
    },
  },
} as const;

export default function HeroSection() {
  const heroRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-5%"]);
  const ctaY = useTransform(scrollYProgress, [0, 1], ["0%", "-2%"]);
  const ctaScale = useTransform(scrollYProgress, [0, 1], [1, 0.985]);

  return (
    <>
      <Header />
      <main ref={heroRef} className="overflow-hidden">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-60 will-change-transform"
          style={{
            y: bgY,
            background:
              "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.20), transparent 35%), radial-gradient(circle at 80% 30%, rgba(139,92,246,0.18), transparent 42%), radial-gradient(circle at 55% 85%, rgba(34,211,238,0.14), transparent 35%)",
          }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-6 -z-10 mx-auto h-72 w-72 rounded-full bg-primary/12 blur-3xl will-change-transform"
          style={{ y: bgY }}
        />
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
        >
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section className="relative overflow-hidden border-b bg-linear-to-br from-primary/12 via-background to-muted/30">
          <div className="relative pt-20 md:pt-28">
            <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"></div>
            <motion.div className="relative mx-auto max-w-5xl px-4 py-14 md:py-20 md:text-center will-change-transform" style={{ y: contentY }}>
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0 transform-[translateZ(0)]">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    href="/auth/register"
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-sm transition-all duration-400 dark:border-t-white/5"
                  >
                    <span className="text-foreground text-sm">
                      🚀 Built for ambitious CS learners
                    </span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedGroup>

                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mt-8 text-balance text-4xl font-bold tracking-tight md:text-5xl"
                >
                  Learn faster, practice deeper, and ship real skills with Vonova
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg"
                >
                  From guided roadmaps to hands-on problem solving, Vonova gives
                  students and instructors one professional platform to learn,
                  build portfolios, and stay consistent.
                </TextEffect>

                <motion.div style={{ y: ctaY, scale: ctaScale }} className="will-change-transform">
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.09,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    item: transitionVariants.item,
                  }}
                  className="mt-8 flex flex-wrap items-center justify-center gap-3"
                >
                  <div
                    key={1}
                    className="rounded-full"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full px-8 text-base transition-all duration-400 hover:scale-[1.02]"
                    >
                      <Link href="/auth/register">
                        <Gem className="mr-2 size-4" />
                        <span className="text-nowrap">Create free account</span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="ghost"
                    className="rounded-full border-primary/25 bg-background/60 px-8 transition-all duration-400 hover:scale-[1.02] hover:bg-background"
                  >
                    <Link href="#features">
                      <span className="text-nowrap">Explore platform</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
                </motion.div>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.1,
                          delayChildren: 1,
                        },
                      },
                    },
                    item: transitionVariants.item,
                  }}
                  className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 text-center sm:grid-cols-3 md:gap-6"
                >
                  {[
                    { icon: Sparkles, label: "AI Guidance", value: "24/7 personalized help" },
                    { icon: Users, label: "Community", value: "Peer-powered motivation" },
                    { icon: ShieldCheck, label: "Professional", value: "Structured learning path" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      className="rounded-2xl border border-border/60 bg-card/70 px-3 py-4 text-left shadow-sm backdrop-blur-sm md:py-5"
                      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                      initial={{ y: 0 }}
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 4 + index * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.2,
                      }}
                      whileHover={{ y: -8, scale: 1.02, rotateX: 3, rotateY: index % 2 === 0 ? -2 : 2 }}
                    >
                      <item.icon className="mb-2 h-4 w-4 text-primary" />
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                      <p className="text-sm">{item.value}</p>
                    </motion.div>
                  ))}
                </AnimatedGroup>
              </div>
            </motion.div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                item: transitionVariants.item,
              }}
            >
              <div className="relative mt-10 overflow-hidden px-2 sm:mt-12 md:mt-16">
                <div className="bg-background relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border/70 p-4 shadow-sm">
                  <Image
                    className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                    src="/images/vonova.png"
                    alt="Vonova dashboard preview"
                    width="2700"
                    height="1440"
                  />
                  <BorderBeam
                    duration={6}
                    size={200}
                    className="from-transparent via-yellow-700 to-transparent dark:via-white/50"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        {/* <section className="bg-background pb-16 pt-16 md:pb-32">
          <div className="group relative m-auto max-w-5xl px-6">
            <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
              <Link
                href="/"
                className="block text-sm duration-150 hover:opacity-75"
              >
                <span> Meet Our Customers</span>

                <ChevronRight className="ml-1 inline-block size-3" />
              </Link>
            </div>
            <div className="group-hover:blur-xs mx-auto mt-12 grid max-w-2xl grid-cols-4 gap-x-12 gap-y-8 transition-all duration-500 group-hover:opacity-50 sm:gap-x-16 sm:gap-y-14">
              <div className="flex">
                <img
                  className="mx-auto h-5 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/nvidia.svg"
                  alt="Nvidia Logo"
                  height="20"
                  width="auto"
                />
              </div>

              <div className="flex">
                <img
                  className="mx-auto h-4 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/column.svg"
                  alt="Column Logo"
                  height="16"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-4 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/github.svg"
                  alt="GitHub Logo"
                  height="16"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-5 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/nike.svg"
                  alt="Nike Logo"
                  height="20"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-5 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                  alt="Lemon Squeezy Logo"
                  height="20"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-4 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/laravel.svg"
                  alt="Laravel Logo"
                  height="16"
                  width="auto"
                />
              </div>
              <div className="flex">
                <img
                  className="mx-auto h-7 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/lilly.svg"
                  alt="Lilly Logo"
                  height="28"
                  width="auto"
                />
              </div>

              <div className="flex">
                <img
                  className="mx-auto h-6 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/openai.svg"
                  alt="OpenAI Logo"
                  height="24"
                  width="auto"
                />
              </div>
            </div>
          </div>
        </section> */}
      </main>
    </>
  );
}
