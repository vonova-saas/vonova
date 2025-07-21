import { Book } from "./types";

export const topics = ["All", "Programming", "Web", "Mobile", "CS"];

export const fakeBooks: Book[] = [
  {
    id: "clean-code",
    title: "Clean Code",
    authors: [
      { name: "Robert C. Martin", avatar: "/images/avatars/avatar5.avif" },
    ],
    cover: "/images/placeholder.svg",
    description:
      "A handbook of agile software craftsmanship and best coding practices.",
    topic: "Programming",
    badge: "New",
    rating: 5,
    difficulty: "Intermediate",
  },
  {
    id: "design-patterns",
    title: "Design Patterns: Elements of Reusable Object-Oriented Software",
    authors: [
      { name: "Erich Gamma", avatar: "/images/avatars/avatar5.avif" },
      { name: "Richard Helm", avatar: "/images/avatars/avatar5.avif" },
      { name: "Ralph Johnson", avatar: "/images/avatars/avatar5.avif" },
      { name: "John Vlissides", avatar: "/images/avatars/avatar5.avif" },
    ],
    cover: "/images/placeholder.svg",
    description:
      "A classic book on software design patterns and best practices.",
    topic: "Architecture",
    badge: "New",
    rating: 5,
    difficulty: "Advanced",
  },
  {
    id: "refactoring",
    title: "Refactoring: Improving the Design of Existing Code",
    authors: [
      { name: "Martin Fowler", avatar: "/images/avatars/avatar5.avif" },
    ],
    cover: "/images/placeholder.svg",
    description:
      "A guide to refactoring code for better readability and maintainability.",
    topic: "Programming",
    badge: "New",
    rating: 4,
    difficulty: "Intermediate",
  },
  {
    id: "continuous-delivery",
    title: "Continuous Delivery",
    authors: [
      { name: "Jez Humble", avatar: "/images/avatars/avatar5.avif" },
      { name: "David Farley", avatar: "/images/avatars/avatar5.avif" },
    ],
    cover: "/images/placeholder.svg",
    description:
      "Principles and practices for building and deploying software reliably.",
    topic: "DevOps",
    badge: "Popular",
    rating: 4,
    difficulty: "Advanced",
  },
  {
    id: "tdd",
    title: "Test-Driven Development: By Example",
    authors: [{ name: "Kent Beck", avatar: "/images/avatars/avatar5.avif" }],
    cover: "/images/placeholder.svg",
    description:
      "A practical guide to TDD and writing reliable, maintainable code.",
    topic: "Testing",
    badge: "Popular",
    rating: 3,
    difficulty: "Beginner",
  },
  {
    id: "domain-driven-design",
    title: "Domain-Driven Design: Tackling Complexity in the Heart of Software",
    authors: [{ name: "Eric Evans", avatar: "/images/avatars/avatar5.avif" }],
    cover: "/images/placeholder.svg",
    description:
      "A comprehensive look at domain-driven design for complex software projects.",
    topic: "Architecture",
  },
  {
    id: "pragmatic-programmer",
    title: "The Pragmatic Programmer",
    authors: [
      { name: "Andrew Hunt", avatar: "/images/avatars/avatar5.avif" },
      { name: "David Thomas", avatar: "/images/avatars/avatar5.avif" },
    ],
    cover: "/images/placeholder.svg",
    description:
      "Tips and techniques for becoming a better, more effective programmer.",
    topic: "Programming",
  },
  {
    id: "microservices",
    title: "Building Microservices",
    authors: [{ name: "Sam Newman", avatar: "/images/avatars/avatar5.avif" }],
    cover: "/images/placeholder.svg",
    description:
      "A practical guide to designing and building microservices architectures.",
    topic: "Architecture",
  },
  {
    id: "effective-java",
    title: "Effective Java",
    authors: [{ name: "Joshua Bloch", avatar: "/images/avatars/avatar5.avif" }],
    cover: "/images/placeholder.svg",
    description: "Best practices for writing robust, maintainable Java code.",
    topic: "Programming",
  },
  {
    id: "you-dont-know-js",
    title: "You Don’t Know JS Yet",
    authors: [{ name: "Kyle Simpson", avatar: "/images/avatars/avatar5.avif" }],
    cover: "/images/placeholder.svg",
    description:
      "A deep dive into the core mechanisms of the JavaScript language.",
    topic: "Web",
  },
  {
    id: "release-it",
    title: "Release It!",
    authors: [
      { name: "Michael T. Nygard", avatar: "/images/avatars/avatar5.avif" },
    ],
    cover: "/images/placeholder.svg",
    description:
      "Design and deploy production-ready software that survives real-world conditions.",
    topic: "DevOps",
  },
  {
    id: "working-effectively-with-legacy-code",
    title: "Working Effectively with Legacy Code",
    authors: [
      { name: "Michael Feathers", avatar: "/images/avatars/avatar5.avif" },
    ],
    cover: "/images/placeholder.svg",
    description:
      "Strategies for maintaining and improving legacy software systems.",
    topic: "Programming",
  },
  {
    id: "soft-skills",
    title: "Soft Skills: The software developer's life manual",
    authors: [{ name: "John Sonmez", avatar: "/images/avatars/avatar5.avif" }],
    cover: "/images/placeholder.svg",
    description:
      "A guide to the non-technical skills every software engineer needs.",
    topic: "CS",
  },
  {
    id: "infrastructure-as-code",
    title: "Infrastructure as Code",
    authors: [{ name: "Kief Morris", avatar: "/images/avatars/avatar5.avif" }],
    cover: "/images/placeholder.svg",
    description: "Managing servers, cloud, and automation with code.",
    topic: "DevOps",
  },
  {
    id: "clean-architecture",
    title:
      "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
    authors: [
      { name: "Robert C. Martin", avatar: "/images/avatars/avatar5.avif" },
    ],
    cover: "/images/placeholder.svg",
    description:
      "A guide to designing robust, maintainable software architectures.",
    topic: "Architecture",
  },
]; 