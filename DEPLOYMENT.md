# Production Deployment Guide - Paretto Estudos

Complete guide for deploying Paretto Estudos to production.

## Prerequisites

- ✅ Domain name registered and configured
- ✅ Vercel account (recommended) or alternative hosting platform
- ✅ PostgreSQL database (Vercel Postgres or Neon recommended)
- ✅ Google Cloud Console project for OAuth
- ✅ Stripe account for payments
- ✅ Git repository (GitHub/GitLab)

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create new Postgres database or use existing project
3. Copy connection string from Storage → Postgres → Settings → Connection String
4. Save as `POSTGRES_URL` environment variable

### Option B: Neon (Alternative)

1. Go to [Neon Console](https://console.neon.tech)
2. Create new project
3. Copy connection string
4. Save as `POSTGRES_URL` environment variable

### Run Database Migrations

```bash
# Set POSTGRES_URL in your .env.local
pnpm run db:migrate

# Verify schema
pnpm run db:studio
```

## Step 2: Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select project
3. Navigate to **APIs & Services** → **Credentials**
4. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Name: Paretto Estudos Production
   - Authorized JavaScript origins:
     - `https://yourdomain.com`
   - Authorized redirect URIs:
     - `https://yourdomain.com/api/auth/callback/google`
5. Save `Client ID` as `GOOGLE_CLIENT_ID`
6. Save `Client Secret` as `GOOGLE_CLIENT_SECRET`

## Step 3: Stripe Configuration

### Create Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**
3. Create monthly subscription:
   - Name: Paretto Premium
   - Price: R$ 15.00
   - Billing: Recurring monthly
4. Copy Price ID (starts with `price_`)
5. Update in `src/app/plans/actions.ts`:
   ```typescript
   price: 'price_YOUR_PRODUCTION_PRICE_ID'
   ```

### Configure Webhooks

1. Navigate to **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
3. Events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy **Signing secret** as `STRIPE_WEBHOOK_SECRET`
5. Copy **Secret key** (starts with `sk_live_`) as `STRIPE_SECRET_KEY`

### Test Webhooks Locally (Optional)

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
pnpm dev
```

## Step 4: Environment Variables

Create `.env.production` or configure in Vercel:

```bash
# Required
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
POSTGRES_URL=postgres://user:password@host:5432/database
BETTER_AUTH_SECRET=<generated-with-openssl-rand-base64-32>
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
OPENAI_API_KEY=<if-using-chat-features>
RATE_LIMIT_BYPASS_SECRET=<for-internal-testing>
```

### Generate Secrets

```bash
# BETTER_AUTH_SECRET
openssl rand -base64 32

# RATE_LIMIT_BYPASS_SECRET
openssl rand -base64 32
```

## Step 5: Deploy to Vercel

### Initial Setup

1. Push code to GitHub/GitLab
2. Go to [Vercel Dashboard](https://vercel.com/new)
3. Import repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

### Environment Variables

In Vercel project settings → Environment Variables:

1. Add all variables from `.env.example`
2. Set for **Production** environment
3. Redeploy after adding variables

### Custom Domain

1. Go to project Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown:
   - Type: A → Value: 76.76.21.21
   - Type: CNAME → Value: cname.vercel-dns.com

## Step 6: Post-Deployment Verification

### Health Checks

Visit these URLs to verify deployment:

- ✅ Homepage: `https://yourdomain.com`
- ✅ Library: `https://yourdomain.com/library`
- ✅ Health endpoint: `https://yourdomain.com/api/health`
- ✅ OAuth: `https://yourdomain.com/api/auth/get-session`

### Test Authentication

1. Click "Entrar" button
2. Sign in with Google
3. Verify session in browser DevTools:
   ```javascript
   fetch('/api/auth/get-session').then(r => r.json()).then(console.log)
   ```

### Test Subscription Flow

1. Navigate to `/plans`
2. Click "Assinar Premium"
3. Complete Stripe Checkout with test card:
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVC: Any 3 digits
4. Verify subscription in Stripe Dashboard
5. Check database: `SELECT * FROM subscription;`

### Test Access Control

```bash
curl https://yourdomain.com/api/access/check \
  -H "Cookie: your-session-cookie"
```

Expected response:
```json
{
  "allowed": true,
  "reason": "premium"
}
```

## Step 7: Content Migration

### Upload Media Files

Ensure all PDF and audio files are accessible:

```bash
# Option 1: Vercel Blob Storage (recommended)
# Upload to Vercel Blob and update URLs in database

# Option 2: AWS S3
# Upload to S3 bucket and update URLs

# Option 3: Vercel Public Directory
# Place files in public/media/ before deployment
# Already configured: public/media/pdf/ and public/media/audio/
```

### Verify Content

1. Check item in database has correct URLs:
   ```sql
   SELECT slug, title, "pdfUrl", "hasAudio" FROM item LIMIT 5;
   ```
2. Test PDF access: `https://yourdomain.com/media/pdf/filename.pdf`
3. Test audio access: `https://yourdomain.com/media/audio/filename.wav`

## Step 8: Security Checklist

- ✅ HTTPS enabled (automatic with Vercel)
- ✅ CSP headers configured (in `next.config.ts`)
- ✅ Rate limiting active (in `src/middleware.ts`)
- ✅ BETTER_AUTH_SECRET is strong random string
- ✅ Database credentials secured
- ✅ Stripe webhook secret configured
- ✅ OAuth redirect URIs match production domain
- ✅ No .env files committed to repository
- ✅ HSTS enabled for production
- ✅ X-Frame-Options: DENY

## Step 9: Performance Optimization

### Enable Vercel Analytics (Optional)

```bash
pnpm add @vercel/analytics
```

Add to `src/app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// In return statement
<Analytics />
```

### Enable Vercel Speed Insights (Optional)

```bash
pnpm add @vercel/speed-insights
```

Add to `src/app/layout.tsx`:
```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

// In return statement
<SpeedInsights />
```

### Image Optimization

Images are automatically optimized by Next.js Image component. Verify in production:
- WebP format served to supported browsers
- Responsive images with srcset
- Lazy loading enabled

## Step 10: Monitoring & Maintenance

### Error Tracking (Recommended)

Add Sentry for production error monitoring:

```bash
pnpm add @sentry/nextjs
```

### Database Backups

**Vercel Postgres**: Automatic daily backups
**Neon**: Configure backup schedule in console

### Regular Maintenance Tasks

```bash
# Weekly: Check for duplicate items
pnpm run content:dedupe

# Monthly: Regenerate covers if needed
pnpm run covers:repair

# As needed: Import new content
pnpm run content:ingest
```

## Troubleshooting

### Common Issues

**Issue**: OAuth redirect_uri_mismatch
- **Fix**: Verify Google Console redirect URIs exactly match production domain

**Issue**: Stripe webhook signature verification failed
- **Fix**: Ensure `STRIPE_WEBHOOK_SECRET` matches webhook endpoint in Stripe Dashboard

**Issue**: Database connection timeout
- **Fix**: Check `POSTGRES_URL` format and database is accessible from Vercel

**Issue**: PDF/Audio files not loading
- **Fix**: Verify files exist in `public/media/` or update URLs if using external storage

**Issue**: Rate limit errors
- **Fix**: Use `RATE_LIMIT_BYPASS_SECRET` header for internal testing

## Rollback Procedure

If issues occur in production:

1. **Instant Rollback** (Vercel):
   - Go to Deployments → Select previous deployment → Promote to Production

2. **Database Rollback**:
   ```bash
   # Restore from backup
   # Vercel Postgres: Use dashboard restore feature
   # Neon: Restore from point-in-time recovery
   ```

3. **Verify Health**:
   - Check `/api/health` endpoint
   - Test authentication flow
   - Verify subscription creation

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Stripe Docs**: https://stripe.com/docs/api
- **Drizzle ORM**: https://orm.drizzle.team/docs

## Production Checklist Summary

Before going live, verify:

- [ ] Database migrations applied
- [ ] All environment variables configured
- [ ] Google OAuth redirect URIs updated
- [ ] Stripe webhooks configured
- [ ] Media files accessible
- [ ] Health endpoint responding
- [ ] Authentication flow working
- [ ] Subscription creation working
- [ ] Mobile responsiveness verified
- [ ] Security headers active
- [ ] Rate limiting tested
- [ ] Error monitoring configured (optional)
- [ ] Domain DNS configured
- [ ] SSL certificate active

---

**Ready to deploy!** 🚀

After completing all steps, your production URL will be: `https://yourdomain.com`
