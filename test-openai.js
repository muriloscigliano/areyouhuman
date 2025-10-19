// Quick test to verify OpenAI is configured and working
import { isOpenAIConfigured, getChatCompletion } from './src/lib/openai.ts';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('\n🧪 Testing OpenAI Integration...\n');

// Test 1: Check if configured
console.log('📋 Test 1: Configuration Check');
const configured = isOpenAIConfigured();
console.log(`   OpenAI Configured: ${configured ? '✅ YES' : '❌ NO'}`);

if (!configured) {
  console.log('\n❌ OpenAI is NOT configured');
  console.log('   Check your .env file has OPENAI_API_KEY=sk-...\n');
  process.exit(1);
}

console.log(`   API Key: ${process.env.OPENAI_API_KEY?.substring(0, 20)}...`);

// Test 2: Make a real API call
console.log('\n📋 Test 2: API Call Test');
console.log('   Sending test message to OpenAI...');

try {
  const response = await getChatCompletion([
    { role: 'user', content: 'Hi, my name is John' }
  ]);
  
  console.log('\n✅ OpenAI is working!');
  console.log(`   Response: "${response}"`);
  console.log('\n🎉 Success! Your AI is live and responding!\n');
  
} catch (error) {
  console.error('\n❌ OpenAI API Error:', error.message);
  console.log('\n💡 Common issues:');
  console.log('   1. Invalid API key');
  console.log('   2. No billing set up (add credit card at platform.openai.com)');
  console.log('   3. Rate limits exceeded\n');
  process.exit(1);
}

