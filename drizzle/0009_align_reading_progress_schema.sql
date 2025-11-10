-- Align reading_progress table with current schema expectations
-- This adds missing columns and renames existing ones

DO $$
BEGIN
    -- Rename audioTimeMs to scroll_progress if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'audioTimeMs'
    ) THEN
        ALTER TABLE "reading_progress" RENAME COLUMN "audioTimeMs" TO "scroll_progress";
        ALTER TABLE "reading_progress" ALTER COLUMN "scroll_progress" SET DEFAULT 0;
    END IF;

    -- Rename scrollPosition to scroll_progress if it exists (alternative)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'scrollPosition'
    ) THEN
        ALTER TABLE "reading_progress" DROP COLUMN "scrollPosition";
    END IF;

    -- Add scroll_progress if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'scroll_progress'
    ) THEN
        ALTER TABLE "reading_progress" ADD COLUMN "scroll_progress" integer DEFAULT 0 NOT NULL;
    END IF;

    -- Rename currentSection to current_section_index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'currentSection'
    ) THEN
        ALTER TABLE "reading_progress" RENAME COLUMN "currentSection" TO "current_section_index";
        ALTER TABLE "reading_progress" ALTER COLUMN "current_section_index" SET DEFAULT 0;
    END IF;

    -- Add current_section_index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'current_section_index'
    ) THEN
        ALTER TABLE "reading_progress" ADD COLUMN "current_section_index" integer DEFAULT 0 NOT NULL;
    END IF;

    -- Add last_read_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'last_read_at'
    ) THEN
        ALTER TABLE "reading_progress" ADD COLUMN "last_read_at" timestamp DEFAULT now() NOT NULL;
    END IF;

    -- Remove id column if it exists (we use composite primary key)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'id'
    ) THEN
        -- First drop the primary key constraint
        ALTER TABLE "reading_progress" DROP CONSTRAINT IF EXISTS reading_progress_pkey;
        -- Drop the id column
        ALTER TABLE "reading_progress" DROP COLUMN "id";
        -- Add new composite primary key
        ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_item_id_pk" PRIMARY KEY ("user_id", "item_id");
    END IF;
END $$;
