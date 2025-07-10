const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://spaceman-game-production.up.railway.app';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔗 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('⏳ Testing connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      
      // Try to get table info
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'profiles' });
      
      if (tableError) {
        console.log('❌ Table info failed:', tableError.message);
      } else {
        console.log('✅ Table info:', tableInfo);
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Profiles table accessible');
      console.log('📋 Sample data:', data);
    }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error);
  }
}

testConnection();