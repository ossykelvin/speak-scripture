CREATE TABLE public.search_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  searched_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0 CHECK (duration >= 0),
  scripture_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  failed_searches INTEGER NOT NULL DEFAULT 0 CHECK (failed_searches >= 0),
  source TEXT CHECK (source IN ('microphone', 'manual')),
  query TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX search_history_user_date_idx
ON public.search_history (user_id, searched_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history"
ON public.search_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history"
ON public.search_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search history"
ON public.search_history FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
ON public.search_history FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_search_history_updated_at
BEFORE UPDATE ON public.search_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
