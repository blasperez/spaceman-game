/*
  # Initial Schema for Spaceman Game

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `balance` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `provider` (text, default 'google')
      - `age` (integer, nullable)
      - `country` (text, nullable)
      - `phone` (text, nullable)
      - `kyc_verified` (boolean, default false)
      - `withdrawal_methods` (jsonb, default '[]')
      - `deposit_limit` (numeric, default 1000)
      - `withdrawal_limit` (numeric, default 1000)
      - `total_deposits` (numeric, default 0)
      - `total_withdrawals` (numeric, default 0)
      - `games_played` (integer, default 0)
      - `total_wagered` (numeric, default 0)
      - `total_won` (numeric, default 0)
    
    - `game_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `game_id` (text)
      - `bet_amount` (numeric)
      - `multiplier` (numeric)
      - `win_amount` (numeric)
      - `created_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text, 'deposit' or 'withdrawal')
      - `amount` (numeric)
      - `status` (text, 'pending', 'completed', 'failed')
      - `payment_method` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create profiles table with all casino fields
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  balance numeric DEFAULT 1000.00 CHECK (balance >= 0),
  provider text DEFAULT 'google',
  age integer,
  country text,
  phone text,
  kyc_verified boolean DEFAULT false,
  withdrawal_methods jsonb DEFAULT '[]',
  deposit_limit numeric DEFAULT 1000.00,
  withdrawal_limit numeric DEFAULT 1000.00,
  total_deposits numeric DEFAULT 0.00,
  total_withdrawals numeric DEFAULT 0.00,
  games_played integer DEFAULT 0,
  total_wagered numeric DEFAULT 0.00,
  total_won numeric DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_history table
CREATE TABLE IF NOT EXISTS game_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  game_id text NOT NULL,
  bet_amount numeric NOT NULL CHECK (bet_amount > 0),
  multiplier numeric NOT NULL CHECK (multiplier >= 0),
  win_amount numeric NOT NULL CHECK (win_amount >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Game history policies
CREATE POLICY "Users can read own game history"
  ON game_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game history"
  ON game_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'provider', 'google')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
