import { MongooseModuleOptions } from '@nestjs/mongoose';
import configuration from './configuration';

export const getMongoConfig = (): MongooseModuleOptions => {
  const backend_env = configuration().NODE_ENV;
  const uri =
    backend_env === 'development'
      ? configuration().MONGO_URI_LOCAL
      : configuration().MONGO_URI_REMOTE;

  return {
    uri,
    dbName: configuration().MONGO_DB_NAME,
    autoIndex: true,
  };
};
