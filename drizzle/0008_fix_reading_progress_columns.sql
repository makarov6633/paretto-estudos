-- Fix reading_progress table columns to use snake_case
-- This migration renames camelCase columns to snake_case

-- Check if the table exists with camelCase columns and rename them
DO $$
BEGIN
    -- Rename userId to user_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'userId'
    ) THEN
        ALTER TABLE "reading_progress" RENAME COLUMN "userId" TO "user_id";
    END IF;

    -- Rename itemId to item_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'itemId'
    ) THEN
        ALTER TABLE "reading_progress" RENAME COLUMN "itemId" TO "item_id";
    END IF;

    -- Rename scrollProgress to scroll_progress if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'scrollProgress'
    ) THEN
        ALTER TABLE "reading_progress" RENAME COLUMN "scrollProgress" TO "scroll_progress";
    END IF;

    -- Rename currentSectionIndex to current_section_index if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'currentSectionIndex'
    ) THEN
        ALTER TABLE "reading_progress" RENAME COLUMN "currentSectionIndex" TO "current_section_index";
    END IF;

    -- Rename lastReadAt to last_read_at if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'lastReadAt'
    ) THEN
        ALTER TABLE "reading_progress" RENAME COLUMN "lastReadAt" TO "last_read_at";
    END IF;

    -- Rename updatedAt to updated_at if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reading_progress' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "reading_progress" RENAME COLUMN "updatedAt" TO "updated_at";
    END IF;
END $$;
