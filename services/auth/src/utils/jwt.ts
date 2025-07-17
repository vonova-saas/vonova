import jwt, { SignOptions, VerifyOptions, JwtPayload } from "jsonwebtoken";
import { Env } from "../config/env.config";
import { UserDocument } from "../models/user.model";

type StringValue = `${number}${"s" | "m" | "h" | "d"}`; // e.g. "15m", "7d"

export type AccessTPayload = {
  userId: UserDocument["_id"];
};

export type RefreshTPayload = {
  userId: UserDocument["_id"];
  jti: string;
};

type SignOptsAndSecret = SignOptions & {
  expiresIn?: number | StringValue | undefined;
  secret: string;
};

const signDefaults: SignOptions = {
  audience: ["user"],
};

const verifyDefaults: VerifyOptions = {
  audience: "user", // VerifyOptions expects string, not array
};

export const accessTokenSignOptions: SignOptsAndSecret = {
  expiresIn: Env.JWT.JWT_ACCESS_EXPIRES_IN as StringValue,
  secret: Env.JWT.JWT_ACCESS_SECRET,
};

export const refreshTokenSignOptions: SignOptsAndSecret = {
  expiresIn: Env.JWT.JWT_REFRESH_EXPIRES_IN as StringValue,
  secret: Env.JWT.JWT_REFRESH_SECRET,
};

export const signJwtToken = (
  payload: AccessTPayload | RefreshTPayload,
  options?: SignOptsAndSecret
) => {
  const { secret, ...opts } = options || accessTokenSignOptions;
  const token = jwt.sign(payload, secret, {
    ...signDefaults,
    ...opts,
  });

  return token;
};

const isJwtPayload = (payload: any): payload is JwtPayload => {
  return typeof payload === 'object' && payload !== null && typeof payload !== 'string';
};

export const verifyJwtToken = <TPayload extends object = AccessTPayload>(
  token: string,
  options?: VerifyOptions & { secret: string }
) => {
  try {
    const { secret = Env.JWT.JWT_ACCESS_SECRET, ...opts } = options || {};
    const decoded = jwt.verify(token, secret, {
      ...verifyDefaults,
      ...opts,
    });

    if (!isJwtPayload(decoded)) {
      return {
        error: 'Invalid token payload format',
      };
    }

    const payload = decoded as unknown as TPayload;
    return { payload };
  } catch (err: any) {
    return {
      error: err.message,
    };
  }
};

export const verifyAccessToken = (token: string) => {
  return verifyJwtToken<AccessTPayload>(token, {
    secret: Env.JWT.JWT_ACCESS_SECRET,
  });
};

export const verifyRefreshToken = (token: string) => {
  return verifyJwtToken<RefreshTPayload>(token, {
    secret: Env.JWT.JWT_REFRESH_SECRET,
  });
};