-- Items
CREATE TABLE IF NOT EXISTS "item" (
  "id" text PRIMARY KEY,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "author" text NOT NULL,
  "language" text NOT NULL DEFAULT 'pt-BR',
  "coverImageUrl" text,
  "pdfUrl" text,
  "hasAudio" boolean NOT NULL DEFAULT false,
  "hasPdf" boolean NOT NULL DEFAULT false,
  "tags" jsonb,
  "readingMinutes" integer,
  "audioMinutes" integer,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Summary sections
CREATE TABLE IF NOT EXISTS "summary_section" (
  "id" text PRIMARY KEY,
  "itemId" text NOT NULL REFERENCES "item"("id") ON DELETE CASCADE,
  "orderIndex" integer NOT NULL,
  "heading" text,
  "contentHtml" text
);

-- Audio tracks
CREATE TABLE IF NOT EXISTS "audio_track" (
  "id" text PRIMARY KEY,
  "itemId" text NOT NULL REFERENCES "item"("id") ON DELETE CASCADE,
  "voice" text,
  "language" text,
  "audioUrl" text NOT NULL,
  "durationMs" integer
);

-- Sync maps
CREATE TABLE IF NOT EXISTS "sync_map" (
  "id" text PRIMARY KEY,
  "itemId" text NOT NULL REFERENCES "item"("id") ON DELETE CASCADE,
  "granularity" text,
  "data" jsonb
);


