import * as jwt from 'jsonwebtoken';
import { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { Env } from '../config/env.config';
import { Types } from 'mongoose';

type StringValue = `${number}${'s' | 'm' | 'h' | 'd'}`; // e.g. "15m", "7d"

export type AccessTPayload = {
  userId: Types.ObjectId | string;
  role: string;
};

export type RefreshTPayload = {
  userId: Types.ObjectId | string;
  jti: string;
  role: string;
};

type SignOptsAndSecret = SignOptions & {
  expiresIn?: number | StringValue | undefined;
  secret: string;
};

const signDefaults: SignOptions = {
  audience: ['user'],
};

const verifyDefaults: VerifyOptions = {
  audience: 'user', // VerifyOptions expects string, not array
};

// Lazy getter functions to validate secrets when accessed
const getAccessTokenSecret = (): string => {
  const secret = Env.JWT.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_ACCESS_SECRET environment variable is not set. Please add it to your .env file.',
    );
  }
  return secret;
};

const getRefreshTokenSecret = (): string => {
  const secret = Env.JWT.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_REFRESH_SECRET environment variable is not set. Please add it to your .env file.',
    );
  }
  return secret;
};

// Helper function to get expiresIn with proper fallback
const getAccessTokenExpiresIn = (): StringValue => {
  const value = Env.JWT.JWT_ACCESS_EXPIRES_IN;
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return '1d';
  }
  return value as StringValue;
};

const getRefreshTokenExpiresIn = (): StringValue => {
  const value = Env.JWT.JWT_REFRESH_EXPIRES_IN;
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return '7d';
  }
  return value as StringValue;
};

export const accessTokenSignOptions: SignOptsAndSecret = {
  get expiresIn() {
    return getAccessTokenExpiresIn();
  },
  get secret() {
    return getAccessTokenSecret();
  },
};

export const refreshTokenSignOptions: SignOptsAndSecret = {
  get expiresIn() {
    return getRefreshTokenExpiresIn();
  },
  get secret() {
    return getRefreshTokenSecret();
  },
};

export const signJwtToken = (
  payload: AccessTPayload | RefreshTPayload,
  options?: SignOptsAndSecret,
) => {
  const opts = options || accessTokenSignOptions;
  const secret = opts.secret;
  let expiresIn = opts.expiresIn;

  if (!secret) {
    throw new Error(
      'JWT secret is required but was not provided. Please check your environment variables.',
    );
  }

  // Ensure expiresIn is always a valid string
  if (
    !expiresIn ||
    (typeof expiresIn === 'string' && expiresIn.trim() === '')
  ) {
    expiresIn = '1d'; // Default fallback
  }

  // Validate expiresIn format
  if (typeof expiresIn !== 'string' && typeof expiresIn !== 'number') {
    throw new Error(
      `Invalid expiresIn format: ${expiresIn}. Expected string (e.g., "1d", "7d") or number of seconds.`,
    );
  }

  const token = jwt.sign(payload, secret, {
    ...signDefaults,
    expiresIn,
  });

  return token;
};

const isJwtPayload = (payload: any): payload is JwtPayload => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof payload !== 'string'
  );
};

export const verifyJwtToken = <TPayload extends object = AccessTPayload>(
  token: string,
  options?: VerifyOptions & { secret: string },
) => {
  try {
    const { secret = getAccessTokenSecret(), ...opts } = options || {};
    if (!secret) {
      throw new Error(
        'JWT secret is required for token verification. Please check your environment variables.',
      );
    }
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
    secret: getAccessTokenSecret(),
  });
};

export const verifyRefreshToken = (token: string) => {
  return verifyJwtToken<RefreshTPayload>(token, {
    secret: getRefreshTokenSecret(),
  });
};
