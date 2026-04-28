"use client";

import Image from "next/image";
import { FileText, Code2, GraduationCap, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function ContentSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl space-y-8 px-6 text-center md:space-y-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Why learners choose Vonova
        </p>
        <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold lg:text-5xl">
          Everything you need to stay consistent, focused, and career-ready
        </h2>
        <p className="mx-auto max-w-3xl text-pretty text-muted-foreground">
          Vonova combines structured LMS learning, AI assistance, and collaborative
          community tools to keep students moving from theory to real output.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: GraduationCap,
            title: "Structured Courses",
            text: "Clear learning paths with practical milestones.",
          },
          {
            icon: FileText,
            title: "Pdf Summarizer",
            text: "Get instant summaries and insights from your PDFs.",
          },
          {
            icon: Code2,
            title: "Problem Solving",
            text: "Practice with guided challenges and feedback.",
          },
          {
            icon: Trophy,
            title: "Progress Visibility",
            text: "Track effort, momentum, and learning outcomes.",
          },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            className="rounded-2xl border bg-card p-5 text-left shadow-sm"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(0,0,0,0.18)" }}
          >
            <item.icon className="mb-3 h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mx-auto mt-14 grid max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:items-center"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55 }}
      >
        <motion.div className="rounded-2xl border bg-card/50 p-4" whileHover={{ scale: 1.01 }}>
          <Image
            src="/images/Dashboard2.png"
            className="w-full rounded-xl border"
            alt="Vonova features preview"
            width={1207}
            height={929}
          />
        </motion.div>
        <div className="space-y-5">
          <h3 className="text-3xl font-semibold">Built like a real growth system, not just another LMS</h3>
          <p className="text-muted-foreground">
            Students can learn with curated content, apply what they learn in
            problem solving, and share progress in the community - all in one
            experience designed for long-term retention.
          </p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• Personalized guidance for each learning stage.</p>
            <p>• Modern, distraction-free interface for daily use.</p>
            <p>• Strong support for both students and instructors.</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
