import { MongooseModuleOptions } from '@nestjs/mongoose';
import configuration from './configuration';

export const getMongoConfig = (): MongooseModuleOptions => {
  const config = configuration();
  const backend_env = config.NODE_ENV;

  return {
    uri:
      backend_env === 'development'
        ? config.MONGO_URI_LOCAL
        : config.MONGO_URI_REMOTE,
    dbName: config.MONGO_DB_NAME,
    autoIndex: true,
  };
};
