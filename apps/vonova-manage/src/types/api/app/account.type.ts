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

/** Fields for PUT /account/user/:userId as multipart/form-data (see API gateway). */
export type updateAccountMultipartPayload = {
  name: string;
  bio: string;
  address: string;
  /** ISO date as `yyyy-MM-dd`; omit when clearing is not supported client-side */
  dateOfBirth?: string;
  /** Optional image; uploaded to S3 as the profile picture */
  file?: File | null;
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

