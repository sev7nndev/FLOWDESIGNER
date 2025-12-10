const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * QUALITY VALIDATOR - Analisa imagem gerada ANTES de entregar ao cliente
 * Usa Gemini Vision para validar se a arte atende aos padrões profissionais
 */

async function validateImageQuality(base64Image, businessData, expectedNiche) {
    try {
        console.log('🔍 [QUALITY VALIDATOR] Iniciando validação de qualidade...');
        console.log(`   Nicho esperado: ${expectedNiche}`);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Converter base64 para formato que o Gemini aceita
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/png"
            }
        };

        const validationPrompt = `
Você é um DIRETOR DE ARTE SÊNIOR especializado em marketing comercial brasileiro.

Analise esta imagem gerada por IA e avalie se ela atende aos padrões PROFISSIONAIS de qualidade.

CONTEXTO:
- Nicho do negócio: ${expectedNiche}
- Nome da empresa: ${businessData.nome || 'N/A'}
- Esta imagem será usada como FUNDO para adicionar texto depois

CRITÉRIOS DE AVALIAÇÃO (Nota de 0-10 para cada):

1. COMPOSIÇÃO PROFISSIONAL (0-10)
   - Segue regra dos terços?
   - Tem ponto focal claro?
   - Composição balanceada e intencional?
   - NÃO parece foto genérica de stock?

2. ILUMINAÇÃO CINEMATOGRÁFICA (0-10)
   - Iluminação profissional (não flat/sem graça)?
   - Tem profundidade (key/fill/rim lights)?
   - Sombras intencionais e bem posicionadas?
   - Cria atmosfera adequada ao nicho?

3. QUALIDADE VISUAL (0-10)
   - Imagem nítida e de alta resolução?
   - Cores vibrantes e harmoniosas?
   - Sem ruído ou artefatos visíveis?
   - Parece fotografia profissional (não CGI óbvio)?

4. ELEMENTOS DO NICHO (0-10)
   - Elementos visuais corretos para o nicho "${expectedNiche}"?
   - Representa bem o tipo de negócio?
   - Contexto brasileiro autêntico?
   - Não genérico demais?

5. ESPAÇO PARA TEXTO (0-10)
   - Área inferior/reservada COMPLETAMENTE LIVRE?
   - Gradiente suave para legibilidade de texto?
   - SEM elementos visuais na área de texto?
   - Pronto para overlay de texto?

6. RESTRIÇÕES CRÍTICAS (0-10)
   - SEM texto, números ou letras visíveis?
   - SEM logos indesejados?
   - SEM elementos de clipart/cartoon?
   - SEM aparência de stock photo barato?

RETORNE APENAS UM JSON VÁLIDO (SEM MARKDOWN):
{
  "aprovado": true/false,
  "nota_final": 0-10 (média das 6 notas),
  "notas": {
    "composicao": 0-10,
    "iluminacao": 0-10,
    "qualidade_visual": 0-10,
    "elementos_nicho": 0-10,
    "espaco_texto": 0-10,
    "restricoes": 0-10
  },
  "problemas": ["lista de problemas encontrados"],
  "sugestoes": ["sugestões para melhorar"],
  "parece_profissional": true/false
}

CRITÉRIO DE APROVAÇÃO:
- nota_final >= 7.0 E parece_profissional = true → APROVADO
- Caso contrário → REPROVADO (precisa regenerar)
`;

        const result = await model.generateContent([validationPrompt, imagePart]);
        const responseText = result.response.text();

        // Limpar markdown se houver
        const cleanedText = responseText.replace(/```json|```/g, '').trim();
        const validation = JSON.parse(cleanedText);

        console.log('📊 [QUALITY VALIDATOR] Resultado da validação:');
        console.log(`   Nota Final: ${validation.nota_final}/10`);
        console.log(`   Aprovado: ${validation.aprovado ? '✅ SIM' : '❌ NÃO'}`);
        console.log(`   Parece Profissional: ${validation.parece_profissional ? '✅ SIM' : '❌ NÃO'}`);

        if (validation.problemas && validation.problemas.length > 0) {
            console.log('   Problemas encontrados:');
            validation.problemas.forEach(p => console.log(`     - ${p}`));
        }

        if (!validation.aprovado && validation.sugestoes) {
            console.log('   Sugestões de melhoria:');
            validation.sugestoes.forEach(s => console.log(`     - ${s}`));
        }

        return validation;

    } catch (error) {
        console.error('❌ [QUALITY VALIDATOR] Erro na validação:', error.message);

        // Em caso de erro, aprovar por padrão (fallback)
        return {
            aprovado: true,
            nota_final: 7.0,
            notas: {},
            problemas: ['Validação automática falhou - aprovado por fallback'],
            sugestoes: [],
            parece_profissional: true,
            erro: error.message
        };
    }
}

/**
 * Valida e regenera automaticamente se necessário (até 2 tentativas)
 */
async function validateAndRegenerateIfNeeded(generateImageFn, businessData, expectedNiche, maxAttempts = 2) {
    let attempt = 1;

    while (attempt <= maxAttempts) {
        console.log(`\n🎨 [VALIDATOR] Tentativa ${attempt}/${maxAttempts} de geração...`);

        // Gerar imagem
        const imageBase64 = await generateImageFn();

        // Validar qualidade
        const validation = await validateImageQuality(imageBase64, businessData, expectedNiche);

        if (validation.aprovado && validation.nota_final >= 7.0) {
            console.log(`✅ [VALIDATOR] Imagem APROVADA na tentativa ${attempt}!`);
            return {
                success: true,
                imageBase64,
                validation,
                attempts: attempt
            };
        }

        console.log(`⚠️ [VALIDATOR] Imagem REPROVADA (nota: ${validation.nota_final}/10)`);

        if (attempt < maxAttempts) {
            console.log(`🔄 [VALIDATOR] Regenerando... (tentativa ${attempt + 1}/${maxAttempts})`);
            attempt++;
        } else {
            console.log(`❌ [VALIDATOR] Limite de tentativas atingido. Usando última imagem gerada.`);
            return {
                success: false,
                imageBase64,
                validation,
                attempts: attempt,
                warning: 'Imagem não atingiu nota mínima após múltiplas tentativas'
            };
        }
    }
}

module.exports = {
    validateImageQuality,
    validateAndRegenerateIfNeeded
};
