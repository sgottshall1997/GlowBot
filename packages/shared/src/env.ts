// Simple typed environment configuration
function getEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
}

// Unified environment configuration for all apps and server
export const env = {
  // AI Services
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY'),
  ANTHROPIC_API_KEY: getEnvVar('ANTHROPIC_API_KEY'),
  
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  REDIS_URL: getEnvVar('REDIS_URL'),
  
  // Server
  PORT: getEnvNumber('PORT', 3000),
  NODE_ENV: getEnvVar('NODE_ENV', 'development') as 'development' | 'test' | 'production',
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug',
  
  // Security
  JWT_SECRET: getEnvVar('JWT_SECRET', 'dev-secret-change-in-production'),
  ENCRYPTION_KEY: getEnvVar('ENCRYPTION_KEY'),
  
  // Features
  ENABLE_AI_GENERATION: getEnvBoolean('ENABLE_AI_GENERATION', true),
  ENABLE_ANALYTICS: getEnvBoolean('ENABLE_ANALYTICS', false),
  ENABLE_WEBHOOKS: getEnvBoolean('ENABLE_WEBHOOKS', false),
};

export type Env = typeof env;