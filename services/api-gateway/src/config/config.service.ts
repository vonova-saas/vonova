import { Injectable } from '@nestjs/common';
import { Env } from './env.config';

@Injectable()
export class ConfigService {
  get(key: string): string | undefined {
    return process.env[key];
  }

  getEnv() {
    return Env;
  }
}

