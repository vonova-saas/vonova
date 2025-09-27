export type getAccountResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl: string;
    bio: string;
    dateOfBirth: string;
    address: string;
    createdAt: string;
    updatedAt: string;
  }
}

export type updateAccountType = {
  name: string;
  avatarUrl: string;
  bio: string;
  dateOfBirth: string;
  address: string;
}

export type updateAccountResponseType = {
  message: string;
  data: {
    _id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl: string;
    bio: string;
    dateOfBirth: string;
    address: string;
    createdAt: string;
    updatedAt: string;
  }
}

