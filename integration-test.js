// Simple integration test for the unified API
const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Running API Integration Tests...\n');

  // Test health endpoint
  try {
    const health = await fetch(`${BASE_URL}/api/health`);
    const healthData = await health.json();
    console.log('✅ Health check:', healthData.status === 'healthy' ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('❌ Health check: FAIL -', error.message);
  }

  // Test version endpoint
  try {
    const version = await fetch(`${BASE_URL}/api/version`);
    const versionData = await version.json();
    console.log('✅ Version check:', versionData.version ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('❌ Version check: FAIL -', error.message);
  }

  // Test content generation for ScriptTok
  try {
    const generate = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'scriptok',
        platform: 'tiktok', 
        playbook: 'tiktok-script',
        inputs: { topic: 'integration test' }
      })
    });
    const generateData = await generate.json();
    console.log('✅ ScriptTok generation:', generateData.id ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('❌ ScriptTok generation: FAIL -', error.message);
  }

  // Test content generation for GlowBot
  try {
    const generate = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module: 'glowbot',
        platform: 'tiktok',
        playbook: 'viral-hook', 
        inputs: { topic: 'integration test', audience: 'teens' }
      })
    });
    const generateData = await generate.json();
    console.log('✅ GlowBot generation:', generateData.id ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('❌ GlowBot generation: FAIL -', error.message);
  }

  // Test content listing
  try {
    const content = await fetch(`${BASE_URL}/api/content`);
    const contentData = await content.json();
    console.log('✅ Content listing:', Array.isArray(contentData) ? 'PASS' : 'FAIL');
    console.log(`   Found ${contentData.length} content items`);
  } catch (error) {
    console.log('❌ Content listing: FAIL -', error.message);
  }

  console.log('\n🎯 Integration tests completed!');
}

testAPI();