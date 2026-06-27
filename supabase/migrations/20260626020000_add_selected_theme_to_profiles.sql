ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS selected_theme TEXT NOT NULL DEFAULT 'light';

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_selected_theme_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_selected_theme_check
CHECK (selected_theme IN ('light', 'dark', 'luminous-night', 'monochrome-slate', 'cedar-grove', 'verdant-canopy'));
