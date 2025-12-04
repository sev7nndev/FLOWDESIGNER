const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Config
const LOG_FILE = path.resolve(__dirname, 'guardian.log');
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

// State
let isRunning = false;
let globalSupabase = null;
let lastStats = {
    lastRun: null,
    dbLatency: 0,
    memory: 0,
    routeStatus: 'UNKNOWN',
    mpStatus: 'UNKNOWN',
    issues: 0
};

// Logger
const log = (action, status, details = '') => {
    const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        action,
        status,
        details
    });
    try {
        fs.appendFileSync(LOG_FILE, entry + '\n');
        console.log(`🛡️ [GUARDIAN]: ${action} - ${status} ${details}`);
    } catch (e) {
        console.error('Guardian Log Error:', e);
    }
};

// --- REPAIR PROTOCOLS ---

const Protocol_ReloadEnv = () => {
    try {
        const envConfig = dotenv.config();
        if (envConfig.error) throw envConfig.error;
        return process.env.GEMINI_API_KEY ? 'SUCCESS: Keys Found' : 'PARTIAL: .env reloaded but keys missing';
    } catch (e) {
        return `FAILED: ${e.message}`;
    }
};

const Protocol_DatabaseReconnect = async () => {
    try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return 'ABORT: Missing DB Credentials';
        }
        globalSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await globalSupabase.from('profiles').select('count').limit(1).single();
        if (error) throw error;
        return 'SUCCESS: Connection Re-established';
    } catch (e) {
        return `FAILED: ${e.message}`;
    }
};

// --- CHECKS ---

const checkRoutes = async () => {
    try {
        const port = process.env.PORT || 3005;
        // Using global fetch (Node 18+)
        const res = await fetch(`http://localhost:${port}/api/health`);
        return res.ok ? 'OK' : 'FAIL';
    } catch (e) { return 'DOWN'; }
};

const checkIntegrations = async () => {
    if (!process.env.MP_ACCESS_TOKEN) return 'MISSING_KEY';
    try {
        const res = await fetch('https://api.mercadopago.com/v1/payment_methods', {
            headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
        });
        return res.ok ? 'ACTIVE' : 'INVALID_TOKEN';
    } catch (e) { return 'UNREACHABLE'; }
};

// --- MONITOR LOOP ---

const runCycle = async () => {
    log('HEALTH_SCAN', 'STARTING');
    let issuesFound = 0;

    // 1. Check Vital Signs (ENV)
    if (!process.env.GEMINI_API_KEY || !process.env.MP_ACCESS_TOKEN) {
        log('CHECK_ENV', 'WARNING', 'Vital Keys Missing');
        Protocol_ReloadEnv();
        issuesFound++;
    } else {
        log('CHECK_ENV', 'OK');
    }

    // 2. Check Database Heartbeat
    let dbLatency = 0;
    try {
        if (!globalSupabase) {
            globalSupabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
        }
        const start = Date.now();
        const { error } = await globalSupabase.from('profiles').select('count', { count: 'exact', head: true });
        dbLatency = Date.now() - start;

        if (error) throw error;
        log('CHECK_DB', 'OK', `Latency: ${dbLatency}ms`);
    } catch (e) {
        log('CHECK_DB', 'CRITICAL', `Database Unreachable: ${e.message}`);
        issuesFound++;
        await Protocol_DatabaseReconnect();
    }

    // 3. Check Routes
    const routeStatus = await checkRoutes();
    log('CHECK_ROUTES', routeStatus);
    if (routeStatus !== 'OK') issuesFound++;

    // 4. Check Integrations (Mercado Pago)
    const mpStatus = await checkIntegrations();
    log('CHECK_MP', mpStatus);
    if (mpStatus !== 'ACTIVE') issuesFound++;

    // 5. Memory
    const memUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    log('CHECK_MEM', 'OK', `${memUsage}MB`);

    // Verdict
    if (issuesFound === 0) {
        log('CYCLE_COMPLETE', 'OPTIMAL', 'System Stable');
    } else {
        log('CYCLE_COMPLETE', 'STABILIZED', `${issuesFound} issues handled`);
    }

    // Update Stats
    lastStats = {
        lastRun: new Date().toISOString(),
        dbLatency,
        memory: memUsage,
        routeStatus,
        mpStatus,
        issues: issuesFound
    };
};

// --- PUBLIC API ---

const start = () => {
    if (isRunning) return;
    isRunning = true;
    log('BOOT', 'ONLINE', 'Guardian AI Agent v2 Activated');
    runCycle();
    setInterval(runCycle, CHECK_INTERVAL_MS);
};

const getLogs = (limit = 50) => {
    try {
        if (!fs.existsSync(LOG_FILE)) return [];
        const fileContent = fs.readFileSync(LOG_FILE, 'utf-8');
        const lines = fileContent.trim().split('\n');
        return lines.slice(-limit).map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
        }).filter(Boolean).reverse();
    } catch (e) {
        return [];
    }
};

const getStats = () => lastStats;

module.exports = { start, getLogs, runCycle, getStats };
