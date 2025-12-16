const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retryWithBackoff } = require('./utils/retryWithBackoff.cjs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class UltraAdvancedImagenGenerator {
    constructor(apiKey, freepikKey) {
        this.apiKey = apiKey;
        this.freepikKey = freepikKey;
        this.geminiModel = "gemini-2.0-flash"; // Valid available model
        this.freepikEndpoint = "https://api.freepik.com/v1/ai/text-to-image"; // Freepik API
    }

    /**
     * MAIN ENTRY POINT
     * Orchestrates the 2-step flow: Gemini Director -> Imagen Execution
     */
    async generateProfessionalFlyer(businessData) {
        console.log('✨ [FLOW 2.0] Iniciando Geração de Arte Publicitária...');
        console.log('📋 Validando dados do briefing...');

        // 1. Prepare Initial Briefing Object
        const initialBriefing = {
            niche: businessData.niche || this.detectNicheBasic(businessData.pedido),
            nomeEmpresa: businessData.nome || "Sua Marca",
            telefone: businessData.telefone || businessData.whatsapp || "",
            enderecoCompleto: businessData.address || "",
            instagram: businessData.instagram || "",
            facebook: businessData.facebook || "",
            whatsapp: businessData.whatsapp || "",
            email: businessData.email || "",
            site: businessData.site || "",
            briefingTexto: businessData.pedido || businessData.descricao || "Crie um flyer profissional",
            temLogoUpload: !!businessData.logo,
            urlLogo: businessData.logo || ""
        };

        // 2. Enhance Data with Niche Intelligence
        const enrichedBriefing = this.enhanceBriefing(initialBriefing, initialBriefing.niche);
        console.log(`🧠 [INTELLIGENCE] Nicho detectado: ${initialBriefing.niche} | Estilo aplicado:`, enrichedBriefing.nicheStyle.keywords);

        // 3. Step 1: Gemini "Director" generates the Prompt
        console.log('🎬 [DIRECTOR] Gemini criando prompt visual...');
        const promptImagen4 = await this.gerarPromptImagen4(enrichedBriefing);
        console.log('📝 [DIRECTOR] Prompt Gerado:', promptImagen4);

        // 4. Step 2: Imagen "Artist" generates the Image
        console.log('🎨 [ARTIST] Imagen 4 gerando arte final...');
        const imageBase64 = await this.gerarFlyerImagen4(promptImagen4);

        return imageBase64;
    }

    /**
     * PASSO 1: O "DIRETOR DE ARTE" (Gemini Text)
     * Gera o prompt perfeito para o Imagen
     */
    async gerarPromptImagen4(briefingFlyer) {
        const style = briefingFlyer.nicheStyle; // Access the injected style config

        const systemPrompt = `Você é um diretor de arte de agência sênior, especialista em Typography e Design Visual. Receberá um JSON \`briefingFlyer\` e um briefing.
Sua missão crítica é criar um PROMPT DE IMAGEM para o modelo Flux Dev que resulte em uma imagem com **TEXTO PERFEITO** e **ESTILO VISUAL COERENTE**.

ESTILO VISUAL OBRIGATÓRIO (NICHO: ${briefingFlyer.niche}):
- **Cores Principais**: ${style.colors.join(", ")}
- **Elementos Visuais Chave**: ${style.elements}
- **Atmosfera/Keywords**: ${style.keywords}

REGRAS DE OURO PARA O TEXTO (CRÍTICO):
1. **IDIOMA E ORTOGRAFIA**: Todo o texto DEVE estar em PORTUGUÊS (PT-BR). Proibido usar inglês ou "gibberish" na arte final.
2. **FIDELIDADE ABSOLUTA**: 
   - O telefone deve ser EXATAMENTE: ${briefingFlyer.telefone || briefingFlyer.whatsapp}
   - O nome da empresa deve ser EXATAMENTE: ${briefingFlyer.nomeEmpresa}
   - O endereço deve ser fiel ao input.
3. **FORMATAÇÃO VISUAL**:
   - NÃO permita "muros de texto". Quebre linhas de forma lógica.
   - Instrua o modelo a renderizar o texto "chapado" ou "3D legível", evitando distorções.
   - Números de telefone devem ter destaque e clareza total.
4. **MOEDA**: Se houver preços, USE "R$" (Reais). Ex: "R$ 50,00".
5. **SLOGAN**: Use este slogan se o usuário não forneceu outro: "${briefingFlyer.headline || ''}"

INSTRUÇÕES PARA O PROMPT (O QUE VOCÊ VAI GERAR):
- Coloque todo texto que deve aparecer na imagem "ENTRE ASPAS DUPLAS" e especifique onde ele deve ficar.
- Use as CORES e ELEMENTOS definidos acima para descrever o cenário.
- Exemplo: "A professional flyer for a ${briefingFlyer.niche} business. Background features ${style.elements} with a palette of ${style.colors[0]} and ${style.colors[1]}."
- Textos: text "${briefingFlyer.nomeEmpresa}" in 3D metallic letters...

REGRAS DE LOGO:
- Se \`temLogoUpload\` = true: Reserve o topo.
- Se \`temLogoUpload\` = false: Instrua: "Create a professional 3D logo with the text '${briefingFlyer.nomeEmpresa}' with icon related to ${style.emoji}..."

SAÍDA:
Gere APENAS o prompt text (em INGLÊS, pois o Flux entende melhor os comandos visuais em inglês, mas com os TEXTOS A SEREM ESCRITOS mantidos em PORTUGUÊS dentro das aspas).
Garanta que as instruções peçam "correct spelling" e "legible font".`;

        const userContent = JSON.stringify(briefingFlyer);
        const model = genAI.getGenerativeModel({ model: this.geminiModel });

        try {
            const result = await retryWithBackoff(
                async () => {
                    return await model.generateContent([
                        {
                            text: systemPrompt + "\n\nO JSON do briefing é:\n" + userContent
                        }
                    ]);
                },
                {
                    maxRetries: 3,
                    initialDelayMs: 1000
                }
            );

            const generatedText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!generatedText) throw new Error("Gemini returned empty text.");
            
            const cleanText = generatedText.replace(/^```(markdown|text)?/, '').replace(/```$/, '').trim();
            
            // Debug: Save Prompt
            try { fs.writeFileSync(path.resolve(__dirname, 'debug_prompt.txt'), cleanText); } catch(e){}
            
            return cleanText;

        } catch (error) {
            try { fs.writeFileSync('backend/debug_gemini_error.json', JSON.stringify(error.message, null, 2)); } catch(e){}
            console.error("❌ ERRO NO STEP 1 (Gemini):", error.message);
            
            // IMPROVED Fallback Prompt to avoid "Pillow" look
            const fallbackPrompt = `
Flyer profissional e ultra-realista para ${briefingFlyer.niche}, formato retrato.
Título principal: "${briefingFlyer.nomeEmpresa}" em 3D metálico, integrado na cena, com reflexos realistas.
NÃO use texto plano, NÃO use legendas coloridas, NÃO use tarjas.
Endereço discreto no rodapé: "${briefingFlyer.telefone || briefingFlyer.address}".
Iluminação de estúdio, renderização Octane, 8k.
`.trim();
            return fallbackPrompt;
        }
    }

    /**
     * PASSO 2: O "ARTISTA" (Freepik Flux Dev)
     * Gera a imagem final com base no prompt do Diretor
     */
    async gerarFlyerImagen4(promptImagen4) {
        const attempts = 2;
        
        for (let i = 0; i < attempts; i++) {
            try {
                console.log(`🚀 [ATTEMPT ${i+1}] Enviando prompt para Freepik Flux Dev...`);
                
                // Debug: Save Prompt being sent
                try { fs.writeFileSync(path.resolve(__dirname, 'debug_last_prompt.json'), JSON.stringify({ prompt: promptImagen4 }, null, 2)); } catch(e){}
                
                const response = await axios.post(
                    this.freepikEndpoint,
                    {
                        prompt: promptImagen4,
                        image: {
                            size: "portrait_3_4"  // 3:4 Portrait ratio
                        },
                        styling: {
                            style: "photo"  // Photorealistic style
                        }
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-freepik-api-key': this.freepikKey
                        },
                        timeout: 120000
                    }
                );

                // Debug: Log full response
                console.log('📦 Freepik Response:', JSON.stringify(response.data, null, 2));
                try { fs.writeFileSync(path.resolve(__dirname, 'debug_freepik_response.json'), JSON.stringify(response.data, null, 2)); } catch(e){}

                // Check for direct Base64 response
                if (response.data?.data?.[0]?.base64) {
                    const base64 = response.data.data[0].base64;
                    return base64;
                }

                // Handling for URL response if any
                if (response.data?.data?.[0]?.url) {
                     const imageUrl = response.data.data[0].url;
                     const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                     return Buffer.from(imageResponse.data, 'binary').toString('base64');
                }

                throw new Error("Freepik não retornou imagem válida (nem base64 nem URL).");

            } catch (error) {
                try {
                    fs.writeFileSync(path.resolve(__dirname, 'debug_error_response.json'), JSON.stringify(error.response?.data || error.message, null, 2));
                } catch(e) {}
                
                console.warn(`⚠️ Erro na tentativa ${i+1}:`, error.response?.data?.error?.message || error.message);
                
                if (i < attempts - 1) {
                    await new Promise(r => setTimeout(r, 3000));
                    continue;
                }
                
                throw new Error(`Falha final na geração da imagem: ${error.message}`);
            }
        }
    }
}

module.exports = new UltraAdvancedImagenGenerator(process.env.GEMINI_API_KEY, process.env.FREEPIK_API_KEY);
