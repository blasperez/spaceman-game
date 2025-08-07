-- Add birthdate column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'birthdate'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN birthdate DATE;
  END IF;
END $$;

-- Update the handle_new_user function to preserve birthdate from Google metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    provider,
    balance,
    birthdate
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.app_metadata->>'provider', 'google'),
    1000.00,
    (NEW.raw_user_meta_data->>'birthdate')::DATE
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    balance = COALESCE(profiles.balance, 1000.00),
    birthdate = COALESCE(EXCLUDED.birthdate, profiles.birthdate);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;