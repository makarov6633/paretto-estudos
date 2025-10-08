# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Paretto Estudos is a Next.js 15 web application for studying summaries with PDF and audio playback, featuring Google authentication, Stripe subscriptions (monthly R$ 15), and advanced audio-text word-level synchronization using WhisperX.

**Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Better Auth, Stripe, Vercel AI SDK.

## Development Commands

### Core Development
- **Install dependencies**: `pnpm install`
- **Dev server**: `pnpm dev` (uses Turbopack)
- **Build**: `pnpm build`
- **Production**: `pnpm start`
- **Lint**: `pnpm run lint`
- **Type check**: `pnpm run typecheck`
- **NEVER start the dev server yourself** - if you need terminal output, ask the user to provide it

### Testing
- **Run tests**: `pnpm test`
- **Test UI**: `pnpm test:ui`
- **Single run**: `pnpm test:run`
- **Coverage**: `pnpm test:coverage`

### Database (Drizzle)
- **Generate migrations**: `pnpm run db:generate`
- **Run migrations**: `pnpm run db:migrate`
- **Push schema**: `pnpm run db:push`
- **Studio UI**: `pnpm run db:studio`
- **Dev push**: `pnpm run db:dev`
- **Reset DB**: `pnpm run db:reset`

### Content Management Scripts
- **Import content**: `pnpm run content:import`
- **Generate items from media**: `pnpm run content:gen`
- **Enrich items**: `pnpm run content:enrich`
- **Dedupe**: `pnpm run content:dedupe`
- **Auto pipeline**: `pnpm run content:auto` (enrich + dedupe + themed covers)
- **Ingest from folder**: `pnpm run content:ingest`
- **Generate covers**: `pnpm run covers:gen`
- **Repair covers**: `pnpm run covers:repair`
- **Themed covers**: `pnpm run covers:themed`
- **Normalize titles**: `pnpm run titles:normalize`
- **Remove item**: `pnpm run remove:item`

### Audio/Sync
- **Fill audio durations**: `pnpm run audio:durations`
- **Generate sync maps (mock)**: `pnpm run sync:gen`
- **Word-level alignment (WhisperX)**: `pnpm run sync:align`

### Code Quality
- **CSS lint**: `pnpm run lint:css`
- **CSS lint fix**: `pnpm run lint:css:fix`
- **Qlty code check**: `.tools/qlty/qlty.exe check --no-upgrade-check --summary src scripts examples`
- **Gitleaks secrets**: `.tools/qlty/qlty.exe check --no-upgrade-check --summary --filter gitleaks src scripts examples`

## Architecture

### Database Schema (`src/lib/schema.ts`)
Core tables organized by domain:

**Auth (Better Auth)**:
- `user`: id, name, email, image, timestamps
- `session`: token-based sessions with user reference
- `account`: OAuth provider accounts (Google)
- `verification`: email/phone verification

**Content**:
- `item`: Main content entity (id, slug, title, author, language, coverImageUrl, pdfUrl, hasAudio, hasPdf, tags, readingMinutes, audioMinutes)
- `summarySection`: Ordered sections per item (id, itemId, orderIndex, heading, contentHtml)
- `audioTrack`: Audio files per item (id, itemId, voice, language, audioUrl, durationMs)
- `syncMap`: Audio-text synchronization data (id, itemId, granularity: 'line'|'word', data: jsonb)

**Personalization**:
- `userPreference`: Tag-based preferences (userId, tag, weight)
- `readingEvent`: User activity tracking (userId, itemId, event: 'open'|'play'|'finish')
- `bookRequest`: User book requests (userId, title, author, sourceUrl, notes, status)

**Subscriptions**:
- `subscription`: Stripe subscriptions (userId, status, currentPeriodEnd, stripeCustomerId, stripeSubscriptionId) - unique per user

### Authentication (`src/lib/auth.ts`)
- Uses Better Auth with Drizzle adapter
- Google OAuth provider (requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- Session handling via `/api/auth/get-session`
- Session memoization pattern in server actions (5s cache)

### Stripe Integration
- **Checkout**: `src/app/plans/actions.ts` - `createCheckoutSession()` creates monthly subscription (R$ 15.00)
- **Webhook**: `src/app/api/stripe/webhook/route.ts` - handles subscription lifecycle events
- **Billing Portal**: `openBillingPortal()` - customer self-service
- **Dev workflow**: Use Stripe CLI: `stripe listen --forward-to http://localhost:3000/api/stripe/webhook`

### Access Control (`src/app/api/access/check/route.ts`)
- **Premium**: Active subscription with valid period
- **Free tier**: 5 distinct items per calendar month (tracked via `readingEvent`)
- Returns: `{allowed: boolean, reason: 'premium'|'free'|'limit'|'unauthorized'}`

### Security (`src/middleware.ts`, `next.config.ts`)
- **Rate limiting**: In-memory per-IP limits by route group (admin: 10/min, chat: 5/min, takedown: 3/min, API: 30/min, pages: 100/min)
- **CSP**: Strict Content-Security-Policy with allowed domains for images/fonts
- **Headers**: X-Frame-Options, X-Content-Type-Options, HSTS (production), Permissions-Policy
- **Bypass**: `x-rate-limit-bypass` header with `RATE_LIMIT_BYPASS_SECRET`

### Audio-Text Synchronization
Two modes:

**1. Mock/Fallback (`sync:gen`)**:
- JavaScript-based word splitting
- Even time distribution
- Stored with `granularity: "word"`

**2. WhisperX Real Alignment (`sync:align`)**:
- **Script**: `scripts/align_word_sync.py`
- **Requirements**: Python 3.10+, ffmpeg, torch/torchaudio, whisperx, psycopg2-binary
- **Process**: Transcribes audio (pt-BR), aligns word boundaries with millisecond precision
- **Output**: `{t: ms, i: sectionIndex, w: wordIndex}` points in `sync_map.data`
- **Reader UI**: `src/app/item/[slug]/read/page.tsx` highlights words in real-time

### Environment Variables
**Required for dev**:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Database & Auth**:
```
POSTGRES_URL=postgres://user:pass@host:5432/db
BETTER_AUTH_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
```

**Stripe**:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Optional**:
```
RATE_LIMIT_BYPASS_SECRET=<for-internal-testing>
OPENAI_API_KEY=<for-chat-features>
```

## Styling Guidelines
- **Always use standard Tailwind and shadcn/ui colors, styles, and tokens**
- **NEVER use custom colors unless explicitly instructed**
- Mobile-first responsive design
- Dark mode via `next-themes`

## Key Routes
- `/` - Homepage
- `/library` - Browse summaries (optimized first batch loading)
- `/item/[slug]/read` - Reader with PDF/audio/sync
- `/chat` - AI chat interface
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/plans` - Subscription plans
- `/requests` - Book requests

## Testing & Quality
- **Always run lint and typecheck after completing changes** (per CLAUDE.md project instructions)
- Vitest for unit testing
- Stylelint for CSS
- Qlty for code quality and security scanning
