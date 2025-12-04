const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const newKey = 'AIzaSyBZsCBLy071Sa0Ffz_jjfI8b3Lu--wB0TU';

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Replace or Add Gemini Key
    if (content.includes('GEMINI_API_KEY=')) {
        content = content.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${newKey}`);
    } else {
        content += `\nGEMINI_API_KEY=${newKey}`;
    }

    // Fix concatenation if it exists
    content = content.replace('wB0TUMERCADO_PAGO_PUBLIC_KEY', `wB0TU\nMERCADO_PAGO_PUBLIC_KEY`);

    // Ensure proper spacing for MP keys
    content = content.replace(/MERCADO_PAGO_PUBLIC_KEY=/g, '\nMERCADO_PAGO_PUBLIC_KEY=');

    // Remove multiple empty lines
    content = content.replace(/\n\s*\n/g, '\n');

    fs.writeFileSync(envPath, content);
    console.log('✅ .env.local updated with new key and formatted!');

} catch (error) {
    console.error('❌ Error updating .env.local:', error);
}
