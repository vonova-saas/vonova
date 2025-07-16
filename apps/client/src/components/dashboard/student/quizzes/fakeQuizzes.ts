import { QuizType } from "./types";

export const mockQuizzes: (QuizType & { topic: string })[] = [
  {
    id: "quiz-11565",
    title: "JavaScript Basics",
    description: "Test your knowledge of JavaScript fundamentals.",
    noOfQuestions: "10",
    topic: "JavaScript",
    questions: [
      {
        id: "q1",
        text: "What is the output of 2 + 2 in JavaScript?",
        options: [
          { id: "a", text: "3" },
          { id: "b", text: "4" },
          { id: "c", text: "5" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        text: "Which keyword declares a constant?",
        options: [
          { id: "a", text: "var" },
          { id: "b", text: "let" },
          { id: "c", text: "const" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q3",
        text: "Which method converts JSON string to object?",
        options: [
          { id: "a", text: "JSON.stringify" },
          { id: "b", text: "JSON.parse" },
          { id: "c", text: "parseJSON" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q4",
        text: "Which of these is NOT a data type in JavaScript?",
        options: [
          { id: "a", text: "Number" },
          { id: "b", text: "Boolean" },
          { id: "c", text: "Character" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q5",
        text: "What is the value of typeof null?",
        options: [
          { id: "a", text: "object" },
          { id: "b", text: "null" },
          { id: "c", text: "undefined" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q6",
        text: "What does '===' operator check?",
        options: [
          { id: "a", text: "Equality and type" },
          { id: "b", text: "Only equality" },
          { id: "c", text: "Only type" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q7",
        text: "What is the scope of variables declared with let?",
        options: [
          { id: "a", text: "Global" },
          { id: "b", text: "Function" },
          { id: "c", text: "Block" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q8",
        text: "What is NaN in JavaScript?",
        options: [
          { id: "a", text: "Not a Number" },
          { id: "b", text: "New Array Number" },
          { id: "c", text: "Null and Nothing" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q9",
        text: "Which function runs after a delay?",
        options: [
          { id: "a", text: "setInterval" },
          { id: "b", text: "setTimeout" },
          { id: "c", text: "clearTimeout" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q10",
        text: "Which array method adds an item to the end?",
        options: [
          { id: "a", text: "push" },
          { id: "b", text: "pop" },
          { id: "c", text: "shift" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  {
    id: "quiz-65462",
    title: "React Essentials",
    description: "How well do you know React?",
    noOfQuestions: "10",
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
        text: "Which hook manages local state?",
        options: [
          { id: "a", text: "useState" },
          { id: "b", text: "useEffect" },
          { id: "c", text: "useReducer" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q3",
        text: "What is JSX?",
        options: [
          { id: "a", text: "A CSS preprocessor" },
          { id: "b", text: "A templating language" },
          { id: "c", text: "JavaScript XML syntax" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q4",
        text: "Which hook runs side effects?",
        options: [
          { id: "a", text: "useContext" },
          { id: "b", text: "useEffect" },
          { id: "c", text: "useState" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q5",
        text: "What is lifting state up?",
        options: [
          { id: "a", text: "Moving state to a parent component" },
          { id: "b", text: "Passing props down" },
          { id: "c", text: "Using context API" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q6",
        text: "What does useContext do?",
        options: [
          { id: "a", text: "Fetches data" },
          { id: "b", text: "Manages state globally" },
          { id: "c", text: "Subscribes to context" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q7",
        text: "Which is NOT a valid React lifecycle method?",
        options: [
          { id: "a", text: "componentDidMount" },
          { id: "b", text: "componentWillUpdate" },
          { id: "c", text: "componentRenderNow" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q8",
        text: "What is the default port for Create React App?",
        options: [
          { id: "a", text: "3000" },
          { id: "b", text: "8080" },
          { id: "c", text: "5000" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q9",
        text: "What is the Virtual DOM?",
        options: [
          { id: "a", text: "An actual DOM node" },
          { id: "b", text: "A lightweight copy of the real DOM" },
          { id: "c", text: "A browser API" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q10",
        text: "What command starts a React app built with CRA?",
        options: [
          { id: "a", text: "npm start" },
          { id: "b", text: "npm build" },
          { id: "c", text: "npm test" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  {
    id: "quiz-99332",
    title: "DevOps Basics",
    description: "Quiz on CI/CD, containers, and automation.",
    noOfQuestions: "10",
    topic: "DevOps",
    questions: [
      {
        id: "q1",
        text: "What does CI/CD stand for?",
        options: [
          { id: "a", text: "Continuous Integration / Continuous Deployment" },
          { id: "b", text: "Code Integration / Code Debugging" },
          { id: "c", text: "Continuous Improvement / Code Delivery" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q2",
        text: "What tool is commonly used for containerization?",
        options: [
          { id: "a", text: "Git" },
          { id: "b", text: "Docker" },
          { id: "c", text: "Jenkins" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q3",
        text: "What is Infrastructure as Code?",
        options: [
          { id: "a", text: "Coding infrastructure components manually" },
          { id: "b", text: "Managing infrastructure using code" },
          { id: "c", text: "Deleting infrastructure" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q4",
        text: "Which format is often used for pipeline configuration?",
        options: [
          { id: "a", text: "YAML" },
          { id: "b", text: "HTML" },
          { id: "c", text: "CSV" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q5",
        text: "What does a load balancer do?",
        options: [
          { id: "a", text: "Balances database tables" },
          { id: "b", text: "Distributes traffic across servers" },
          { id: "c", text: "Encrypts data" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q6",
        text: "Which is a popular CI server?",
        options: [
          { id: "a", text: "Docker" },
          { id: "b", text: "Git" },
          { id: "c", text: "Jenkins" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q7",
        text: "What is blue-green deployment?",
        options: [
          { id: "a", text: "Color coding code" },
          { id: "b", text: "Rolling updates with downtime" },
          { id: "c", text: "Deploying to two environments for zero downtime" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q8",
        text: "Which tool manages Kubernetes clusters?",
        options: [
          { id: "a", text: "kubectl" },
          { id: "b", text: "docker-compose" },
          { id: "c", text: "git" },
        ],
        correctOptionId: "a",
      },
      {
        id: "q9",
        text: "What does a reverse proxy do?",
        options: [
          { id: "a", text: "Sends requests directly to DB" },
          { id: "b", text: "Serves as intermediary between client and server" },
          { id: "c", text: "Encrypts data" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q10",
        text: "Which tool is used for configuration management?",
        options: [
          { id: "a", text: "Ansible" },
          { id: "b", text: "Docker" },
          { id: "c", text: "Kubernetes" },
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