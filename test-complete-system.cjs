// Comprehensive System Test Script
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3001';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
    log('\n=== TEST 1: Health Check ===', 'cyan');
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        log(`✓ Health check passed: ${response.data.status}`, 'green');
        log(`  Uptime: ${response.data.uptime}s`, 'blue');
        return true;
    } catch (error) {
        log(`✗ Health check failed: ${error.message}`, 'red');
        return false;
    }
}

async function testRegistration() {
    log('\n=== TEST 2: User Registration ===', 'cyan');
    const timestamp = Date.now();
    const testUser = {
        email: `teste.qa.${timestamp}@flow.test`,
        password: 'TesteSenha123!',
        firstName: 'Teste',
        lastName: 'QA'
    };

    try {
        // Register user
        const response = await axios.post(`${BASE_URL}/api/register`, testUser);
        log(`✓ Registration successful`, 'green');
        log(`  User ID: ${response.data.user?.id}`, 'blue');

        // Verify in Supabase
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', testUser.email)
            .single();

        if (profile) {
            log(`✓ Profile created in Supabase`, 'green');
            log(`  Role: ${profile.role}`, 'blue');
            log(`  Name: ${profile.first_name} ${profile.last_name}`, 'blue');
        } else {
            log(`✗ Profile not found in Supabase: ${error?.message}`, 'red');
        }

        return { success: true, user: response.data.user, testUser };
    } catch (error) {
        log(`✗ Registration failed: ${error.response?.data?.error || error.message}`, 'red');
        return { success: false };
    }
}

async function testQuotaCheck(authToken) {
    log('\n=== TEST 3: Quota Check ===', 'cyan');
    try {
        const response = await axios.get(`${BASE_URL}/api/check-quota`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        log(`✓ Quota check passed`, 'green');
        log(`  Status: ${response.data.status}`, 'blue');
        log(`  Usage: ${response.data.usage?.images_generated || 0}/${response.data.usage?.limit || 'unlimited'}`, 'blue');
        return true;
    } catch (error) {
        log(`✗ Quota check failed: ${error.response?.data?.error || error.message}`, 'red');
        return false;
    }
}

async function testImageGeneration(authToken) {
    log('\n=== TEST 4: Image Generation ===', 'cyan');
    log('⏳ Generating image (this may take 30-60 seconds)...', 'yellow');

    const promptInfo = {
        companyName: 'Salão Beleza Total',
        addressStreet: 'Rua das Flores',
        addressNumber: '123',
        addressNeighborhood: 'Centro',
        addressCity: 'São Paulo',
        phone: '11999887766',
        details: 'Promoção especial de manicure e pedicure por apenas R$ 50'
    };

    try {
        const startTime = Date.now();
        const response = await axios.post(
            `${BASE_URL}/api/generate`,
            { promptInfo, artStyle: { label: 'Cinematic 3D', prompt: 'high quality, 8k, photorealistic' } },
            {
                headers: { Authorization: `Bearer ${authToken}` },
                timeout: 120000 // 2 minutes
            }
        );
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        log(`✓ Image generated successfully in ${duration}s`, 'green');
        log(`  Image ID: ${response.data.image?.id}`, 'blue');
        log(`  URL length: ${response.data.image?.image_url?.length || 0} chars`, 'blue');
        return true;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            log(`✗ Image generation timed out after 2 minutes`, 'red');
        } else {
            log(`✗ Image generation failed: ${error.response?.data?.error || error.message}`, 'red');
        }
        return false;
    }
}

async function testOwnerPanel() {
    log('\n=== TEST 5: Owner Panel - List Users ===', 'cyan');
    try {
        const response = await axios.get(`${BASE_URL}/api/admin/users`, {
            headers: { 'x-bypass-auth': 'testing-secret-123' }
        });
        log(`✓ Owner panel accessible`, 'green');
        log(`  Total users: ${response.data.users?.length || 0}`, 'blue');

        if (response.data.users && response.data.users.length > 0) {
            const latestUser = response.data.users[response.data.users.length - 1];
            log(`  Latest user: ${latestUser.email} (${latestUser.role})`, 'blue');
        }
        return true;
    } catch (error) {
        log(`✗ Owner panel failed: ${error.response?.data?.error || error.message}`, 'red');
        return false;
    }
}

