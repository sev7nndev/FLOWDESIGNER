const { spawn, execSync } = require('child_process');
const http = require('http');

// Cores para o console
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const red = '\x1b[31m';
const reset = '\x1b[0m';

function log(message, type = 'info') {
    const color = type === 'success' ? green : type === 'error' ? red : cyan;
    console.log(`${color}[FLOW-DEV] ${message}${reset}`);
}

async function killPort(port) {
    try {
        log(`Cleaning port ${port}...`);
        
        // Prevent killing own process
        const currentPid = process.pid;
        
        // PowerShell command to find and kill process listening on port, excluding current PID
        // -ErrorAction SilentlyContinue prevents "Access Denied" noise/crashes
        const psCommand = `
            $pids = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique;
            if ($pids) { 
                foreach ($p in $pids) { 
                    if ($p -ne ${currentPid}) { 
                        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue 
                    }
                } 
            }
        `;

        try {
            execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand.replace(/\n/g, ' ')}"`, { 
                stdio: 'ignore' // Completely silence output to prevent "Exit Code 5" bubbling
            });
            log(`Cleaned port ${port}`, 'success');
        } catch (e) {
            // If powershell fails, we just ignore it. 
            // The port might be busy, but we won't crash the terminal.
        }
    } catch (e) {
        // Double safety
    }
}

function checkServerReady() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3001/health', (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                resolve(false);
            }
        });

        req.on('error', () => {
            resolve(false);
        });

        req.end();
    });
}

async function start() {
    console.clear();
    log("🚀 Starting Optimized Development Environment...");

    // 1. Limpeza de Portas
    await killPort(3001);
    await killPort(3000);

    // 2. Iniciar Backend
    log("Starting Backend (Database Connection)...");
    const backend = spawn('node', ['backend/server.cjs'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PORT: '3001' }
    });

    // 3. Esperar Backend estar pronto via Health Check
    log("Waiting for Backend/Database to be ready (Health Check)...");
    let retries = 0;
    const maxRetries = 60; // 60 segundos

    const waitForBackend = setInterval(async () => {
        const isReady = await checkServerReady();
        if (isReady) {
            clearInterval(waitForBackend);
            log("✅ Backend & Database Connected! (Health Check OK)", 'success');
            startFrontend();
        } else {
            retries++;
            if (retries > maxRetries) {
                clearInterval(waitForBackend);
                log("❌ Backend timeout. Server did not respond to health check in 60s.", 'error');
                log("Check the console logs above for backend errors.", 'error');
                // Não mata o backend para permitir debug
                process.exit(1);
            }
        }
    }, 1000);

    function startFrontend() {
        // 4. Iniciar Frontend
        log("Starting Frontend (Vite)...");
        const frontend = spawn('npx', ['vite', '--port', '3000', '--open'], {
            stdio: 'inherit',
            shell: true
        });

        frontend.on('close', (code) => {
            log(`Frontend process exited with code ${code}`);
            backend.kill();
            process.exit(code);
        });
    }

    backend.on('close', (code) => {
        log(`Backend process exited with code ${code}`, 'error');
        process.exit(code);
    });
}

start();
