// Test script to verify analytics system
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAnalytics() {
  console.log('🧪 Testing Analytics System\n');
  console.log('='.repeat(50));

  // Test 1: Track a page view
  console.log('\n1️⃣ Testing /api/analytics/track');
  try {
    const trackData = {
      ip: '127.0.0.1',
      country: 'Vietnam',
      city: 'Hanoi',
      device: 'desktop',
      browser: 'Chrome',
      browserVersion: '143',
      os: 'Windows',
      page: '/test-page',
      referrer: '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      sessionId: 'test-session-' + Date.now(),
      timeOnPage: 10,
      isNewVisitor: true,
    };

    const trackResponse = await fetch(`${BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackData),
    });

    const trackResult = await trackResponse.json();
    console.log('✅ Track Response:', trackResult);
  } catch (error) {
    console.error('❌ Track Error:', error.message);
  }

  // Test 2: Get statistics
  console.log('\n2️⃣ Testing /api/analytics/stats');
  try {
    const statsResponse = await fetch(`${BASE_URL}/api/analytics/stats?range=day`);
    const statsResult = await statsResponse.json();
    console.log('✅ Stats Response:');
    console.log('   Total Visitors:', statsResult.totalVisitors);
    console.log('   Total Page Views:', statsResult.totalPageViews);
    console.log('   Unique Visitors:', statsResult.uniqueVisitors);
    console.log('   Top Pages:', statsResult.topPages.length);
  } catch (error) {
    console.error('❌ Stats Error:', error.message);
  }

  // Test 3: Get location
  console.log('\n3️⃣ Testing /api/analytics/location');
  try {
    const locationResponse = await fetch(`${BASE_URL}/api/analytics/location`);
    const locationResult = await locationResponse.json();
    console.log('✅ Location Response:', locationResult);
  } catch (error) {
    console.error('❌ Location Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Testing completed!');
}

// Run tests
testAnalytics().catch(console.error);

