const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Auth Configuration Test');
console.log('=====================================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log(`VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Present' : '❌ Missing'}`);
console.log(`VITE_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Present' : '❌ Missing'}`);
console.log(`VITE_GOOGLE_CLIENT_ID: ${process.env.VITE_GOOGLE_CLIENT_ID ? '✅ Present' : '❌ Missing'}`);
console.log(`VITE_GOOGLE_CLIENT_SECRET: ${process.env.VITE_GOOGLE_CLIENT_SECRET ? '✅ Present' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing required Supabase environment variables!');
  console.log('\n💡 Create a .env.local file with:');
  console.log('VITE_SUPABASE_URL=https://lcpsoyorsaevkabvanrw.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your_anon_key_here');
  console.log('VITE_GOOGLE_CLIENT_ID=946065921846-gr94a4clm5crfri3js950v5hgtargd4h.apps.googleusercontent.com');
  console.log('VITE_GOOGLE_CLIENT_SECRET=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');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log('\n🔗 Testing Supabase connection...');
    
    // Test basic connection - try to get auth config instead of profiles
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

async function checkSupabaseAuthSettings() {
  console.log('\n⚙️ Required Supabase Auth Settings:');
  console.log('=====================================');
  console.log('Go to: https://supabase.com/dashboard/project/lcpsoyorsaevkabvanrw/auth/url-configuration');
  console.log('');
  console.log('1. Site URL: https://spaceman-game-production.up.railway.app');
  console.log('2. Redirect URLs (add these):');
  console.log('   - https://spaceman-game-production.up.railway.app/auth/callback');
  console.log('   - http://localhost:8081/auth/callback');
  console.log('');
  console.log('Go to: https://supabase.com/dashboard/project/lcpsoyorsaevkabvanrw/auth/providers');
  console.log('');
  console.log('3. Enable Google OAuth Provider:');
  console.log('   - Client ID: 946065921846-gr94a4clm5crfri3js950v5hgtargd4h.apps.googleusercontent.com');
  console.log('   - Client Secret: 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');
  console.log('');
  console.log('4. In Google Cloud Console:');
  console.log('   https://console.cloud.google.com/apis/credentials/oauthclient/946065921846-gr94a4clm5crfri3js950v5hgtargd4h.apps.googleusercontent.com?project=spaceman-464912');
  console.log('   Add redirect URIs:');
  console.log('   - https://lcpsoyorsaevkabvanrw.supabase.co/auth/v1/callback');
  console.log('   - https://spaceman-game-production.up.railway.app/auth/callback');
}

async function testGoogleOAuthRedirect() {
  try {
    console.log('\n🔐 Testing Google OAuth redirect...');
    
    // Just check if we can construct the OAuth URL
    const response = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://spaceman-game-production.up.railway.app/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    if (response.error) {
      console.error('❌ Google OAuth error:', response.error.message);
      
      if (response.error.message.includes('redirect_uri_mismatch')) {
        console.log('\n💡 Solution: The redirect URI is not configured properly');
        console.log('   Check Google Cloud Console and Supabase settings above');
      } else if (response.error.message.includes('invalid_client')) {
        console.log('\n💡 Solution: Google OAuth credentials are not set in Supabase');
      }
      
      return false;
    }
    
    console.log('✅ Google OAuth configuration appears valid');
    console.log('   (Would redirect to:', response.data?.url ? 'Google OAuth' : 'Unknown');
    return true;
  } catch (error) {
    console.error('❌ Google OAuth test error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Supabase Auth Configuration Check...\n');
  
  const connectionOk = await testSupabaseConnection();
  const oauthOk = await testGoogleOAuthRedirect();
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`Supabase Connection: ${connectionOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Google OAuth Setup: ${oauthOk ? '✅ PASS' : '❌ FAIL'}`);
  
  await checkSupabaseAuthSettings();
  
  if (!connectionOk || !oauthOk) {
    console.log('\n🛠️ Next Steps:');
    console.log('1. Fix the configuration issues shown above');
    console.log('2. Make sure redirect URIs match EXACTLY');
    console.log('3. Test again with: node test-supabase-auth.cjs');
    console.log('4. Try the Google login in your app');
  } else {
    console.log('\n🎉 Configuration looks good!');
    console.log('If you still have issues, check the browser console for specific errors.');
  }
}

runTests().catch(console.error);