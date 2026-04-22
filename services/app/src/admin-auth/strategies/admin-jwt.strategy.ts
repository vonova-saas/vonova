/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface AdminJwtPayload {
  sub: string; // admin ID
  role: string;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT.JWT_ACCESS_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT.JWT_ACCESS_SECRET is required in .env');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: AdminJwtPayload) {
    // Ensure the token is for an admin
    if (payload.role !== 'admin') {
      throw new UnauthorizedException('Invalid admin token');
    }

    return {
      adminId: payload.sub,
      role: payload.role,
    };
  }
}
