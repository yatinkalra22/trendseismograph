type EnvMap = Record<string, unknown>;

function requiredString(config: EnvMap, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalString(config: EnvMap, key: string, fallback: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }
  return value;
}

export function validateEnv(config: EnvMap): EnvMap {
  const validated = {
    ...config,
    NODE_ENV: optionalString(config, 'NODE_ENV', 'development'),
    PORT: optionalString(config, 'PORT', '3001'),
    FRONTEND_URL: optionalString(config, 'FRONTEND_URL', 'http://localhost:3000'),
    NLP_SERVICE_URL: optionalString(config, 'NLP_SERVICE_URL', 'http://localhost:8000'),
    REDIS_URL: requiredString(config, 'REDIS_URL'),
    DATABASE_URL: requiredString(config, 'DATABASE_URL'),
    API_KEY_SECRET: requiredString(config, 'API_KEY_SECRET'),
  };

  return validated;
}
