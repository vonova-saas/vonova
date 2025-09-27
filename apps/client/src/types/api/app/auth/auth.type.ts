//**************** Auth TYPES ***************
// ******************************************
//? ============= Auth With Email Flow Types =============
export type registerType = {
  name: string;
  email: string;
  password: string;
};

export type verifyEmailType = {
  email: string;
  code: string;
};

export type welcomeUserType = {
  email: string;
  role: string;
  answerOne: string;
};

export type welcomeUserResponseType = {
  message: string;
  data: {
    userId: string;
    role: string;
  };
};

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

//! ============= OAuth Flow Types =============
export type welcomeUserOAuthGoogleType = {
  role: string;
  answerOne: string;
};

export type welcomeUserOAuthGoogleResponseType = {
  message: string;
  data: {
    userId: string;
    role: string;
  };
};

//* ============= Forgot Password Flow Types =============
export type requestResetPasswordType = {
  email: string;
};

export type verifyResetPasswordCodeType = {
  email: string;
  code: string;
};

export type resetPasswordType = {
  newPassword: string;
};

// ============= Current User Types =============
export type currentUserResponseType = {
  message: string;
  user: {
    _id: string,
    name: string,
    email: string,
    profilePicture: string | null,
    role: string,
    permissions?: string[],
    isVerified: boolean,
    isActive: boolean,
    lastLogin: string,
    createdAt: string,
    updatedAt: string,
  }
};