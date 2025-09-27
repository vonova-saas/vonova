export type addFeedbackType = {
  feedbackType: 'bug-report' | 'feature-request' | 'suggestion' | 'other';
  userBugReport?: string | null;
  userSuggestion?: string | null;
  userFeatureRequest?: string | null;
  userOther?: string | null;
  email?: string | null;
};

export type FeedbackStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type FeedbackMessage = {
  sender: 'user' | 'agent';
  message: string;
  createdAt: string;
};

export type addFeedbackResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    feedbackType: 'bug-report' | 'feature-request' | 'suggestion' | 'other';
    userBugReport?: string | null;
    userSuggestion?: string | null;
    userFeatureRequest?: string | null;
    userOther?: string | null;
    email?: string | null;
    status: FeedbackStatus;
    createdAt: string;
    updatedAt: string;
  }
}

export type getFeedbackResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    feedbackType: 'bug-report' | 'feature-request' | 'suggestion' | 'other';
    userBugReport?: string | null;
    userSuggestion?: string | null;
    userFeatureRequest?: string | null;
    userOther?: string | null;
    email?: string | null;
    status: FeedbackStatus;
    createdAt: string;
    updatedAt: string;
  }[],
}

export type getFeedbackByIdResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    feedbackType: 'bug-report' | 'feature-request' | 'suggestion' | 'other';
    userBugReport?: string | null;
    userSuggestion?: string | null;
    userFeatureRequest?: string | null;
    userOther?: string | null;
    email?: string | null;
    status: FeedbackStatus;
    messages?: FeedbackMessage[];
    createdAt: string;
    updatedAt: string;
  }
}

export type updateFeedbackType = {
  feedbackType: 'bug-report' | 'feature-request' | 'suggestion' | 'other';
  userBugReport?: string | null;
  userSuggestion?: string | null;
  userFeatureRequest?: string | null;
  userOther?: string | null;
  email?: string | null;
}

export type updateFeedbackResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    feedbackType: 'bug-report' | 'feature-request' | 'suggestion' | 'other';
    userBugReport?: string | null;
    userSuggestion?: string | null;
    userFeatureRequest?: string | null;
    userOther?: string | null;
    email?: string | null;
    status: FeedbackStatus;
    createdAt: string;
    updatedAt: string;
  }
}

export type deleteFeedbackResponseType = {
  message: string;
}

export type addFeedbackMessageRequestType = {
  message: string;
};

export type addFeedbackMessageResponseType = {
  message: string;
  data: FeedbackMessage[];
};

export type getFeedbackMessagesResponseType = {
  message: string;
  data: FeedbackMessage[];
};

export type updateFeedbackStatusRequestType = {
  status: FeedbackStatus;
};

export type updateFeedbackStatusResponseType = {
  message: string;
  data: {
    _id: string;
    status: FeedbackStatus;
    updatedAt: string;
  };
};
