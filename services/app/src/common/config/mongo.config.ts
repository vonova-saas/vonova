import { MongooseModuleOptions } from '@nestjs/mongoose';
import configuration from './configuration';

export const getMongoConfig = (): MongooseModuleOptions => {
  const backend_env = configuration().NODE_ENV;
  const uri =
    backend_env === 'development'
      ? configuration().MONGO_URI_LOCAL
      : configuration().MONGO_URI_REMOTE;

  if (!uri || typeof uri !== 'string') {
    throw new Error(
      'MongoDB URI is missing. Set MONGO_URI_LOCAL (development) or MONGO_URI_REMOTE in .env',
    );
  }

  return {
    uri,
    dbName: configuration().MONGO_DB_NAME,
    autoIndex: true,
  };
};
