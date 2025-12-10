const http = require('http');

const checkUrl = (url, name) => {
    return new Promise((resolve) => {
        console.log(`Checking ${name} at ${url}...`);
        const req = http.get(url, (res) => {
            console.log(`✅ ${name} responded with status: ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', (e) => {
            console.error(`❌ ${name} FAILED: ${e.message}`);
            resolve(false);
        });

        req.setTimeout(5000, () => {
            console.error(`❌ ${name} TIMED OUT`);
            req.destroy();
            resolve(false);
        });
    });
};

(async () => {
    console.log("=== FULL STACK HEALTH CHECK ===");
    const backend = await checkUrl('http://localhost:3001/api/health', 'Backend API'); // Assuming /health doesn't exist, we check root or just connection
    // Try root for backend if health missing, well let's try root for backend too? No, usually 404 is fine as long as it connects.
    // Let's check root for backend:
    const backendRoot = await checkUrl('http://localhost:3001/', 'Backend Root');

    const frontend = await checkUrl('http://localhost:3000/', 'Frontend (Vite)');

    if (frontend && (backend || backendRoot)) {
        console.log("🚀 SYSTEM IS ONLINE");
        process.exit(0);
    } else {
        console.log("⚠️ SYSTEM PARTIALLY OFFLINE");
        process.exit(1);
    }
})();
