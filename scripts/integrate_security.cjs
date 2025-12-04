const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Add rate limiting imports
const rateLimitImport = `const { generalLimiter, generationLimiter, authLimiter, paymentLimiter } = require('./services/rateLimitService.cjs');`;
const webhookSecurityImport = `const { webhookValidationMiddleware } = require('./services/webhookSecurity.cjs');`;

const importInsertPoint = "const { GoogleGenerativeAI } = require('@google/generative-ai');";

if (!content.includes("rateLimitService")) {
    content = content.replace(importInsertPoint, importInsertPoint + "\n" + rateLimitImport + "\n" + webhookSecurityImport);
    console.log("✅ Added security service imports");
} else {
    console.log("⚠️ Security services already imported");
}

// 2. Apply general rate limiter to all routes
const appUseInsertPoint = "app.use(cors());";
if (!content.includes("app.use(generalLimiter)")) {
    content = content.replace(appUseInsertPoint, appUseInsertPoint + "\napp.use(generalLimiter); // Rate limiting for all routes");
    console.log("✅ Added general rate limiter");
}

// 3. Add specific rate limiters to endpoints
const endpointLimiters = [
    {
        pattern: /app\.post\('\/api\/generate'/,
        limiter: ", generationLimiter",
        name: "generation"
    },
    {
        pattern: /app\.post\('\/api\/register'/,
        limiter: ", authLimiter",
        name: "register"
    },
    {
        pattern: /app\.post\('\/api\/subscribe'/,
        limiter: ", paymentLimiter",
        name: "subscribe"
    }
];

endpointLimiters.forEach(({ pattern, limiter, name }) => {
    const match = content.match(pattern);
    if (match && !content.includes(match[0] + limiter)) {
        content = content.replace(pattern, match[0] + limiter);
        console.log(`✅ Added rate limiter to ${name} endpoint`);
    } else {
        console.log(`⚠️ ${name} endpoint already has rate limiter or not found`);
    }
});

// 4. Add webhook signature validation
const webhookPattern = /app\.post\('\/api\/webhook'/;
const webhookMatch = content.match(webhookPattern);
if (webhookMatch && !content.includes("webhookValidationMiddleware")) {
    content = content.replace(webhookPattern, webhookMatch[0] + ", webhookValidationMiddleware");
    console.log("✅ Added webhook signature validation");
} else {
    console.log("⚠️ Webhook validation already added or endpoint not found");
}

// Write back
fs.writeFileSync(serverPath, content, 'utf8');
console.log("✅ Server.cjs updated with security features");
