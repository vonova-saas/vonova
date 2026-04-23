//**************** Auth TYPES ***************
// ******************************************
export type loginType = {
  email: string;
  password: string
};

export type loginResponseType = {
  message: string;
  data: {
    user: {
      _id: string,
      name: string,
      email: string,
      profilePicture: string | null,
      role: string,
      isVerified: boolean,
      isActive: boolean,
      lastLogin: string,
      createdAt: string,
      updatedAt: string
    };
  };
};

// ============= Current User Types =============
export type currentUserResponseType = {
  message: string;
  user: {
    _id: string,
    name: string,
    email: string,
    role: string,
  }
};