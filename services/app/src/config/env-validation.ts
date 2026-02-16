import { appLogger } from '../utils/logger';

interface RequiredEnvVar {
  name: string;
  description: string;
}

const REQUIRED_ENV_VARS: RequiredEnvVar[] = [
  {
    name: 'JWT_ACCESS_SECRET',
    description: 'JWT access token secret key (required for token signing)',
  },
  {
    name: 'JWT_REFRESH_SECRET',
    description: 'JWT refresh token secret key (required for token signing)',
  },
];

const RECOMMENDED_ENV_VARS: RequiredEnvVar[] = [
  {
    name: 'MONGO_URI_RMOTE',
    description: 'MongoDB connection string (required for database operations)',
  },
  {
    name: 'FRONTEND_ORIGIN',
    description: 'Frontend application origin URL (required for CORS)',
  },
];

/**
 * Validates required environment variables at startup
 * Throws an error if any required variables are missing
 */
export function validateEnvironmentVariables(): void {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  // Check required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar.name] || process.env[envVar.name].trim() === '') {
      missingRequired.push(envVar.name);
    }
  }

  // Check recommended variables
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar.name] || process.env[envVar.name].trim() === '') {
      missingRecommended.push(envVar.name);
    }
  }

  // If required variables are missing, throw error
  if (missingRequired.length > 0) {
    const errorMessage = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                    MISSING REQUIRED ENVIRONMENT VARIABLES                 ║
╚═══════════════════════════════════════════════════════════════════════════╝

The following required environment variables are not set:

${missingRequired
        .map(
          (name) =>
            `  ${name} - ${REQUIRED_ENV_VARS.find((v) => v.name === name)?.description || ''
            }`,
        )
        .join('\n')}

To fix this:
1. Create a .env file in the root directory (services/app/)
2. Copy .env.example to .env (if available) or add the variables manually
3. Set the required variables with appropriate values

Example .env file:
  JWT_ACCESS_SECRET=your-secure-access-secret-key-min-32-chars
  JWT_REFRESH_SECRET=your-secure-refresh-secret-key-min-32-chars

For development, you can use:
  JWT_ACCESS_SECRET=dev-access-secret-key-change-in-production
  JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production

  WARNING: Never commit .env files to version control!
    `;

    appLogger.error(errorMessage);
    throw new Error(
      `Missing required environment variables: ${missingRequired.join(', ')}`,
    );
  }

  // Warn about missing recommended variables
  if (missingRecommended.length > 0) {
    const warningMessage = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                  MISSING RECOMMENDED ENVIRONMENT VARIABLES                ║
╚═══════════════════════════════════════════════════════════════════════════╝

The following recommended environment variables are not set:

${missingRecommended
        .map(
          (name) =>
            `    ${name} - ${RECOMMENDED_ENV_VARS.find((v) => v.name === name)?.description || ''
            }`,
        )
        .join('\n')}

The application may not function correctly without these variables.
    `;

    appLogger.warn(warningMessage);
  }

  // Log success
  appLogger.log(' Environment variables validated successfully');
}
