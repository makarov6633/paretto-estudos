import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL not found in environment");
}

const sql = postgres(connectionString);

async function applyGamificationMigration() {
  console.log("🎮 Applying gamification migration...");
  
  try {
    // Create user_gamification table
    await sql`
      CREATE TABLE IF NOT EXISTS "user_gamification" (
        "userId" text PRIMARY KEY NOT NULL,
        "totalPoints" integer DEFAULT 0 NOT NULL,
        "currentStreak" integer DEFAULT 0 NOT NULL,
        "longestStreak" integer DEFAULT 0 NOT NULL,
        "lastStudyDate" timestamp,
        "level" integer DEFAULT 1 NOT NULL,
        "quizzesCompleted" integer DEFAULT 0 NOT NULL,
        "checklistsCompleted" integer DEFAULT 0 NOT NULL,
        "notesCreated" integer DEFAULT 0 NOT NULL,
        "itemsRead" integer DEFAULT 0 NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "user_gamification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action
      )
    `;
    console.log("✓ Created user_gamification table");

    // Create badge_definition table
    await sql`
      CREATE TABLE IF NOT EXISTS "badge_definition" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text NOT NULL,
        "icon" text NOT NULL,
        "category" text NOT NULL,
        "requirement" jsonb NOT NULL,
        "points" integer DEFAULT 0 NOT NULL,
        "rarity" text DEFAULT 'common' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log("✓ Created badge_definition table");

    // Create user_badge table
    await sql`
      CREATE TABLE IF NOT EXISTS "user_badge" (
        "userId" text NOT NULL,
        "badgeId" text NOT NULL,
        "earnedAt" timestamp DEFAULT now() NOT NULL,
        "seen" boolean DEFAULT false NOT NULL,
        CONSTRAINT "user_badge_userId_badgeId_pk" PRIMARY KEY("userId","badgeId"),
        CONSTRAINT "user_badge_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action,
        CONSTRAINT "user_badge_badgeId_badge_definition_id_fk" FOREIGN KEY ("badgeId") REFERENCES "badge_definition"("id") ON DELETE cascade ON UPDATE no action
      )
    `;
    console.log("✓ Created user_badge table");

    // Create point_transaction table
    await sql`
      CREATE TABLE IF NOT EXISTS "point_transaction" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL,
        "points" integer NOT NULL,
        "reason" text NOT NULL,
        "referenceId" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "point_transaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action
      )
    `;
    console.log("✓ Created point_transaction table");

    console.log("\n✅ Gamification tables created successfully!");
  } catch (error) {
    console.error("❌ Error applying gamification migration:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyGamificationMigration();
