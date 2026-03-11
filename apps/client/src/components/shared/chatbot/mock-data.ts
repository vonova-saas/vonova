export type ChatMessage = {
  id: string;
  sender: "bot" | "user" | "agent";
  content: string;
  timestamp: string;
  image?: string;
};

export type Conversation = {
  id: string;
  title: string;
  lastMessageAt: string;
  messages: ChatMessage[];
};

export type TaskItem = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  tags?: string[];
};


export const conversations: Conversation[] = [
  {
    id: "conv-1",
    title: "I have questions about billing",
    lastMessageAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "m1",
        sender: "bot",
        content: "Sure! What would you like to know about billing?",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m2",
        sender: "user",
        content: "How do I view my invoices?",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 1000).toISOString(),
      },
      {
        id: "m3",
        sender: "bot",
        content: "Go to Settings → Billing → Invoices. You can download PDFs there.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120 * 1000).toISOString(),
      },
    ],
  },
  {
    id: "conv-2",
    title: "You can ask questions here. How can I help?",
    lastMessageAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      {
        id: "m4",
        sender: "bot",
        content: "Welcome! Ask me anything about using the LMS.",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },

  {
    id: "conv-3",
    title: "How to generate a quiz using AI?",
    lastMessageAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: "m5", sender: "user", content: "Can AI create quizzes for me?", timestamp: "..." },
      { id: "m6", sender: "bot", content: "Yes! Go to Course → Quizzes → Generate with AI. Describe your topic and difficulty.", timestamp: "..." },
    ],
  },
  {
    id: "conv-4",
    title: "Best practices for coding assignments",
    lastMessageAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: "m7", sender: "user", content: "Tips for clean code?", timestamp: "..." },
      { id: "m8", sender: "bot", content: "Use meaningful variable names, add comments, follow DRY principle, and write tests.", timestamp: "..." },
    ],
  },
  {
    id: "conv-5",
    title: "Issue with course enrollment",
    lastMessageAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: "m9", sender: "user", content: "Can't enroll in CS101", timestamp: "..." },
      { id: "m10", sender: "bot", content: "Check if the course is open or if you have the invite link. Contact support if needed.", timestamp: "..." },
    ],
  },
]

export const faqs: FaqItem[] = [
  {
    id: "faq-1",
    question: "How do I submit an assignment?",
    answer:
      "Open your course → Assignments → select the assignment → Upload your file(s) → Submit.",
    tags: ["student", "assignments"],
  },
  {
    id: "faq-2",
    question: "How do I create a quiz as an instructor?",
    answer:
      "Go to Instructor Dashboard → Quizzes → New Quiz. Configure questions, schedule, and publish.",
    tags: ["instructor", "quizzes"],
  },
  {
    id: "faq-3",
    question: "Can I reset my password?",
    answer: "Yes. Use Forgot Password on the login page or update it in Settings → Security.",
    tags: ["account"],
  },
  {
    id: "faq-4",
    question: "How can I create a new course as an instructor?",
    answer:
      "Go to the trainer's control panel → Courses → New Course. Add the title, description, upload videos or files, then publish the course.",
    tags: ["instructor", "courses", "arabic"],
  },
  {
    id: "faq-5",
    question: "What is the difference between the free and paid plans?",
    answer:
      "The free plan allows only 3 courses and limited storage space. The paid plan unlocks unlimited courses + advanced AI features + detailed performance analytics.",
    tags: ["pricing", "plans"],
  },

];
