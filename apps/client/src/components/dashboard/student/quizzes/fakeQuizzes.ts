import { QuizType } from "./types";

export const mockQuizzes: (QuizType & { topic: string })[] = [
  {
    id: "quiz-11565",
    title: "JavaScript Basics",
    description: "Test your knowledge of JavaScript fundamentals.",
    noOfQuestions: "6",
    topic: "JavaScript",
    questions: [
      {
        id: "q1",
        text: "What is the output of 2 + 2?",
        options: [
          { id: "a", text: "3" },
          { id: "b", text: "4" },
          { id: "c", text: "5" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        text: "Which of the following is NOT a JavaScript data type?",
        options: [
          { id: "a", text: "Number" },
          { id: "b", text: "Boolean" },
          { id: "c", text: "Float" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        text: "How do you declare a variable in JavaScript?",
        options: [
          { id: "a", text: "var myVar;" },
          { id: "b", text: "int myVar;" },
          { id: "c", text: "let myVar;" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  {
    id: "quiz-65462",
    title: "React Essentials",
    description: "How well do you know React?",
    noOfQuestions: "3",
    topic: "React",
    questions: [
      {
        id: "q1",
        text: "Which company developed React?",
        options: [
          { id: "a", text: "Google" },
          { id: "b", text: "Facebook" },
          { id: "c", text: "Microsoft" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        text: "What hook is used to manage state in a functional component?",
        options: [
          { id: "a", text: "useState" },
          { id: "b", text: "useEffect" },
          { id: "c", text: "useContext" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q3",
        text: "What is the default port for Create React App?",
        options: [
          { id: "a", text: "3000" },
          { id: "b", text: "8080" },
          { id: "c", text: "5000" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  {
    id: "quiz-45853",
    title: "Data Structures",
    description: "Quiz on common data structures.",
    noOfQuestions: "3",
    topic: "Data Structures",
    questions: [
      {
        id: "q1",
        text: "Which data structure uses FIFO (First In First Out)?",
        options: [
          { id: "a", text: "Stack" },
          { id: "b", text: "Queue" },
          { id: "c", text: "Tree" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        text: "What is the time complexity of searching in a balanced binary search tree?",
        options: [
          { id: "a", text: "O(log n)" },
          { id: "b", text: "O(n)" },
          { id: "c", text: "O(1)" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q3",
        text: "Which data structure is best for implementing recursion?",
        options: [
          { id: "a", text: "Queue" },
          { id: "b", text: "Stack" },
          { id: "c", text: "Linked List" },
        ],
        correctOptionId: "b",
      },
    ],
  },
  {
    id: "quiz-15234",
    title: "Algorithms",
    description: "Test your knowledge of algorithms.",
    noOfQuestions: "3",
    topic: "Algorithms",
    questions: [
      {
        id: "q1",
        text: "Which algorithm is used to find the shortest path in a graph?",
        options: [
          { id: "a", text: "Dijkstra's Algorithm" },
          { id: "b", text: "Bubble Sort" },
          { id: "c", text: "Binary Search" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q2",
        text: "What is the time complexity of quicksort in the average case?",
        options: [
          { id: "a", text: "O(n^2)" },
          { id: "b", text: "O(n log n)" },
          { id: "c", text: "O(log n)" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q3",
        text: "Which algorithm is NOT a sorting algorithm?",
        options: [
          { id: "a", text: "Merge Sort" },
          { id: "b", text: "Depth First Search" },
          { id: "c", text: "Insertion Sort" },
        ],
        correctOptionId: "b",
      },
    ],
  },
  {
    id: "quiz-45605",
    title: "Operating Systems",
    description: "Quiz on operating system concepts.",
    noOfQuestions: "3",
    topic: "Operating Systems",
    questions: [
      {
        id: "q1",
        text: "Which of the following is NOT an operating system?",
        options: [
          { id: "a", text: "Linux" },
          { id: "b", text: "Windows" },
          { id: "c", text: "Oracle" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q2",
        text: "What is the core of an operating system called?",
        options: [
          { id: "a", text: "Shell" },
          { id: "b", text: "Kernel" },
          { id: "c", text: "Command" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q3",
        text: "Which scheduling algorithm gives the minimum average waiting time?",
        options: [
          { id: "a", text: "FCFS" },
          { id: "b", text: "SJF" },
          { id: "c", text: "Round Robin" },
        ],
        correctOptionId: "b",
      },
    ],
  },
  {
    id: "quiz-15256",
    title: "Databases",
    description: "Quiz on database concepts and SQL.",
    noOfQuestions: "3",
    topic: "Databases",
    questions: [
      {
        id: "q1",
        text: "Which SQL statement is used to extract data from a database?",
        options: [
          { id: "a", text: "GET" },
          { id: "b", text: "SELECT" },
          { id: "c", text: "EXTRACT" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        text: "What does ACID stand for in databases?",
        options: [
          { id: "a", text: "Atomicity, Consistency, Isolation, Durability" },
          { id: "b", text: "Access, Control, Integrity, Data" },
          { id: "c", text: "Array, Column, Index, Data" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q3",
        text: "Which of the following is a NoSQL database?",
        options: [
          { id: "a", text: "MongoDB" },
          { id: "b", text: "MySQL" },
          { id: "c", text: "PostgreSQL" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  {
    id: "quiz-47827",
    title: "Flutter",
    description: "Quiz on database concepts and SQL.",
    noOfQuestions: "3",
    topic: "Flutter",
    questions: [
      {
        id: "q1",
        text: "Which SQL statement is used to extract data from a database?",
        options: [
          { id: "a", text: "GET" },
          { id: "b", text: "SELECT" },
          { id: "c", text: "EXTRACT" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        text: "What does ACID stand for in databases?",
        options: [
          { id: "a", text: "Atomicity, Consistency, Isolation, Durability" },
          { id: "b", text: "Access, Control, Integrity, Data" },
          { id: "c", text: "Array, Column, Index, Data" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q3",
        text: "Which of the following is a NoSQL database?",
        options: [
          { id: "a", text: "MongoDB" },
          { id: "b", text: "MySQL" },
          { id: "c", text: "PostgreSQL" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  {
    id: "quiz-42168",
    title: "Backend",
    description: "Quiz on database concepts and SQL.",
    noOfQuestions: "3",
    topic: "Backend",
    questions: [
      {
        id: "q1",
        text: "Which SQL statement is used to extract data from a database?",
        options: [
          { id: "a", text: "GET" },
          { id: "b", text: "SELECT" },
          { id: "c", text: "EXTRACT" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        text: "What does ACID stand for in databases?",
        options: [
          { id: "a", text: "Atomicity, Consistency, Isolation, Durability" },
          { id: "b", text: "Access, Control, Integrity, Data" },
          { id: "c", text: "Array, Column, Index, Data" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q3",
        text: "Which of the following is a NoSQL database?",
        options: [
          { id: "a", text: "MongoDB" },
          { id: "b", text: "MySQL" },
          { id: "c", text: "PostgreSQL" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  {
    id: "quiz-56249",
    title: "Frontend",
    description: "Quiz on database concepts and SQL.",
    noOfQuestions: "3",
    topic: "Frontend",
    questions: [
      {
        id: "q1",
        text: "Which SQL statement is used to extract data from a database?",
        options: [
          { id: "a", text: "GET" },
          { id: "b", text: "SELECT" },
          { id: "c", text: "EXTRACT" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        text: "What does ACID stand for in databases?",
        options: [
          { id: "a", text: "Atomicity, Consistency, Isolation, Durability" },
          { id: "b", text: "Access, Control, Integrity, Data" },
          { id: "c", text: "Array, Column, Index, Data" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q3",
        text: "Which of the following is a NoSQL database?",
        options: [
          { id: "a", text: "MongoDB" },
          { id: "b", text: "MySQL" },
          { id: "c", text: "PostgreSQL" },
        ],
        correctOptionId: "a",
      },
    ],
  },
];

export const topics = [
  "All",
  ...Array.from(new Set(mockQuizzes.map((q) => q.topic)))
]; 