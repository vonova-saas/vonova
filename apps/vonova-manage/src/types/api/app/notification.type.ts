export type getNotificationResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    notifyMe: string;
    communicationEmails: boolean;
    marketingEmails: boolean;
    socialEmails: boolean;
    securityEmails: boolean;
    createdAt: string;
    updatedAt: string;
  }
}

export type updateNotificationType = {
  notifyMe: string;
  communicationEmails: boolean;
  marketingEmails: boolean;
  socialEmails: boolean;
  securityEmails: boolean;
}

export type updateNotificationResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    notifyMe: string;
    communicationEmails: boolean;
    marketingEmails: boolean;
    socialEmails: boolean;
    securityEmails: boolean;
    createdAt: string;
    updatedAt: string;
  }
}

export type resetNotificationResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    notifyMe: string;
    communicationEmails: boolean;
    marketingEmails: boolean;
    socialEmails: boolean;
    securityEmails: boolean;
    createdAt: string;
    updatedAt: string;
  }
}

