const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

const newKeys = {
    MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-8995458023662154-120206-1b44056532aff4f2e167e1505b8f4100-268788511',
    MERCADO_PAGO_PUBLIC_KEY: 'APP_USR-89e040a5-69f4-4ca5-8c33-08159587892c',
    MERCADO_PAGO_CLIENT_ID: '8995458023662154',
    MERCADO_PAGO_CLIENT_SECRET: 'jqCZuIFI5Ytu9d1zSMVWgc3fHoThdtQW'
};

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
    }

    let lines = content.split('\n');
    const updatedLines = [];
    const processedKeys = new Set();

    // Update existing keys
    for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            if (newKeys[key]) {
                updatedLines.push(`${key}=${newKeys[key]}`);
                processedKeys.add(key);
            } else {
                updatedLines.push(line);
            }
        } else {
            updatedLines.push(line);
        }
    }

    // Add missing keys
    for (const [key, value] of Object.entries(newKeys)) {
        if (!processedKeys.has(key)) {
            updatedLines.push(`${key}=${value}`);
        }
    }

    // Remove empty lines at the end and join
    const finalContent = updatedLines.join('\n').trim() + '\n';

    fs.writeFileSync(envPath, finalContent, 'utf8');
    console.log('✅ .env.local updated successfully with Mercado Pago keys.');

} catch (error) {
    console.error('❌ Error updating .env.local:', error);
}
