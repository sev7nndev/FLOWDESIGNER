
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', 'server.cjs');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Target: Remove lines 707 to 785 (1-based)
// Array indices: 706 to 784 (inclusive)

// Validate context
const line707 = lines[706]; // Should be "  const clientData = [];"
const line785 = lines[784]; // Should be "let finalPrompt = professionalPrompt;"

console.log('Line 707:', line707);
console.log('Line 785:', line785);

if (!line707.includes('const clientData = []') || !line785.includes('let finalPrompt = professionalPrompt')) {
    console.error('SAFETY CHECK FAILED: Lines do not match expectation. Aborting.');
    process.exit(1);
}

// Remove lines
lines.splice(706, (784 - 706 + 1));

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Successfully removed zombie lines.');
