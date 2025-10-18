// Quick test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🧪 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials in .env file');
  console.log('Please add:');
  console.log('  PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co');
  console.log('  PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...');
  process.exit(1);
}

if (supabaseUrl.includes('placeholder')) {
  console.error('❌ Please update .env with real Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
try {
  const { data, error } = await supabase.from('leads').select('count');
  
  if (error) {
    console.error('❌ Database error:', error.message);
    console.log('\n📋 Did you run the SQL schema?');
    console.log('   Go to Supabase → SQL Editor → Run supabase-schema.sql');
    process.exit(1);
  }
  
  console.log('✅ Supabase connected successfully!');
  console.log('✅ Database table exists!');
  console.log(`✅ URL: ${supabaseUrl}`);
  console.log('\n🎉 Ready to go! Run: npm run dev\n');
  
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
}

