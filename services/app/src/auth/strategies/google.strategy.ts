import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { NotFoundException } from '../../utils/appError';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('env.googleClientId') ||
        process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        configService.get<string>('env.googleClientSecret') ||
        process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        configService.get<string>('env.googleCallbackUrl') ||
        process.env.GOOGLE_CALLBACK_URL,
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
