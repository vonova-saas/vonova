// "use client";

// import { Button } from "@/components/ui/button";
// import { Github, Linkedin } from "lucide-react";
// import { motion } from "framer-motion";

// type TeamMember = {
//   id: string;
//   name: string;
//   role: string;
//   bio: string;
//   image: string;
//   skills?: string[];
//   social?: {
//     github?: string;
//     linkedin?: string;
//   };
// };

// type TeamSectionProps = {
//   members: TeamMember[];
// };

// const containerVariants = {
//   hidden: {},
//   visible: {
//     transition: {
//       staggerChildren: 0.08,
//       delayChildren: 0.1,
//     },
//   },
// };

// const cardVariants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: {
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.4, ease: "easeOut" as const },
//   },
// };

// export default function TeamSection({ members }: TeamSectionProps) {
//   return (
//     <section className="relative overflow-hidden py-12 md:py-16">
//       <div
//         aria-hidden
//         className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
//       />
//       <div
//         aria-hidden
//         className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl"
//       />

//       <div className="relative mx-auto max-w-6xl px-4">
//         <div className="mb-8 text-center md:mb-10">
//           <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary/90">Our Team</p>
//           <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">The team building Vonova</h2>
//           <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
//             Meet the people designing, engineering, and scaling the platform.
//           </p>
//         </div>

//         <motion.div
//           className="grid grid-cols-1 gap-5 md:grid-cols-3"
//           variants={containerVariants}
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true, amount: 0.2 }}
//         >
//           {members.map((member, index) => (
//             <motion.article
//               key={member.id}
//               variants={cardVariants}
//               className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-sm ${
//                 index === 1 ? "md:-mt-4" : index === 2 ? "md:mt-3" : ""
//               }`}
//               whileHover={{ y: -6 }}
//               transition={{ duration: 0.25 }}
//             >
//               <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
//                 <div className="absolute inset-0 rounded-2xl border border-primary/25" />
//               </div>

//               <div className="relative p-3">
//                 <div className="relative h-72 overflow-hidden rounded-xl border border-border/60 bg-muted/20">
//                   <img
//                     src={member.image}
//                     alt={member.name}
//                     className="h-full w-full scale-105 object-cover object-top transition-transform duration-500 group-hover:scale-110"
//                     loading="lazy"
//                     referrerPolicy="no-referrer"
//                   />
//                   <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/20 to-black/0 opacity-90" />
//                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.22)_100%)]" />
//                   <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/28 to-transparent" />

//                   <div
//                     className="absolute left-3 top-3 text-5xl font-bold leading-none text-white/15"
//                   >
//                     {member.id}
//                   </div>

//                   <div className="absolute right-3 top-3 flex translate-y-2 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
//                     {member.social?.linkedin && (
//                       <a
//                         href={member.social.linkedin}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         aria-label={`${member.name} LinkedIn`}
//                         className="rounded-full border border-white/20 bg-black/40 p-1.5 text-white/90 backdrop-blur hover:bg-black/60 hover:scale-110 transition-transform"
//                       >
//                         <Linkedin className="h-4 w-4" />
//                       </a>
//                     )}
//                     {member.social?.github && (
//                       <a
//                         href={member.social.github}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         aria-label={`${member.name} GitHub`}
//                         className="rounded-full border border-white/20 bg-black/40 p-1.5 text-white/90 backdrop-blur hover:bg-black/60 hover:scale-110 transition-transform"
//                       >
//                         <Github className="h-4 w-4" />
//                       </a>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="relative px-5 pb-5 pt-2">
//                 <h3 className="text-xl font-semibold tracking-tight">{member.name}</h3>
//                 <p className="mt-1 inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
//                   {member.role}
//                 </p>
//                 <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
//                   {member.bio}
//                 </p>
//                 {member.skills && member.skills.length > 0 && (
//                   <div className="mt-3 flex flex-wrap gap-1.5">
//                     {member.skills.map((skill) => (
//                       <span
//                         key={skill}
//                         className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
//                       >
//                         {skill}
//                       </span>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </motion.article>
//           ))}
//         </motion.div>

//         <div className="mt-10 flex justify-center">
//           <Button className="rounded-full px-8 transition-all duration-300 hover:scale-[1.02]">
//             Meet the Team
//           </Button>
//         </div>
//       </div>
//     </section>
//   );
// }

