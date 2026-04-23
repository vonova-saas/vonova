//**************** Admin Auth TYPES ***************
// ******************************************

export type AdminRequestLoginCodeType = {
  email: string;
  password: string;
};

export type AdminRequestLoginCodeResponseType = {
  message: string;
};

export type AdminVerifyLoginType = {
  email: string;
  code: string;
};

export type AdminVerifyLoginResponseType = {
  access_token: string;
  refresh_token: string;
};

export type AdminResetPasswordType = {
  oldPassword: string;
  newPassword: string;
};

export type AdminResetPasswordResponseType = {
  message: string;
};

export type AdminRefreshTokenResponseType = {
  access_token: string;
  refresh_token: string;
};

export type AdminCurrentUserResponseType = {
  message: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
};

export type AdminAuthErrorType = {
  statusCode: number;
  message: string;
  error: string;
};
