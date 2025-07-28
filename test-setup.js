require('dotenv').config();

console.log('✅ dotenv loaded');
console.log('✅ API Key present:', !!process.env.OPENAI_API_KEY);

try {
  const OpenAI = require('openai');
  console.log('✅ OpenAI package loaded');
  
  const cheerio = require('cheerio');
  console.log('✅ Cheerio loaded');
  
  console.log('\n🎉 All packages working! Ready for implementation.');
} catch(e) {
  console.log('❌ Error:', e.message);
}
