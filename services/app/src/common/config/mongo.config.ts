import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import configuration from './configuration';

export const getMongoConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const backendEnv = configuration().NODE_ENV;

  const uri =
    backendEnv === 'development'
      ? configuration().MONGO_URI_LOCAL
      : configuration().MONGO_URI_LOCAL;

  if (!uri) {
    throw new Error('MongoDB URI is not defined in environment variables');
  }

  return {
    uri,
    dbName: configService.get<string>('MONGO_DB_NAME'),
    autoIndex: true,
  };
};
