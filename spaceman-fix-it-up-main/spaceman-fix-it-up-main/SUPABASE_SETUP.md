# Supabase Setup for Spaceman Casino

## 1. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

## 2. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Database Setup

### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `supabase/migrations/001_create_user_profiles.sql`

### Option B: Using Supabase CLI

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your_project_ref`
4. Run migrations: `supabase db push`

## 4. Authentication Setup

### Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set Application Type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
7. Copy Client ID and Client Secret

### Configure in Supabase

1. Go to Authentication → Settings → Auth Providers
2. Enable Google provider
3. Add your Google Client ID and Client Secret
4. Save changes

## 5. Row Level Security (RLS)

The migration file includes RLS policies that ensure:
- Users can only view and update their own profile
- New users automatically get a profile created
- All casino-specific fields are properly secured

## 6. Testing the Setup

1. Start your development server: `npm run dev`
2. Try logging in with Google
3. Check that a user profile is created in the database
4. Verify that the casino-specific fields are initialized

## 7. Production Deployment

For production deployment to Railway:

1. Set environment variables in Railway dashboard
2. Ensure your Supabase project is in the same region as your Railway app
3. Update Google OAuth redirect URIs to include your production domain
4. Run the database migration in production

## 8. Important Security Notes

- All user data is protected by RLS policies
- KYC verification is required for withdrawals
- Balance and transaction limits are enforced
- Demo mode is available for testing without real money

## 9. Database Schema

The `user_profiles` table includes:

- **Basic Info**: id, email, full_name, avatar_url, provider
- **Financial**: balance, deposit_limit, withdrawal_limit
- **Casino Stats**: total_deposits, total_withdrawals, games_played, total_wagered, total_won
- **KYC**: age, country, phone, kyc_verified
- **Methods**: withdrawal_methods (JSONB array)

## 10. Troubleshooting

### Common Issues:

1. **Google OAuth not working**: Check redirect URIs and client credentials
2. **User profile not created**: Verify the trigger function is working
3. **RLS blocking queries**: Ensure user is authenticated
4. **Environment variables**: Double-check VITE_ prefixes

### Debug Commands:

```sql
-- Check if user profile exists
SELECT * FROM user_profiles WHERE id = 'user-uuid';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Test trigger function
SELECT handle_new_user();
```