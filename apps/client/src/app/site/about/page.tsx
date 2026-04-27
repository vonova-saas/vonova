import { Header } from "@/components/site/navigation/header";
import FooterSection from "@/components/site/navigation/footer-section";
import AboutSection from "@/components/site/marketing/about-section";
// import TeamSection from "@/components/site/marketing/team-section";

// export const teamMembers = [
//   {
//     id: "01",
//     name: "Ahmed Badawi",
//     role: "Full Stack Engineer",
//     bio: "Builds scalable web apps from backend logic to pixel-perfect UI.",
//     initials: "AB",
//     image: "/avatars/Badawi.jpg",
//     skills: [
//       "Node.js", "NestJS", "React", "Next.js",
//       "MongoDB", "REST APIs", "Microservices",
//       "Docker", "Git", "System Design"
//     ],
//     social: {
//       github: "https://github.com/ahmedbadawihosny",
//       linkedin: "https://linkedin.com/in/ahmedbadawihosny",
//     },
//     theme: "from-blue-500 to-purple-500",
//     status: "active",
//   },

//   {
//     id: "02",
//     name: "Shahd Ali",
//     role: "Frontend Developer",
//     bio: "Passionate about crafting beautiful and responsive user interfaces.",
//     initials: "SA",
//     image: "/avatars/Girl Image.png",
//     skills: [
//       "React", "Next.js", "Tailwind CSS",
//       "JavaScript", "TypeScript",
//       "Responsive Design", "UI Animation",
//       "Git", "Figma"
//     ],
//     social: {
//       github: "https://github.com/ShahdALI04",
//       linkedin: "https://www.linkedin.com/in/shahd-ali-154069285/",
//     },
//     theme: "from-pink-500 to-rose-500",
//     status: "active",
//   },

//   {
//     id: "03",
//     name: "Moataz Rashwan",
//     role: "AI Engineer",
//     bio: "Designs intelligent systems and integrates AI into real-world apps.",
//     initials: "MR",
//     image: "/avatars/Moataz Rashwan.webp",
//     skills: [
//       "Python", "Machine Learning", "Deep Learning",
//       "TensorFlow", "PyTorch",
//       "Data Analysis", "Pandas", "NumPy",
//       "Model Deployment"
//     ],
//     social: {
//       github: "https://github.com/Moataz899",
//       linkedin: "https://www.linkedin.com/in/moataz-abdelraouf",
//     },
//     theme: "from-green-500 to-emerald-500",
//     status: "active",
//   },

//   {
//     id: "04",
//     name: "Esraa Naji",
//     role: "AI Engineer",
//     bio: "Builds intelligent models and integrates AI solutions into real-world applications.",
//     initials: "EN",
//     image: "/avatars/Girl Image.png",
//     skills: [
//       "Python", "Machine Learning",
//       "NLP", "TensorFlow", "PyTorch",
//       "Data Preprocessing"
//     ],
//     social: {
//       github: "https://github.com/EssraaNaji",
//       linkedin: "https://www.linkedin.com/in/essraa-n-008264264/",
//     },
//     theme: "from-yellow-400 to-orange-500",
//     status: "active",
//   },

//   {
//     id: "05",
//     name: "Andro Refaat",
//     role: "Backend Developer",
//     bio: "Handles APIs, databases, and system architecture.",
//     initials: "AR",
//     image: "/avatars/FB_IMG_1741754283883 - Andro Refaat.jpg",
//     skills: [
//       "Node.js", "Express", "MongoDB",
//       "REST APIs", "Authentication",
//       "Microservices", "Docker",
//       "Git", "Postman"
//     ],
//     social: {
//       github: "https://github.com/AndroRefaat",
//       linkedin: "https://www.linkedin.com/in/andro-refaat-a80081253/",
//     },
//     theme: "from-indigo-500 to-blue-500",
//     status: "active",
//   },

//   {
//     id: "06",
//     name: "Abdallah Makram",
//     role: "Backend Developer",
//     bio: "Specialized in building reliable and high-performance services.",
//     initials: "AM",
//     image: "/avatars/Abdallah Makram.png",
//     skills: [
//       "NestJS", "Node.js", "MongoDB", "REST APIs",
//       "System Design", "Docker"
//     ],
//     social: {
//       github: "https://github.com/Abdallah-Makram",
//       linkedin: "https://www.linkedin.com/in/abdallah-makram-ab337a249/",
//     },
//     theme: "from-gray-700 to-gray-900",
//     status: "active",
//   },

//   {
//     id: "07",
//     name: "Ibrahim Mohamed",
//     role: "UI/UX Designer",
//     bio: "Designs intuitive interfaces and seamless user journeys.",
//     initials: "IM",
//     image: "/avatars/photo_2025-09-25_19-20-46.jpg",
//     skills: [
//       "Figma", "UI Design", "UX Research",
//       "Wireframing", "Prototyping",
//       "User Flows", "Design Systems",
//       "Usability Testing"
//     ],
//     social: {
//       github: "https://github.com/ibrahimmohamed77",
//       linkedin: "https://www.linkedin.com/in/ibrahim-mohamed-radi-867632271/",
//     },
//     theme: "from-cyan-500 to-blue-400",
//     status: "active",
//   },

//   {
//     id: "08",
//     name: "Mohamed Abolyazeed",
//     role: "Backend Developer",
//     bio: "Focuses on system performance, APIs, and clean architecture.",
//     initials: "MA",
//     image: "/avatars/photo_2026-02-15_05-48-16.jpg",
//     skills: [
//       "Node.js", "NestJS", "MongoDB", "PostgreSQL",
//       "Microservices", "Docker", "Redis","Caching",
//       "System Design", "REST APIs",
//       "Authentication", "Security",
//     ],
//     social: {
//       github: "https://github.com/mohamedabolyazeed",
//       linkedin: "https://www.linkedin.com/in/mohamed-abolyazeed-hashem-139ba0358/",
//     },
//     theme: "from-purple-600 to-indigo-600",
//     status: "active",
//   },
// ];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
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
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">About Vonova</h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
              Meet the mission, people, and story behind the platform.
            </p>
          </div>
        </section>

        {/* <TeamSection members={teamMembers} /> */}

        <AboutSection />
      </main>
      <FooterSection />
    </div>
  );
}

