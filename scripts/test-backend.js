#!/usr/bin/env node

require('dotenv').config();
const fetch = require('node-fetch');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

console.log('🧪 Flow Designer Backend Test Suite\n');

async function testEndpoint(name, method, path, options = {}) {
  try {
    console.log(`\n📋 Testing: ${name}`);
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      ...options
    });
    
    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
    
    if (response.ok) {
      console.log(`✅ ${name}: SUCCESS (${response.status})`);
      return data;
    } else {
      console.log(`❌ ${name}: FAILED (${response.status})`);
      console.log('Error:', data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.log(`❌ ${name}: NETWORK ERROR`);
    console.log('Details:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting backend tests...\n');

  // Test 1: Health Check
  await testEndpoint('Health Check', 'GET', '/');

  // Test 2: Plans Endpoint
  await testEndpoint('Plans List', 'GET', '/api/plans');

  // Test 3: Usage Endpoint (requires user ID)
  const testUserId = '00000000-0000-0000-0000-000000000001'; // Admin user
  await testEndpoint('User Usage', 'GET', `/api/usage/${testUserId}`);

  console.log('\n🎯 Test suite completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Test authentication endpoints with valid JWT tokens');
  console.log('2. Test image generation with proper authentication');
  console.log('3. Test owner panel with owner account');
  console.log('4. Verify all 500 errors are resolved');
}

runTests().catch(console.error);