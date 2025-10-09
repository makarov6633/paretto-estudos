/**
 * Environment variable validation
 * Validates all required environment variables on startup
 */

const requiredEnvVars = [
  'POSTGRES_URL',
  'BETTER_AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

const optionalEnvVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_BASE_URL',
  'OPENAI_API_KEY',
  'RATE_LIMIT_BYPASS_SECRET',
] as const;

export function validateEnvironment() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional but recommended variables
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Validate specific formats
  if (process.env.POSTGRES_URL && !process.env.POSTGRES_URL.startsWith('postgres://')) {
    missing.push('POSTGRES_URL (invalid format - must start with postgres://)');
  }

  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    missing.push('STRIPE_SECRET_KEY (invalid format - must start with sk_)');
  }

  if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    missing.push('STRIPE_WEBHOOK_SECRET (invalid format - must start with whsec_)');
  }

  // Report errors
  if (missing.length > 0) {
    console.error('❌ Missing or invalid required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nSee .env.example for required variables.');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Report warnings
  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Optional environment variables not set:');
    warnings.forEach(v => console.warn(`   - ${v}`));
    console.warn('\nThese are optional but recommended for full functionality.');
  }

  console.log('✅ Environment variables validated');
}

// Run validation on import (for server startup)
if (typeof window === 'undefined') {
  validateEnvironment();
}
