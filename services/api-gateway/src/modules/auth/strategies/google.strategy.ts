import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Env } from '../../../config/env.config';
import { NotFoundException } from '../../../utils/appError';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: Env.GOOGLE_CLIENT_ID,
      clientSecret: Env.GOOGLE_CLIENT_SECRET,
      callbackURL: Env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { email, sub: googleId, picture } = profile._json;
      
      if (!googleId) {
        throw new NotFoundException('Google ID (sub) is missing');
      }

      const googleUser = {
        name: profile.displayName,
        email: email,
        providerId: googleId,
        picture: picture,
      };

      done(null, googleUser);
    } catch (error) {
      done(error, false);
    }
  }
}

