-- Drop sync_map table
DROP TABLE IF EXISTS "sync_map" CASCADE;

-- Drop audio_track table  
DROP TABLE IF EXISTS "audio_track" CASCADE;

-- Remove audio-related columns from item table
ALTER TABLE "item" DROP COLUMN IF EXISTS "hasAudio";
ALTER TABLE "item" DROP COLUMN IF EXISTS "audioMinutes";
