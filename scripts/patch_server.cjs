const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

// The string we are looking for to replace
const targetStr = "professionalPrompt = result.response.text().trim().replace(/```/g, '');";

// The new block of code we want to insert
const injectionCode = `
      professionalPrompt = result.response.text().trim().replace(/\\\`\\\`\\\`/g, '');
      console.log('🎩 Director (Senior):', professionalPrompt);

      // --- STRICT DATA INJECTION (USER REQUEST: ENFORCE REAL DATA) ---
      const contactData = [];
      if (promptInfo.whatsapp) contactData.push(\`PHONE: \${promptInfo.whatsapp}\`);
      if (promptInfo.instagram) contactData.push(\`INSTAGRAM: \${promptInfo.instagram}\`);
      if (promptInfo.rua) contactData.push(\`ADDRESS: \${promptInfo.rua}\`);
      if (promptInfo.site) contactData.push(\`WEBSITE: \${promptInfo.site}\`);

      if (contactData.length > 0) {
        const injectionBlock = \`\\n\\nCRITICAL - MANDATORY TEXT RENDER:\\n\${contactData.join('\\n')}\\n(Render exactly as written)\`;
        professionalPrompt += injectionBlock;
        console.log('💉 Data Injected:', injectionBlock);
      }
      // -------------------------------------------------------------
`;

// Simple check to avoid double patching
if (content.includes("STRICT DATA INJECTION")) {
    console.log("Already patched.");
} else {
    // Only replacing the FIRST occurrence is fine here
    content = content.replace(targetStr, injectionCode);
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log("Server patched successfully.");
}
