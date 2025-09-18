import { PDFFile, PDFMessage, PDFSummary } from './types';

export const mockPDFFiles: PDFFile[] = [
  {
    id: 'pdf-1',
    name: 'Introduction to Machine Learning.pdf',
    size: 2048576, // 2MB
    uploadedAt: new Date('2024-01-15T10:30:00Z'),
    status: 'ready',
    pages: 45,
    topics: ['Machine Learning', 'AI', 'Data Science'],
    lastAccessed: new Date('2024-01-20T14:22:00Z'),
  },
  {
    id: 'pdf-2',
    name: 'React Development Guide.pdf',
    size: 1536000, // 1.5MB
    uploadedAt: new Date('2024-01-18T09:15:00Z'),
    status: 'ready',
    pages: 32,
    topics: ['React', 'Frontend', 'JavaScript'],
    lastAccessed: new Date('2024-01-19T16:45:00Z'),
  },
  {
    id: 'pdf-3',
    name: 'Database Design Principles.pdf',
    size: 3072000, // 3MB
    uploadedAt: new Date('2024-01-20T11:00:00Z'),
    status: 'ready',
    pages: 67,
    topics: ['Database', 'SQL', 'Design Patterns'],
    lastAccessed: new Date('2024-01-21T10:30:00Z'),
  },
  {
    id: 'pdf-4',
    name: 'DevOps Best Practices.pdf',
    size: 1792000, // 1.75MB
    uploadedAt: new Date('2024-01-22T13:45:00Z'),
    status: 'processing',
    pages: 28,
    topics: ['DevOps', 'CI/CD', 'Automation'],
  },
];

export const mockPDFSummaries: PDFSummary[] = [
  {
    id: 'summary-1',
    pdfId: 'pdf-1',
    summary: 'This comprehensive guide covers the fundamentals of machine learning, including supervised and unsupervised learning algorithms, neural networks, and practical applications. The document provides hands-on examples and best practices for implementing ML solutions.',
    keyPoints: [
      'Supervised vs Unsupervised Learning',
      'Neural Network Architecture',
      'Feature Engineering Techniques',
      'Model Evaluation Metrics',
      'Real-world Applications'
    ],
    topics: ['Machine Learning', 'AI', 'Data Science'],
    generatedAt: new Date('2024-01-15T10:35:00Z'),
    wordCount: 1250,
  },
  {
    id: 'summary-2',
    pdfId: 'pdf-2',
    summary: 'A practical guide to React development covering component architecture, state management, hooks, and modern React patterns. Includes examples of building scalable applications and performance optimization techniques.',
    keyPoints: [
      'Component Lifecycle',
      'Hooks and State Management',
      'Performance Optimization',
      'Testing Strategies',
      'Deployment Best Practices'
    ],
    topics: ['React', 'Frontend', 'JavaScript'],
    generatedAt: new Date('2024-01-18T09:20:00Z'),
    wordCount: 890,
  },
  {
    id: 'summary-3',
    pdfId: 'pdf-3',
    summary: 'Comprehensive coverage of database design principles including normalization, indexing strategies, query optimization, and scalability considerations. Practical examples demonstrate real-world database design patterns.',
    keyPoints: [
      'Database Normalization',
      'Indexing Strategies',
      'Query Optimization',
      'Scalability Patterns',
      'Data Integrity'
    ],
    topics: ['Database', 'SQL', 'Design Patterns'],
    generatedAt: new Date('2024-01-20T11:05:00Z'),
    wordCount: 1560,
  },
];

export const mockMessages: PDFMessage[] = [
  {
    id: 'msg-1',
    content: 'Can you summarize the key points about machine learning algorithms?',
    from: 'user',
    timestamp: new Date('2024-01-20T14:20:00Z'),
    pdfId: 'pdf-1',
    type: 'question',
  },
  {
    id: 'msg-2',
    content: 'Based on the "Introduction to Machine Learning" document, here are the key points about ML algorithms:\n\n1. **Supervised Learning**: Uses labeled data to train models that can predict outcomes\n2. **Unsupervised Learning**: Finds patterns in unlabeled data\n3. **Neural Networks**: Multi-layered architectures that can learn complex patterns\n4. **Feature Engineering**: Critical for model performance and accuracy\n5. **Model Evaluation**: Uses metrics like accuracy, precision, recall, and F1-score\n\nWould you like me to elaborate on any specific algorithm or concept?',
    from: 'assistant',
    timestamp: new Date('2024-01-20T14:21:00Z'),
    pdfId: 'pdf-1',
    type: 'summary',
  },
  {
    id: 'msg-3',
    content: 'What are the best practices for React performance optimization?',
    from: 'user',
    timestamp: new Date('2024-01-19T16:40:00Z'),
    pdfId: 'pdf-2',
    type: 'question',
  },
  {
    id: 'msg-4',
    content: 'According to the React Development Guide, here are the key performance optimization practices:\n\n1. **Use React.memo()** for component memoization\n2. **Implement useCallback()** for function memoization\n3. **Use useMemo()** for expensive calculations\n4. **Code splitting** with React.lazy() and Suspense\n5. **Virtual scrolling** for large lists\n6. **Optimize bundle size** with tree shaking\n7. **Use production builds** for deployment\n\nThese techniques help reduce unnecessary re-renders and improve application performance.',
    from: 'assistant',
    timestamp: new Date('2024-01-19T16:42:00Z'),
    pdfId: 'pdf-2',
    type: 'summary',
  },
  {
    id: 'msg-5',
    content: 'What are the best practices for database design?',
    from: 'user',
    timestamp: new Date('2024-01-25T16:40:00Z'),
    pdfId: 'pdf-3',
    type: 'question',
  },
  {
    id: 'msg-6',
    content: 'According to the Database Design Principles, here are the key performance optimization practices:\n\n1. **Use React.memo()** for component memoization\n2. **Implement useCallback()** for function memoization\n3. **Use useMemo()** for expensive calculations\n4. **Code splitting** with React.lazy() and Suspense\n5. **Virtual scrolling** for large lists\n6. **Optimize bundle size** with tree shaking\n7. **Use production builds** for deployment\n\nThese techniques help reduce unnecessary re-renders and improve application performance.',
    from: 'assistant',
    timestamp: new Date('2024-01-25T16:42:00Z'),
    pdfId: 'pdf-3',
    type: 'summary',
  },
];

export const topics = [
  'All',
  'Machine Learning',
  'AI',
  'Data Science',
  'React',
  'Frontend',
  'JavaScript',
  'Database',
  'SQL',
  'Design Patterns',
  'DevOps',
  'CI/CD',
  'Automation',
]; 