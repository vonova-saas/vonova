import { Notification } from "./types";

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'NFC Card Written Successfully',
    message: 'Your NFC card has been successfully programmed with the WiFi credentials.',
    time: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
    actionLabel: 'View Card',
  },
  {
    id: '2',
    type: 'error',
    title: 'NFC Read Failed',
    message: 'Unable to read the NFC card. Please try again or check if the card is properly positioned.',
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
    actionLabel: 'Retry',
  },
  {
    id: '3',
    type: 'warning',
    title: 'Low NFC Card Storage',
    message: 'You have only 3 NFC cards left in your inventory. Consider ordering more.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
    actionLabel: 'Order Now',
  },
  {
    id: '4',
    type: 'info',
    title: 'New Feature: Bulk NFC Programming',
    message: 'Now you can program multiple NFC cards at once with our new bulk programming feature.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    actionLabel: 'Learn More',
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update Available',
    message: 'A new version of the NFC Manager is available. Update now to get the latest features and security improvements.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    read: true,
    actionLabel: 'Update Now',
  },
];