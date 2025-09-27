export type SupportCategory = 'technical' | 'billing' | 'general' | 'feature-request' | 'bug-report';
export type SupportStatus = 'open' | 'pending' | 'resolved' | 'closed';

export type SupportMessage = {
  sender: 'user' | 'agent';
  message: string;
  createdAt: string;
};

export type addSupportTicketType = {
  fullName: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
};

export type addSupportTicketResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    fullName: string;
    email: string;
    category: SupportCategory;
    status: SupportStatus;
    subject: string;
    message: string;
    createdAt: string;
    updatedAt: string;
  }
}

export type getSupportTicketResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    fullName: string;
    email: string;
    category: SupportCategory;
    status: SupportStatus;
    subject: string;
    message: string;
    createdAt: string;
    updatedAt: string;
  }[],
}

export type getSupportTicketByIdResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    fullName: string;
    email: string;
    category: SupportCategory;
    status: SupportStatus;
    subject: string;
    message: string;
    messages?: SupportMessage[];
    createdAt: string;
    updatedAt: string;
  }
}

export type updateSupportTicketType = {
  fullName: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
}

export type updateSupportTicketResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    fullName: string;
    email: string;
    category: SupportCategory;
    status: SupportStatus;
    subject: string;
    message: string;
    createdAt: string;
    updatedAt: string;
  }
}

export type deleteSupportTicketResponseType = {
  message: string;
}

export type addSupportMessageRequestType = {
  message: string;
};

export type addSupportMessageResponseType = {
  message: string;
  data: SupportMessage[];
};

export type getSupportMessagesResponseType = {
  message: string;
  data: SupportMessage[];
};

export type updateSupportStatusRequestType = {
  status: SupportStatus;
};

export type updateSupportStatusResponseType = {
  message: string;
  data: {
    _id: string;
    status: SupportStatus;
    updatedAt: string;
  };
};
