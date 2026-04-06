import { MongooseModuleOptions } from '@nestjs/mongoose';
import configuration from './configuration';

export const getMongoConfigApp = (): MongooseModuleOptions => {
  const nodeEnv = configuration().NODE_ENV?.trim().toLowerCase();
  const uri =
    nodeEnv === 'development'
      ? configuration().MONGO_URI_LOCAL_APP
      : configuration().MONGO_URI_REMOTE_APP;

  if (!uri || typeof uri !== 'string') {
    throw new Error(
      'MongoDB URI is missing. Set MONGO_URI_LOCAL_APP (development) or MONGO_URI_REMOTE_APP in .env',
    );
  }

  const uriDbMatch = uri.match(/^[^?]*\/([^/?]+)(?:\?|$)/);
  const dbNameFromUri = uriDbMatch?.[1]?.trim();
  const configuredDbName = configuration().MONGO_DB_NAME_APP?.trim();

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
