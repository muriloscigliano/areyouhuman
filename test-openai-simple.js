// Simple OpenAI test
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('\n🧪 Testing OpenAI Integration...\n');

const apiKey = process.env.OPENAI_API_KEY;

// Test 1: Check configuration
console.log('📋 Test 1: Configuration Check');
if (!apiKey || apiKey.includes('placeholder')) {
  console.log('❌ OpenAI API key not configured');
  console.log('   Check .env file\n');
  process.exit(1);
}

console.log('✅ API key found');
console.log(`   Key: ${apiKey.substring(0, 25)}...`);

// Test 2: Make API call
console.log('\n📋 Test 2: API Call Test');
console.log('   Sending test message...');

const openai = new OpenAI({ apiKey });

try {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'You are a helpful automation consultant.' 
      },
      { 
        role: 'user', 
        content: 'Hi, my name is John. I run a small business.' 
      }
    ],
    max_tokens: 100
  });

  const response = completion.choices[0].message.content;
  
  console.log('\n✅ SUCCESS! OpenAI is working!\n');
  console.log('   AI Response:');
  console.log(`   "${response}"\n`);
  console.log('🎉 Your AI chat is fully operational!\n');
  console.log('💡 Go to http://localhost:4321 and start chatting!\n');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  
  if (error.code === 'insufficient_quota') {
    console.log('\n💡 Solution: Add billing/credits at https://platform.openai.com/settings/organization/billing\n');
  } else if (error.status === 401) {
    console.log('\n💡 Solution: Invalid API key. Get a new one at https://platform.openai.com/api-keys\n');
  } else {
    console.log('\n💡 Check: https://platform.openai.com for status\n');
  }
  
  process.exit(1);
}

