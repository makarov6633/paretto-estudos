Personal Playlists & Progress TODO
=================================

- [ ] Model personal playlists and favorites
  - Create tables to store per-user reading lists (consumed, favorites, in_progress)
  - Expose CRUD APIs to add/remove entries and return hydrated lists on login
  - Update UI (library, item page) to allow favoriting and to show saved items

- [ ] Sync favorites and history across devices
  - Wire auth session into new services so reads/writes persist for authenticated users
  - Add background jobs or cached queries to hydrate library/dashboard quickly
  - Integrate telemetry events so the 5-itens/month limit uses the same data source

- [ ] Persist and resume reading/audio progress
  - Capture playback position (ms) and scroll/section index on pause, exit, or interval
  - Store progress per user/item and restore on load for both text and audio modes
  - Provide UI affordances (e.g., "Retomar de onde parei")

- [ ] Ensure word-level sync coverage
  - Automate WhisperX alignment pipeline (`scripts/align_word_sync.py`) as part of ingestion
  - Validate every `audio_track` has an associated `sync_map` row before publishing
  - Handle missing sync data gracefully in player (fallback UI states)

