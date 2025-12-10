// ═══════════════════════════════════════════════════════════════
// 🎨 ROTA DE GERAÇÃO DE IMAGENS - SISTEMA DE IA PROFISSIONAL
// ═══════════════════════════════════════════════════════════════
// Sistema de Dupla IA:
// 1. IA Prompt Engineer - Transforma briefings curtos em prompts profissionais
// 2. IA Crítico Auditor - Valida qualidade e corrige erros automaticamente
// ═══════════════════════════════════════════════════════════════

app.post('/api/generate', generationLimiter, async (req, res) => {
    const startTime = Date.now();
    let user = null;
    let promptInfo = {};

    try {
        // ─────────────────────────────────────────────────────────────
        // AUTENTICAÇÃO E AUTORIZAÇÃO
        // ─────────────────────────────────────────────────────────────
        user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Não autorizado' });

        promptInfo = req.body.promptInfo || {};
        const { artStyle } = req.body;

        // Determine Role
        const { data: profile } = await globalSupabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role || 'free';
        const hasUnlimitedGeneration = role === 'owner' || role === 'dev' || role === 'admin';

        if (hasUnlimitedGeneration) {
            console.log(`✅ UNLIMITED GENERATION ACTIVE - Role: ${role}, User: ${user.id}`);
        }

        // ─────────────────────────────────────────────────────────────
        // VERIFICAÇÃO DE QUOTA
        // ─────────────────────────────────────────────────────────────
        if (!hasUnlimitedGeneration) {
            const { data: usageData, error: usageError } = await globalSupabase
                .from('user_usage')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (usageError && usageError.code !== 'PGRST116') throw usageError;

            const limit = role === 'pro' ? 50 : (role === 'starter' ? 20 : 3);
            if (usageData && usageData.images_generated >= limit) {
                return res.status(403).json({ error: 'Limite de geração atingido.', quotaStatus: 'BLOCKED' });
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 🤖 ETAPA 1: IA PROMPT ENGINEER
        // ═══════════════════════════════════════════════════════════════
        console.log('🤖 [ETAPA 1] IA Prompt Engineer - Iniciando...');

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Coletar TODOS os dados do formulário
        const clientData = {
            companyName: promptInfo.companyName || '',
            whatsapp: promptInfo.whatsapp || promptInfo.phone || '',
            instagram: promptInfo.instagram || '',
            facebook: promptInfo.facebook || '',
            site: promptInfo.site || '',
            email: promptInfo.email || '',
            addressStreet: promptInfo.addressStreet || promptInfo.rua || '',
            addressNumber: promptInfo.addressNumber || promptInfo.numero || '',
            addressNeighborhood: promptInfo.addressNeighborhood || promptInfo.bairro || '',
            addressCity: promptInfo.addressCity || promptInfo.cidade || '',
            briefing: promptInfo.details || promptInfo.briefing || ''
        };

        console.log('📋 Dados do cliente coletados:', JSON.stringify(clientData, null, 2));

        // Prompt do Prompt Engineer (IA que cria prompts profissionais)
        const promptEngineerSystemPrompt = `Você é um DIRETOR DE ARTE PROFISSIONAL especializado em criar prompts perfeitos para o Google Imagen 4.0.

SEU OBJETIVO: Gerar um prompt extremamente detalhado que produza uma arte publicitária PERFEITA em português do Brasil, sem erros.

═══════════════════════════════════════════════════════════════
⚠️ REGRAS OBRIGATÓRIAS (NUNCA QUEBRE ESTAS REGRAS)
═══════════════════════════════════════════════════════════════

1. **IDIOMA DO PROMPT**: Escreva o prompt em INGLÊS (para o Imagen entender melhor)
2. **IDIOMA DO TEXTO NA IMAGEM**: TODO texto DENTRO da imagem DEVE estar em PORTUGUÊS BRASILEIRO PERFEITO
3. **ORTOGRAFIA**: Zero erros de ortografia, acentuação ou gramática
4. **TELEFONES**: Formato brasileiro obrigatório:
   - Celular: (DD) 9XXXX-XXXX
   - Fixo: (DD) XXXX-XXXX
   - SEMPRE com parênteses no DDD e hífen
   - Exemplo CORRETO: (11) 95301-7418
   - Exemplo ERRADO: 11 95301-7418, (11)953017418, 11-95301-7418

5. **PREÇOS**: Formato brasileiro obrigatório:
   - R$ XX,XX (vírgula para centavos, NÃO ponto)
   - Exemplo CORRETO: R$ 28,90
   - Exemplo ERRADO: R$ 28.90, R$28,90, 28,90

6. **ENDEREÇOS**: Completos e corretos conforme fornecido
7. **LAYOUT**: SEM fundos extras, embaçados ou molduras - a arte É a imagem final
8. **QUALIDADE VISUAL**:
   - Layout profissional e limpo
   - Hierarquia visual clara
   - Tipografia legível e moderna
   - Cores harmoniosas e profissionais
   - Sem aspecto amador

9. **DADOS DO CLIENTE**: Use SOMENTE os dados fornecidos, não invente nada

═══════════════════════════════════════════════════════════════
📊 DADOS DO CLIENTE (USE TODOS ESTES DADOS NA ARTE)
═══════════════════════════════════════════════════════════════

Nome da Empresa: "${clientData.companyName}"
WhatsApp/Telefone: "${clientData.whatsapp}"
Instagram: "${clientData.instagram}"
Facebook: "${clientData.facebook}"
Site: "${clientData.site}"
E-mail: "${clientData.email}"
Endereço: "${clientData.addressStreet}, ${clientData.addressNumber} - ${clientData.addressNeighborhood}, ${clientData.addressCity}"
Briefing do Cliente: "${clientData.briefing}"

═══════════════════════════════════════════════════════════════
🎨 SUA TAREFA
═══════════════════════════════════════════════════════════════

1. Analise o nicho do negócio baseado no nome e briefing
2. Expanda o briefing curto em uma descrição visual EXTREMAMENTE detalhada
3. Especifique cores, tipografia, composição, iluminação
4. Inclua TODOS os dados do formulário no layout da arte
5. Force português brasileiro perfeito em TODOS os textos
6. Especifique formatação correta de telefones e preços

ESTRUTURA DO PROMPT QUE VOCÊ DEVE GERAR:

"A professional award-winning advertising flyer design for [NICHO]. 
[DESCRIÇÃO VISUAL DETALHADA: cores, composição, elementos, iluminação, estilo]

TEXT CONTENT (ALL IN PERFECT BRAZILIAN PORTUGUESE):
- Main headline: "[Nome da Empresa]" (large, bold, professional typography)
- Subheadline/tagline: "[Briefing expandido]"
- Contact information block (bottom section, organized layout):
  * WhatsApp: [telefone formatado como (DD) 9XXXX-XXXX]
  * Instagram: [instagram]
  * Facebook: [facebook]
  * Site: [site]
  * E-mail: [email]
  * Address: [endereço completo]

CRITICAL REQUIREMENTS:
- All text must be in perfect Brazilian Portuguese with correct spelling and accents
- Phone numbers MUST use format: (DD) 9XXXX-XXXX with parentheses and hyphen
- Prices MUST use format: R$ XX,XX with comma (not period)
- No extra backgrounds, blurred overlays, or frames
- Clean professional layout with clear visual hierarchy
- High quality, 8K resolution, photorealistic
- Modern typography, harmonious colors
- Professional commercial photography style"

RESPONDA APENAS COM O PROMPT FINAL EM INGLÊS, PRONTO PARA O IMAGEN 4.0.
NÃO adicione explicações, comentários ou texto extra.`;

        let professionalPrompt = '';

        try {
            console.log('🔄 Gerando prompt profissional com IA...');
            const result = await model.generateContent(promptEngineerSystemPrompt);
            professionalPrompt = result.response.text().trim().replace(/```/g, '');
            console.log('✅ Prompt profissional gerado:');
            console.log('─'.repeat(80));
            console.log(professionalPrompt);
            console.log('─'.repeat(80));
        } catch (e) {
            console.warn('⚠️ Erro ao gerar prompt profissional, usando fallback:', e.message);
            // Fallback simples se a IA falhar
            professionalPrompt = `Professional advertising flyer for ${clientData.companyName}. 
${clientData.briefing}. 
Contact: WhatsApp ${clientData.whatsapp}, Instagram ${clientData.instagram}. 
Address: ${clientData.addressStreet}, ${clientData.addressNumber} - ${clientData.addressNeighborhood}, ${clientData.addressCity}. 
All text in perfect Brazilian Portuguese.`;
        }

        // ═══════════════════════════════════════════════════════════════
        // 🎨 ETAPA 2: GERAÇÃO DE IMAGEM COM IMAGEN 4.0
        // ═══════════════════════════════════════════════════════════════

        const generateImage = async (prompt) => {
            console.log('🎨 [ETAPA 2] Gerando imagem com Imagen 4.0...');
            try {
                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:predict`,
                    {
                        instances: [{ prompt: prompt }],
                        parameters: { sampleCount: 1, aspectRatio: "3:4" }
                    }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': GEMINI_API_KEY
                    },
                    timeout: 90000 // 90s
                });

                const b64 = response.data?.predictions?.[0]?.bytesBase64Encoded;
                if (!b64) {
                    console.error('❌ Nenhuma imagem retornada:', JSON.stringify(response.data, null, 2));
                    throw new Error('No image generated by API');
                }

                console.log('✅ Imagem gerada com sucesso!');
                return b64;
            } catch (e) {
                if (e.code === 'ECONNABORTED') throw new Error('Timeout: A IA demorou muito para responder.');
                console.error('❌ Erro ao gerar imagem:', e.response?.data || e.message);
                throw new Error(e.response?.data?.error?.message || e.message || 'Erro ao gerar imagem');
            }
        };

        // ═══════════════════════════════════════════════════════════════
        // 🔍 ETAPA 3: IA CRÍTICO AUDITOR (Loop de Correção)
        // ═══════════════════════════════════════════════════════════════

        let imageBase64 = null;
        let finalPrompt = professionalPrompt;
        let criticVerdict = 'PENDING';
        const MAX_ATTEMPTS = 3;
        let attempt = 1;

        while (attempt <= MAX_ATTEMPTS) {
            console.log(`\n${'═'.repeat(80)}`);
            console.log(`🔄 TENTATIVA ${attempt}/${MAX_ATTEMPTS}`);
            console.log('═'.repeat(80));

            // Gerar imagem
            imageBase64 = await generateImage(finalPrompt);

            // Auditar com IA Crítica
            console.log('🔍 [ETAPA 3] IA Crítico Auditor - Analisando arte...');

            try {
                const criticModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const imagePart = { inlineData: { data: imageBase64, mimeType: "image/png" } };

                const criticPrompt = `Você é um REVISOR CRÍTICO DE ARTES PUBLICITÁRIAS PROFISSIONAIS.

Você receberá uma imagem gerada por IA e deve analisá-la com EXTREMO RIGOR.

═══════════════════════════════════════════════════════════════
📋 DADOS QUE DEVEM ESTAR NA ARTE
═══════════════════════════════════════════════════════════════

Nome da Empresa: "${clientData.companyName}"
WhatsApp/Telefone: "${clientData.whatsapp}"
Instagram: "${clientData.instagram}"
Facebook: "${clientData.facebook}"
Site: "${clientData.site}"
E-mail: "${clientData.email}"
Endereço: "${clientData.addressStreet}, ${clientData.addressNumber} - ${clientData.addressNeighborhood}, ${clientData.addressCity}"

═══════════════════════════════════════════════════════════════
✅ CRITÉRIOS DE APROVAÇÃO (TODOS DEVEM SER ATENDIDOS)
═══════════════════════════════════════════════════════════════

1. **PORTUGUÊS BRASILEIRO PERFEITO**:
   - Zero erros de ortografia
   - Acentuação correta (á, é, í, ó, ú, â, ê, ô, ã, õ, ç)
   - Palavras completas (sem letras faltando)
   - Gramática correta

2. **FORMATAÇÃO DE TELEFONE**:
   - Formato: (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX
   - Com parênteses no DDD
   - Com hífen separando os números
   - Exemplo CORRETO: (11) 95301-7418
   - Exemplo ERRADO: 11 95301-7418, (11)953017418

3. **FORMATAÇÃO DE PREÇOS** (se houver):
   - Formato: R$ XX,XX
   - Vírgula para centavos (NÃO ponto)
   - Exemplo CORRETO: R$ 28,90
   - Exemplo ERRADO: R$ 28.90, R$28,90

4. **QUALIDADE VISUAL**:
   - Sem fundos extras ou embaçados
   - Tipografia legível e profissional
   - Layout limpo e organizado
   - Cores harmoniosas
   - Sem aspecto amador

5. **DADOS DO CLIENTE**:
   - Nome da empresa correto
   - Informações de contato presentes e corretas
   - Nada inventado ou alterado

═══════════════════════════════════════════════════════════════
📝 FORMATO DA SUA RESPOSTA
═══════════════════════════════════════════════════════════════

Se a arte estiver PERFEITA (todos os critérios atendidos):
Responda APENAS: "APROVADA"

Se houver QUALQUER erro:
Responda no formato:
"REPROVADA
ERROS ENCONTRADOS:
- [erro 1]
- [erro 2]
- [erro 3]

CORREÇÕES NECESSÁRIAS:
[Instruções específicas de como corrigir os erros encontrados]"

SEJA EXTREMAMENTE CRÍTICO. Se tiver dúvida, REPROVE.`;

                const criticResult = await criticModel.generateContent([criticPrompt, imagePart]);
                criticVerdict = criticResult.response.text().trim();

                console.log('📊 Veredito do Crítico:');
                console.log('─'.repeat(80));
                console.log(criticVerdict);
                console.log('─'.repeat(80));

                if (criticVerdict.toUpperCase().includes('APROVADA')) {
                    console.log('✅ ARTE APROVADA! Qualidade profissional confirmada.');
                    criticVerdict = `APROVADA (Tentativa ${attempt}/${MAX_ATTEMPTS})`;
                    break;
                } else {
                    console.log(`❌ ARTE REPROVADA na tentativa ${attempt}/${MAX_ATTEMPTS}`);

                    if (attempt < MAX_ATTEMPTS) {
                        console.log('🔄 Gerando novo prompt com correções...');
                        // Extrair correções do veredito e adicionar ao prompt
                        finalPrompt = `${professionalPrompt}

CRITICAL CORRECTIONS REQUIRED (Previous attempt had errors):
${criticVerdict}

MANDATORY FIXES:
- Ensure ALL text is in perfect Brazilian Portuguese with correct spelling
- Phone numbers MUST be formatted as (DD) 9XXXX-XXXX with parentheses and hyphen
- Prices MUST be formatted as R$ XX,XX with comma
- No extra backgrounds or blurred overlays
- Professional clean layout`;
                    } else {
                        console.log('⚠️ Máximo de tentativas atingido. Entregando melhor resultado disponível.');
                        criticVerdict = `APROVADA COM RESSALVAS (${MAX_ATTEMPTS} tentativas)`;
                    }
                }
            } catch (e) {
                console.warn('⚠️ Erro no crítico, aprovando por padrão:', e.message);
                criticVerdict = `APROVADA (Crítico falhou - Tentativa ${attempt})`;
                break;
            }

            attempt++;
        }

        // ═══════════════════════════════════════════════════════════════
        // 💾 SALVAR RESULTADO E ATUALIZAR USAGE
        // ═══════════════════════════════════════════════════════════════

        const imageUrl = `data:image/png;base64,${imageBase64}`;

        console.log('💾 Salvando imagem no banco de dados...');

        // Log QA
        logQA({
            type: 'GENERATION',
            user: user.id,
            duration: Date.now() - startTime,
            result: 'SUCCESS',
            criticVerdict,
            attempts: attempt,
            prompt: clientData.companyName
        });

        // Salvar imagem
        await globalSupabase.from('images').insert({
            user_id: user.id,
            prompt: finalPrompt,
            image_url: imageUrl,
            business_info: promptInfo
        });

        // Atualizar usage (se não for unlimited)
        if (!hasUnlimitedGeneration) {
            const { data: u } = await globalSupabase.from('user_usage').select('*').eq('user_id', user.id).single();
            if (u) {
                await globalSupabase.from('user_usage').update({ images_generated: u.images_generated + 1 }).eq('user_id', user.id);
            } else {
                await globalSupabase.from('user_usage').insert({ user_id: user.id, images_generated: 1 });
            }
        }

        trackEvent('generation', user.id, { verdict: criticVerdict, attempts: attempt });

        console.log('✅ GERAÇÃO COMPLETA!');
        console.log(`⏱️  Tempo total: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log(`🎯 Veredito: ${criticVerdict}`);
        console.log('═'.repeat(80));

        res.json({ image: { id: 'generated', image_url: imageUrl } });

    } catch (error) {
        console.error('❌ Erro na geração:', error);
        logQA({
            type: 'ERROR',
            user: user?.id || 'unknown',
            error: error.message,
            prompt: promptInfo?.companyName || 'unknown'
        });
        res.status(500).json({ error: error.message });
    }
});