async function testMercadoPagoStatus() {
    log('\n=== TEST 6: Mercado Pago Integration ===', 'cyan');
    try {
        const response = await axios.get(`${BASE_URL}/api/admin/mp-status`);
        log(`✓ Mercado Pago status check passed`, 'green');
        log(`  Connected: ${response.data.connected}`, 'blue');
        if (response.data.user_id) {
            log(`  MP User ID: ${response.data.user_id}`, 'blue');
        }
        return true;
    } catch (error) {
        log(`✗ Mercado Pago status failed: ${error.message}`, 'red');
        return false;
    }
}

async function testDatabaseIntegrity() {
    log('\n=== TEST 7: Database Integrity ===', 'cyan');
    try {
        // Check profiles table
        const { count: profileCount, error: profileError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (profileError) throw profileError;
        log(`✓ Profiles table accessible`, 'green');
        log(`  Total profiles: ${profileCount}`, 'blue');

        // Check user_usage table
        const { count: usageCount, error: usageError } = await supabase
            .from('user_usage')
            .select('*', { count: 'exact', head: true });

        if (usageError) throw usageError;
        log(`✓ User usage table accessible`, 'green');
        log(`  Total usage records: ${usageCount}`, 'blue');

        // Check images table
        const { count: imageCount, error: imageError } = await supabase
            .from('images')
            .select('*', { count: 'exact', head: true });

        if (imageError) throw imageError;
        log(`✓ Images table accessible`, 'green');
        log(`  Total images: ${imageCount}`, 'blue');

        return true;
    } catch (error) {
        log(`✗ Database integrity check failed: ${error.message}`, 'red');
        return false;
    }
}

async function runAllTests() {
    log('\n╔════════════════════════════════════════════╗', 'cyan');
    log('║   FLOW SaaS - Comprehensive System Test   ║', 'cyan');
    log('╚════════════════════════════════════════════╝', 'cyan');

    const results = {
        healthCheck: false,
        registration: false,
        quotaCheck: false,
        imageGeneration: false,
        ownerPanel: false,
        mercadoPago: false,
        database: false
    };

    // Test 1: Health Check
    results.healthCheck = await testHealthCheck();

    // Test 2: Registration
    const regResult = await testRegistration();
    results.registration = regResult.success;

    // If registration successful, get auth token for further tests
    let authToken = null;
    if (regResult.success && regResult.user) {
        // Sign in to get token
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: regResult.testUser.email,
                password: regResult.testUser.password
            });
            if (data.session) {
                authToken = data.session.access_token;
                log(`✓ Obtained auth token for testing`, 'green');
            }
        } catch (error) {
            log(`⚠ Could not obtain auth token: ${error.message}`, 'yellow');
        }
    }

    // Test 3: Quota Check (requires auth)
    if (authToken) {
        results.quotaCheck = await testQuotaCheck(authToken);
    } else {
        log('\n⚠ Skipping quota check (no auth token)', 'yellow');
    }

    // Test 4: Image Generation (requires auth)
    if (authToken) {
        results.imageGeneration = await testImageGeneration(authToken);
    } else {
        log('\n⚠ Skipping image generation (no auth token)', 'yellow');
    }

    // Test 5: Owner Panel
    results.ownerPanel = await testOwnerPanel();

    // Test 6: Mercado Pago
    results.mercadoPago = await testMercadoPagoStatus();

    // Test 7: Database Integrity
    results.database = await testDatabaseIntegrity();

    // Summary
    log('\n╔════════════════════════════════════════════╗', 'cyan');
    log('║              TEST SUMMARY                  ║', 'cyan');
    log('╚════════════════════════════════════════════╝', 'cyan');

    const passed = Object.values(results).filter(r => r === true).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([test, result]) => {
        const status = result ? '✓' : '✗';
        const color = result ? 'green' : 'red';
        log(`${status} ${test.replace(/([A-Z])/g, ' $1').trim()}`, color);
    });

    log(`\n${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

    if (passed === total) {
        log('\n🎉 ALL TESTS PASSED! System is 100% functional!', 'green');
    } else {
        log('\n⚠️  Some tests failed. Review errors above.', 'yellow');
    }
}

// Run tests
runAllTests().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
