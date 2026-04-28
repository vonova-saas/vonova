"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Code2,
  ClipboardList,
  Users,
  FileText,
  Map,
} from "lucide-react";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BorderBeam } from "@/components/global/magicui/border-beam";

export default function AIFeaturesSection() {
  type ImageKey = "item-1" | "item-2" | "item-3" | "item-4" | "item-5";

  const [activeItem, setActiveItem] = useState<ImageKey>("item-1");

  const images = {
    "item-1": {
      image: "/images/Problem-Solving-Management.png",
      alt: "Problem Solving Management UI",
    },
    "item-2": {
      image: "/images/Quiz-Management.png",
      alt: "Quiz Management UI",
    },
    "item-3": {
      image: "/images/Community.png",
      alt: "Community Feature UI",
    },
    "item-4": {
      image: "/images/PDF-Summary.png",
      alt: "PDF Summary Feature UI",
    },
    "item-5": {
      image: "/images/AI-Roadmap-Generator.png",
      alt: "AI Roadmap Generator UI",
    },
  };

  return (
    <section id="features" className="py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 space-y-12">
        {/* HEADER */}
        <motion.div
          className="text-center max-w-2xl mx-auto space-y-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-semibold">
            The AI Advantage for Learning Platforms
          </h2>
          <p className="text-muted-foreground">
            Powerful AI tools to create content, manage assessments, and track
            student progress — all in one place.
          </p>
        </motion.div>

        {/* CONTENT */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* ACCORDION */}
          <Accordion
            type="single"
            value={activeItem}
            onValueChange={(value) => setActiveItem(value as ImageKey)}
            className="w-full space-y-2"
          >
            {[
              {
                value: "item-1",
                icon: Code2,
                title: "Problem Solving Management",
                desc: "Create, manage, and organize coding problems with real-time evaluation.",
              },
              {
                value: "item-2",
                icon: ClipboardList,
                title: "Quiz Management",
                desc: "Build quizzes instantly with AI assistance and track performance.",
              },
              {
                value: "item-3",
                icon: Users,
                title: "Community & Collaboration",
                desc: "Enable discussions and peer interaction for better learning.",
              },
              {
                value: "item-4",
                icon: FileText,
                title: "PDF Summary Generator",
                desc: "Automatically generate concise summaries from documents.",
              },
              {
                value: "item-5",
                icon: Map,
                title: "AI Roadmap Generator",
                desc: "Create personalized learning paths based on goals.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.value}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <AccordionItem
                  value={item.value}
                  className="rounded-xl border border-white/10 px-4 transition-all hover:bg-white/5"
                >
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-primary" />
                      {item.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.desc}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          {/* IMAGE */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.35 }}
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur-xl"
              >
                <div className="flex justify-center items-center">
                  <Image
                    src={images[activeItem].image}
                    alt={images[activeItem].alt}
                    width={1000}
                    height={700}
                    className="max-h-[500px] w-auto object-contain rounded-lg border border-white/20"
                    priority
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            <BorderBeam
              duration={6}
              size={250}
              className="from-transparent via-orange-500/40 to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  );
}