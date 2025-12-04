const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Fix the specific concatenation issue
    if (content.includes('wB0TUMERCADO_PAGO_PUBLIC_KEY')) {
        console.log('🔧 Found concatenated keys. Fixing...');
        content = content.replace('wB0TUMERCADO_PAGO_PUBLIC_KEY', 'wB0TU\nMERCADO_PAGO_PUBLIC_KEY');
        fs.writeFileSync(envPath, content);
        console.log('✅ .env.local fixed successfully!');
    } else {
        console.log('✓ No concatenation found or already fixed.');
    }

    console.log('Current Content Preview:');
    console.log(content.substring(0, 200) + '...');

} catch (error) {
    console.error('❌ Error fixing .env.local:', error);
}
