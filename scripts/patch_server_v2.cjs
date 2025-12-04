const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

const newInjectionBlock = `
      // --- STRICT DATA INJECTION (ROBUST V2) ---
      const clientData = [];
      if (promptInfo.companyName) clientData.push(\`Nome do Negócio: \${promptInfo.companyName}\`);
      if (promptInfo.whatsapp) clientData.push(\`Telefone: \${promptInfo.whatsapp}\`);
      if (promptInfo.instagram) clientData.push(\`Instagram: \${promptInfo.instagram}\`);
      if (promptInfo.rua) clientData.push(\`Endereço: \${promptInfo.rua}\`);
      if (promptInfo.site) clientData.push(\`Site: \${promptInfo.site}\`);
      
      if (promptInfo.details) clientData.push(\`Detalhes: \${promptInfo.details}\`);

      if (clientData.length > 0) {
        const robustBlock = \`
\\n═══════════════════════════════════════════════════════════════
⚠️ DADOS REAIS DO CLIENTE - COPIE EXATAMENTE COMO ESTÁ ESCRITO ⚠️
═══════════════════════════════════════════════════════════════

\${clientData.join('\\n')}

═══════════════════════════════════════════════════════════════
📋 INSTRUÇÕES OBRIGATÓRIAS:
═══════════════════════════════════════════════════════════════

1. COPIE cada texto EXATAMENTE como aparece acima, letra por letra
2. NÃO traduza - mantenha em português brasileiro
3. NÃO mude, adicione ou remova NENHUM caractere
4. NÃO invente dados - use SOMENTE os dados listados acima
5. Se um campo não está listado acima, NÃO inclua no cartão
6. Mantenha todos os acentos, pontos, vírgulas e espaços originais
7. Use tipografia legível e clara
8. Certifique-se de que todo o texto está perfeitamente visível

IMPORTANTE: Os dados acima são os ÚNICOS dados verdadeiros. NÃO use nenhum outro texto.
\`;
        professionalPrompt += robustBlock;
        console.log('💉 Data Injected (Robust V2):', robustBlock);
      }
      // -------------------------------------------------------------
`;

// Regex explanation:
// 1. Match "professionalPrompt = result.response.text()..."
// 2. Match strict whitespace/newlines
// 3. Match "console.log('? Director Smart Prompt:', ...);"
// Note: Using [\s\S]*? to match across newlines non-greedily
const targetRegex = /(professionalPrompt\s*=\s*result\.response\.text\(\)\.trim\(\)\.replace\(.*?\);[\s\S]*?console\.log\('.*?Director.*?'.*?\);)/;

if (content.includes("STRICT DATA INJECTION (ROBUST V2)")) {
    console.log("Already patched with V2.");
} else if (content.includes("STRICT DATA INJECTION")) {
    console.log("Found old V1 patch. Attempting to replace...");
    const oldBlockRegex = /\/\/ --- STRICT DATA INJECTION.*?(\/\/ -------------------------------------------------------------)/s;
    content = content.replace(oldBlockRegex, newInjectionBlock.trim());
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log("Server patched (Replaced V1).");
} else if (targetRegex.test(content)) {
    console.log("Found insertion target. Injecting V2...");
    content = content.replace(targetRegex, "$1\n" + newInjectionBlock);
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log("Server patched (Fresh V2 Injection).");
} else {
    console.error("❌ Failed to find target. Dumping context for analysis:");
    const debugRegex = /result\.response\.text\(\)/g;
    let match;
    while ((match = debugRegex.exec(content)) !== null) {
        console.log(content.substring(match.index, match.index + 200));
    }
}
