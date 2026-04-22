import { MongooseModuleOptions } from '@nestjs/mongoose';
import configuration from './configuration';

export const getMongoConfigAdmin = (): MongooseModuleOptions => {
  const nodeEnv = configuration().NODE_ENV?.trim().toLowerCase();
  const uri =
    nodeEnv === 'development'
      ? configuration().MONGO_URI_LOCAL_ADMIN
      : configuration().MONGO_URI_REMOTE_ADMIN;

  if (!uri || typeof uri !== 'string') {
    throw new Error(
      'MongoDB Admin URI is missing. Set MONGO_URI_LOCAL_ADMIN (development) or MONGO_URI_REMOTE_ADMIN in .env',
    );
  }

  const uriDbMatch = uri.match(/^[^?]*\/([^/?]+)(?:\?|$)/);
  const dbNameFromUri = uriDbMatch?.[1]?.trim();
  const configuredDbName = configuration().MONGO_DB_NAME_ADMIN?.trim();

  return {
    uri,
    dbName:
      dbNameFromUri && dbNameFromUri.length > 0
        ? dbNameFromUri
        : configuredDbName && configuredDbName.length > 0
          ? configuredDbName
          : undefined,
    autoIndex: true,
  };
};
