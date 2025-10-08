-- Personalization tables
CREATE TABLE IF NOT EXISTS "user_preference" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "tag" text NOT NULL,
  "weight" integer NOT NULL DEFAULT 0,
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_pref_unique ON "user_preference" ("userId", "tag");

CREATE TABLE IF NOT EXISTS "reading_event" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "itemId" text NOT NULL REFERENCES "item"("id") ON DELETE CASCADE,
  "event" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

