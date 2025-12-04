const axios = require('axios'); // Assuming axios is installed, if not using fetch specific to Node usually needs polyfill, but server.cjs has node-fetch? No, axios is in package.json.
// If axios is missing, use http.
const http = require('http');

const BASE_URL = 'http://localhost:3005';
const REPORT_FILE = '../backend/guardian_audit_report.json';
const fs = require('fs');

const log = (msg) => console.log(`[AUDIT] ${msg}`);

async function request(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3005,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (e) { }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', (e) => resolve({ status: 500, error: e.message }));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runAudit() {
    log('Staring Full Functional Audit...');
    const results = {
        routes: [],
        security: [],
        payments: [],
        stability: []
    };

    // 1. ROUTE & SECURITY CHECK
    log('Testing Routes...');
    const publicRoutes = ['/api/health']; // Only valid public JSON endpoint
    for (const r of publicRoutes) {
        const res = await request(r);
        results.routes.push({ route: r, status: res.status, pass: res.status === 200 });
        log(`Route ${r}: ${res.status}`);
    }

    const protectedRoutes = ['/api/check-quota', '/api/admin/users'];
    for (const r of protectedRoutes) {
        const res = await request(r); // No Auth
        const passed = res.status === 401 || res.status === 403;
        results.security.push({ route: r, case: 'No Auth', status: res.status, pass: passed });
        log(`Security ${r} (No Auth): ${res.status} ${passed ? '✅' : '❌'}`);
    }

    // 2. PAYMENT SIMULATION (Webhook)
    log('Simulating Payment Webhook...');
    // We can't really "simulate" a valid MP signature, but we can call the webhook and see if it 200s
    // server.cjs doesn't check MP signature (it should though! But for now it just checks ID).
    // We'll simulate a fake payment ID? No, server calls MP API to verify ID.
    // So we can only test that the webhook endpoint EXISTS and returns 200.
    const hookRes = await request('/api/webhook', 'POST', { type: 'payment', data: { id: '123456' } });
    results.payments.push({ case: 'Webhook Endpoint', status: hookRes.status, pass: hookRes.status === 200 });
    log(`Webhook Ping: ${hookRes.status}`);

    // 3. STABILITY (Stress Test)
    log('Running Stress Test (50 reqs)...');
    let successCount = 0;
    const TOTAL_REQS = 50;
    const start = Date.now();

    const promises = [];
    for (let i = 0; i < TOTAL_REQS; i++) {
        promises.push(request('/api/health'));
    }

    const responses = await Promise.all(promises);
    successCount = responses.filter(r => r.status === 200).length;
    const duration = Date.now() - start;

    results.stability.push({ total: TOTAL_REQS, success: successCount, timeMs: duration, pass: successCount === TOTAL_REQS });
    log(`Stress Test: ${successCount}/${TOTAL_REQS} OK in ${duration}ms`);

    // FINAL VERDICT
    const allPassed =
        results.routes.every(r => r.pass) &&
        results.security.every(r => r.pass) &&
        results.payments.every(r => r.pass) &&
        results.stability.every(r => r.pass);

    log(`Audit Complete. Verdict: ${allPassed ? 'PASSED' : 'ISSUES FOUND'}`);

    // Save to file for Guardian to read? Or just console.
    fs.writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
}

runAudit();
