import { Feedback } from './types';

// Mock data - In a real app, this would come from an API
export const MOCK_FEEDBACK: Feedback[] = [
  {
    id: '1',
    type: 'bug',
    message: 'The checkout button is not working on the cart page when using Safari browser.',
    contactEmail: 'user1@example.com',
    status: 'new',
    metadata: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      url: '/cart',
      timestamp: '2025-08-15T10:30:00Z',
    },
  },
  {
    id: '2',
    type: 'feature',
    message: 'It would be great to have a dark mode for the dashboard.',
    contactEmail: 'user2@example.com',
    status: 'in_progress',
    response: 'Thanks for the suggestion! We\'re currently working on implementing dark mode in our next update.',
    respondedAt: '2025-08-16T14:20:00Z',
    respondedBy: 'admin@example.com',
    metadata: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      url: '/dashboard',
      timestamp: '2025-08-10T09:15:00Z',
    },
  },
  {
    id: '3',
    type: 'suggestion',
    message: 'Could you add more sorting options to the products page?',
    contactEmail: 'user3@example.com',
    status: 'resolved',
    response: 'We\'ve added new sorting options including price high-to-low, newest, and best selling. Let us know what you think!',
    respondedAt: '2025-08-18T11:05:00Z',
    respondedBy: 'admin@example.com',
    metadata: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      url: '/products',
      timestamp: '2025-08-05T16:45:00Z',
    },
  },
  {
    id: '4',
    type: 'other',
    message: 'I love your website! The user interface is very intuitive and easy to use.',
    status: 'resolved',
    metadata: {
      timestamp: '2025-08-17T08:20:00Z',
    },
  },
];