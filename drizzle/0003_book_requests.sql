-- Book request feature: one pending request per user at a time
CREATE TABLE IF NOT EXISTS "book_request" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "author" text,
  "sourceUrl" text,
  "notes" text,
  "status" text NOT NULL DEFAULT 'pending',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Ensure at most one pending request per user
CREATE UNIQUE INDEX IF NOT EXISTS book_request_one_pending
ON "book_request" ("userId") WHERE status = 'pending';

