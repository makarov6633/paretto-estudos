CREATE TABLE "badge_definition" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"requirement" jsonb NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"rarity" text DEFAULT 'common' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"referenceId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_progress" (
	"userId" text NOT NULL,
	"itemId" text NOT NULL,
	"scrollProgress" integer DEFAULT 0 NOT NULL,
	"currentSectionIndex" integer DEFAULT 0 NOT NULL,
	"lastReadAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_progress_userId_itemId_pk" PRIMARY KEY("userId","itemId")
);
--> statement-breakpoint
CREATE TABLE "user_badge" (
	"userId" text NOT NULL,
	"badgeId" text NOT NULL,
	"earnedAt" timestamp DEFAULT now() NOT NULL,
	"seen" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_badge_userId_badgeId_pk" PRIMARY KEY("userId","badgeId")
);
--> statement-breakpoint
CREATE TABLE "user_gamification" (
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
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_checklist_progress" ADD CONSTRAINT "user_checklist_progress_userId_checklistId_pk" PRIMARY KEY("userId","checklistId");--> statement-breakpoint
ALTER TABLE "point_transaction" ADD CONSTRAINT "point_transaction_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_itemId_item_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badge" ADD CONSTRAINT "user_badge_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badge" ADD CONSTRAINT "user_badge_badgeId_badge_definition_id_fk" FOREIGN KEY ("badgeId") REFERENCES "public"."badge_definition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gamification" ADD CONSTRAINT "user_gamification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_checklist_progress" DROP COLUMN "id";