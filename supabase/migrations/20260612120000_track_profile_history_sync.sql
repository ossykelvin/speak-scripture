ALTER TABLE public.profiles
ADD COLUMN history_migrated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_history_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN history_entry_count INTEGER NOT NULL DEFAULT 0
  CHECK (history_entry_count >= 0);

COMMENT ON COLUMN public.profiles.history_migrated_at IS
  'Most recent successful import of legacy device-local history into the user profile.';

COMMENT ON COLUMN public.profiles.last_history_sync_at IS
  'Most recent successful synchronization between local history and Supabase.';

COMMENT ON COLUMN public.profiles.history_entry_count IS
  'Number of retained history entries reported by the most recent successful sync.';
