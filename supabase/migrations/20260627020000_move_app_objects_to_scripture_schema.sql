CREATE SCHEMA IF NOT EXISTS scripture;

GRANT USAGE ON SCHEMA scripture TO anon, authenticated, service_role;

DO $$
BEGIN
  IF to_regprocedure('public.update_updated_at_column()') IS NOT NULL THEN
    ALTER FUNCTION public.update_updated_at_column() SET SCHEMA scripture;
  END IF;

  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    ALTER FUNCTION public.handle_new_user() SET SCHEMA scripture;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL AND to_regclass('scripture.profiles') IS NULL THEN
    ALTER TABLE public.profiles SET SCHEMA scripture;
  END IF;

  IF to_regclass('public.search_history') IS NOT NULL AND to_regclass('scripture.search_history') IS NULL THEN
    ALTER TABLE public.search_history SET SCHEMA scripture;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION scripture.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = scripture, public
AS $$
BEGIN
  INSERT INTO scripture.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION scripture.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = scripture, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION scripture.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON scripture.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON scripture.profiles
FOR EACH ROW
EXECUTE FUNCTION scripture.update_updated_at_column();

DROP TRIGGER IF EXISTS update_search_history_updated_at ON scripture.search_history;
CREATE TRIGGER update_search_history_updated_at
BEFORE UPDATE ON scripture.search_history
FOR EACH ROW
EXECUTE FUNCTION scripture.update_updated_at_column();

ALTER TABLE scripture.search_history REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'scripture'
      AND tablename = 'search_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE scripture.search_history;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA scripture TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA scripture TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA scripture TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA scripture TO authenticated, service_role;
