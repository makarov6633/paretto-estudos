#!/usr/bin/env node
/**
 * Pre-Deployment Checklist Script
 * Verifies project is ready for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, message) {
  const status = condition ? '✅' : '❌';
  const result = { name, passed: condition, message };
  checks.push(result);

  if (condition) {
    passed++;
    console.log(`${status} ${name}`);
  } else {
    failed++;
    console.log(`${status} ${name}`);
    if (message) console.log(`   └─ ${message}`);
  }
}

console.log('\n🚀 Pre-Deployment Checklist for Paretto Estudos\n');

// 1. Check required files exist
console.log('📁 Required Files:');
check(
  'package.json exists',
  fs.existsSync(path.join(rootDir, 'package.json')),
  'Missing package.json'
);
check(
  'next.config.ts exists',
  fs.existsSync(path.join(rootDir, 'next.config.ts')),
  'Missing next.config.ts'
);
check(
  'drizzle.config.ts exists',
  fs.existsSync(path.join(rootDir, 'drizzle.config.ts')),
  'Missing drizzle.config.ts'
);
check(
  '.env.example exists',
  fs.existsSync(path.join(rootDir, '.env.example')),
  'Missing .env.example - should document all required env vars'
);

// 2. Check environment variables documentation
console.log('\n🔐 Environment Variables:');
const envExamplePath = path.join(rootDir, '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envExample = fs.readFileSync(envExamplePath, 'utf8');

  check(
    'POSTGRES_URL documented',
    envExample.includes('POSTGRES_URL'),
    'Add POSTGRES_URL to .env.example'
  );
  check(
    'BETTER_AUTH_SECRET documented',
    envExample.includes('BETTER_AUTH_SECRET'),
    'Add BETTER_AUTH_SECRET to .env.example'
  );
  check(
    'GOOGLE OAuth documented',
    envExample.includes('GOOGLE_CLIENT_ID') && envExample.includes('GOOGLE_CLIENT_SECRET'),
    'Add Google OAuth credentials to .env.example'
  );
  check(
    'Stripe keys documented',
    envExample.includes('STRIPE_SECRET_KEY') && envExample.includes('STRIPE_WEBHOOK_SECRET'),
    'Add Stripe keys to .env.example'
  );
  check(
    'Base URLs documented',
    envExample.includes('NEXT_PUBLIC_APP_URL') && envExample.includes('NEXT_PUBLIC_BASE_URL'),
    'Add base URLs to .env.example'
  );
}

// 3. Check security configurations
console.log('\n🔒 Security:');
const nextConfigPath = path.join(rootDir, 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

  check(
    'CSP headers configured',
    nextConfig.includes('Content-Security-Policy'),
    'Add CSP headers to next.config.ts'
  );
  check(
    'HSTS configured',
    nextConfig.includes('Strict-Transport-Security'),
    'Add HSTS to next.config.ts'
  );
  check(
    'X-Frame-Options configured',
    nextConfig.includes('X-Frame-Options'),
    'Add X-Frame-Options to next.config.ts'
  );
}

const middlewarePath = path.join(rootDir, 'src', 'middleware.ts');
check(
  'Rate limiting configured',
  fs.existsSync(middlewarePath),
  'Create src/middleware.ts with rate limiting'
);

// 4. Check database setup
console.log('\n🗄️  Database:');
const schemaPath = path.join(rootDir, 'src', 'lib', 'schema.ts');
check(
  'Database schema exists',
  fs.existsSync(schemaPath),
  'Missing src/lib/schema.ts'
);

const migrationsDir = path.join(rootDir, 'drizzle');
const hasMigrations = fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0;
check(
  'Migrations generated',
  hasMigrations,
  'Run: pnpm run db:generate'
);

// 5. Check authentication setup
console.log('\n🔑 Authentication:');
const authPath = path.join(rootDir, 'src', 'lib', 'auth.ts');
check(
  'Better Auth configured',
  fs.existsSync(authPath),
  'Missing src/lib/auth.ts'
);

const authHandlerPath = path.join(rootDir, 'src', 'app', 'api', 'auth', '[...all]', 'route.ts');
check(
  'Better Auth handler exists',
  fs.existsSync(authHandlerPath),
  'Missing Better Auth API handler'
);

// 6. Check Stripe integration
console.log('\n💳 Stripe:');
const plansActionsPath = path.join(rootDir, 'src', 'app', 'plans', 'actions.ts');
check(
  'Checkout action exists',
  fs.existsSync(plansActionsPath),
  'Missing src/app/plans/actions.ts'
);

const stripeWebhookPath = path.join(rootDir, 'src', 'app', 'api', 'stripe', 'webhook', 'route.ts');
check(
  'Stripe webhook endpoint exists',
  fs.existsSync(stripeWebhookPath),
  'Missing Stripe webhook handler'
);

// 7. Check access control
console.log('\n🎫 Access Control:');
const accessCheckPath = path.join(rootDir, 'src', 'app', 'api', 'access', 'check', 'route.ts');
check(
  'Access control API exists',
  fs.existsSync(accessCheckPath),
  'Missing access control endpoint'
);

// 8. Check content management
console.log('\n📚 Content:');
const publicMediaPdf = path.join(rootDir, 'public', 'media', 'pdf');
const publicMediaAudio = path.join(rootDir, 'public', 'media', 'audio');
check(
  'PDF directory exists',
  fs.existsSync(publicMediaPdf),
  'Create public/media/pdf/ directory'
);
check(
  'Audio directory exists',
  fs.existsSync(publicMediaAudio),
  'Create public/media/audio/ directory'
);

// 9. Check critical pages
console.log('\n📄 Critical Pages:');
const criticalPages = [
  'src/app/page.tsx',
  'src/app/library/page.tsx',
  'src/app/plans/page.tsx',
  'src/app/item/[slug]/read/page.tsx'
];

criticalPages.forEach(pagePath => {
  const fullPath = path.join(rootDir, pagePath);
  check(
    `${pagePath} exists`,
    fs.existsSync(fullPath),
    `Missing critical page: ${pagePath}`
  );
});

// 10. Check components
console.log('\n🧩 Components:');
const criticalComponents = [
  'src/components/site-header.tsx',
  'src/components/site-footer.tsx',
  'src/components/ItemCard.tsx',
  'src/components/auth/user-profile.tsx'
];

criticalComponents.forEach(componentPath => {
  const fullPath = path.join(rootDir, componentPath);
  check(
    `${componentPath} exists`,
    fs.existsSync(fullPath),
    `Missing critical component: ${componentPath}`
  );
});

// 11. Check build configuration
console.log('\n⚙️  Build Configuration:');
const packageJsonPath = path.join(rootDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  check(
    'Build script exists',
    packageJson.scripts && packageJson.scripts.build,
    'Add "build" script to package.json'
  );
  check(
    'Start script exists',
    packageJson.scripts && packageJson.scripts.start,
    'Add "start" script to package.json'
  );
  check(
    'Migration script exists',
    packageJson.scripts && packageJson.scripts['db:migrate'],
    'Add "db:migrate" script to package.json'
  );
}

// 12. Check documentation
console.log('\n📖 Documentation:');
check(
  'README.md exists',
  fs.existsSync(path.join(rootDir, 'README.md')),
  'Add README.md with project overview'
);
check(
  'DEPLOYMENT.md exists',
  fs.existsSync(path.join(rootDir, 'DEPLOYMENT.md')),
  'Add DEPLOYMENT.md with deployment instructions'
);
check(
  'CLAUDE.md exists',
  fs.existsSync(path.join(rootDir, 'CLAUDE.md')),
  'CLAUDE.md provides development context'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All checks passed! Project is ready for deployment.\n');
  console.log('Next steps:');
  console.log('1. Set up production environment variables');
  console.log('2. Configure Google OAuth redirect URIs');
  console.log('3. Set up Stripe webhook endpoint');
  console.log('4. Run database migrations in production');
  console.log('5. Deploy to Vercel');
  console.log('\nSee DEPLOYMENT.md for detailed instructions.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} check(s) failed. Please fix issues before deploying.\n`);
  process.exit(1);
}
