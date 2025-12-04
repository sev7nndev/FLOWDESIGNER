const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Add email service import at the top
const importStatement = "const { sendWelcomeEmail, sendPaymentConfirmation, sendQuotaAlert } = require('./services/emailService.cjs');";

// Find a good place to insert (after other requires)
const insertAfter = "const { GoogleGenerativeAI } = require('@google/generative-ai');";
if (!content.includes("sendWelcomeEmail")) {
    content = content.replace(insertAfter, insertAfter + "\n" + importStatement);
    console.log("✅ Added email service import");
} else {
    console.log("⚠️ Email service already imported");
}

// 2. Add welcome email to registration endpoint
const registerTarget = /res\.json\(\{ user: newUser \}\);/;
const registerReplacement = `// Send welcome email (non-blocking)
    sendWelcomeEmail(email, firstName || 'Usuário', 'free').catch(err => 
      console.error('Email send failed:', err)
    );
    
    res.json({ user: newUser });`;

if (registerTarget.test(content) && !content.includes("sendWelcomeEmail(email")) {
    content = content.replace(registerTarget, registerReplacement);
    console.log("✅ Added welcome email to registration");
} else {
    console.log("⚠️ Welcome email already integrated or pattern not found");
}

// 3. Add payment confirmation to webhook
const webhookTarget = /\/\/ Save Payment Record[\s\S]*?await scoped\.from\('payments'\)\.insert\(\{[\s\S]*?\}\);/;
const webhookMatch = content.match(webhookTarget);

if (webhookMatch && !content.includes("sendPaymentConfirmation")) {
    const webhookInsertPoint = webhookMatch[0];
    const webhookReplacement = webhookInsertPoint + `

            // Send payment confirmation email (non-blocking)
            const { data: userProfile } = await scoped.from('profiles').select('*').eq('id', userId).single();
            if (userProfile) {
              sendPaymentConfirmation(
                userProfile.email || email,
                userProfile.first_name || 'Cliente',
                planId,
                paidAmount
              ).catch(err => console.error('Payment email failed:', err));
            }`;

    content = content.replace(webhookTarget, webhookReplacement);
    console.log("✅ Added payment confirmation to webhook");
} else {
    console.log("⚠️ Payment email already integrated or pattern not found");
}

// Write back
fs.writeFileSync(serverPath, content, 'utf8');
console.log("✅ Server.cjs updated with email integrations");
