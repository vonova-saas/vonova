import { MongooseModuleOptions } from '@nestjs/mongoose';
import configuration from './configuration';

export const getMongoConfigLMS = (): MongooseModuleOptions => {
  const nodeEnv = configuration().NODE_ENV?.trim().toLowerCase();
  const uri =
    nodeEnv === 'development'
      ? configuration().MONGO_URI_LOCAL_LMS
      : configuration().MONGO_URI_REMOTE_LMS;

  return {
    uri,
    dbName: configuration().MONGO_DB_NAME_LMS,
    autoIndex: true,
  };
};
