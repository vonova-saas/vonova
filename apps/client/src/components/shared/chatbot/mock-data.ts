export type ChatMessage = {
  id: string;
  sender: "bot" | "user" | "agent";
  content: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  title: string;
  lastMessageAt: string;
  messages: ChatMessage[];
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  tags?: string[];
};

export type TaskItem = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due?: string;
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
];

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
];

export const tasks: TaskItem[] = [
  {
    id: "task-1",
    title: "Complete your profile",
    description: "Add your name, avatar, and bio to help instructors recognize you.",
    completed: false,
  },
  {
    id: "task-2",
    title: "Join your first course",
    description: "Use a course invite link or search the catalogue.",
    completed: true,
  },
  {
    id: "task-3",
    title: "Enable notifications",
    description: "Choose email or in-app alerts for due dates and announcements.",
    completed: false,
  },
];
