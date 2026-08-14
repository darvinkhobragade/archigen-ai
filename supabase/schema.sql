-- =======================================================
-- ARCHIGEN AI - COMPLETE SUPABASE DATABASE SCHEMA
-- Copy and run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tiwbuodgdxctsvtjyhxi/sql/new
-- =======================================================

-- 1. Create Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);


-- 2. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Architecture',
  description TEXT,
  cover_url TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;
CREATE POLICY "Users can manage their own projects" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);


-- 3. Create Generations Table
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  tool TEXT NOT NULL,
  prompt TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_path TEXT,
  plan_data JSONB,
  credits_spent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'complete',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own generations" ON public.generations;
CREATE POLICY "Users can manage their own generations" ON public.generations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS generations_user_id_idx ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS generations_project_id_idx ON public.generations(project_id);


-- 4. Create Credit Transactions Table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own credit history" ON public.credit_transactions;
CREATE POLICY "Users can view their own credit history" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON public.credit_transactions(user_id);


-- 5. Automatic updated_at Function & Triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS projects_set_updated_at ON public.projects;
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 6. Automatic User Sign-Up Trigger Function
-- Automatically creates a profile record and grants 20 welcome credits when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    20
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  INSERT INTO public.credit_transactions (user_id, amount, reason)
  VALUES (NEW.id, 20, 'Welcome bonus')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 7. Credit Operations (RPC Functions)
CREATE OR REPLACE FUNCTION public.spend_credits(_cost integer, _reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _left integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _cost IS NULL OR _cost < 0 THEN
    RAISE EXCEPTION 'Invalid credit cost';
  END IF;

  UPDATE public.profiles
     SET credits = credits - _cost
   WHERE id = _uid AND credits >= _cost
   RETURNING credits INTO _left;

  IF _left IS NULL THEN
    RAISE EXCEPTION 'Not enough credits';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason)
  VALUES (_uid, -_cost, COALESCE(_reason, 'generation'));

  RETURN _left;
END;
$$;

REVOKE ALL ON FUNCTION public.spend_credits(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_credits(integer, text) TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.refund_credits(_amount integer, _reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _left integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Invalid refund amount';
  END IF;

  UPDATE public.profiles
     SET credits = credits + _amount
   WHERE id = _uid
   RETURNING credits INTO _left;

  INSERT INTO public.credit_transactions (user_id, amount, reason)
  VALUES (_uid, _amount, COALESCE(_reason, 'refund'));

  RETURN _left;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_credits(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_credits(integer, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;


-- 8. Storage Bucket & Storage RLS Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('renders', 'renders', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can read their own renders" ON storage.objects;
CREATE POLICY "Users can read their own renders" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'renders' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own renders" ON storage.objects;
CREATE POLICY "Users can upload their own renders" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'renders' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own renders" ON storage.objects;
CREATE POLICY "Users can update their own renders" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'renders' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own renders" ON storage.objects;
CREATE POLICY "Users can delete their own renders" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'renders' AND auth.uid()::text = (storage.foldername(name))[1]);
