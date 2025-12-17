/**
 * ROTA /API/GENERATE - GERAÇÃO DE ARTES PROFISSIONAIS COM IMAGEN 4.0 ULTRA
 * 
 * Qualidade das imagens de referência:
 * - Design profissional e impactante
 * - Cada nicho com estilo único
 * - Texto legível e bem posicionado
 * - Composição cinematográfica
 */

const express = require('express');
const router = express.Router();
const imagen4Service = require('../services/imagen4Service.cjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const globalSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper para pegar usuário autenticado
const getAuthUser = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    const { data: { user }, error } = await globalSupabase.auth.getUser(token);
    return user;
};

router.post('/', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { form } = req.body;
        
        
        console.log('\n' + '═'.repeat(70));
        console.log('🚀 INICIANDO GERAÇÃO DE ARTE COM IMAGEN 4.0 ULTRA');
        console.log('═'.repeat(70));
        console.log(`📋 Empresa: ${form.companyName}`);
        console.log(`📝 Briefing: ${form.details.substring(0, 60)}...`);
        console.log(`📱 WhatsApp: ${form.phone}`);
        console.log(`📧 Email: ${form.email || 'NÃO FORNECIDO'}`);
        console.log(`📷 Instagram: ${form.instagram || 'NÃO FORNECIDO'}`);
        console.log(`👥 Facebook: ${form.facebook || 'NÃO FORNECIDO'}`);
        console.log(`🌐 Site: ${form.website || 'NÃO FORNECIDO'}`);
        console.log(`📍 Endereço: ${form.addressStreet}, ${form.addressNumber} - ${form.addressNeighborhood}, ${form.addressCity}`);
        console.log(`🛠️  Serviços: ${form.services ? form.services.join(', ') : 'NÃO FORNECIDO'}`);
        console.log(`🎁 Promoção: ${form.promotion || 'NÃO FORNECIDO'}`);
        console.log(`💰 Preço: ${form.price || 'NÃO FORNECIDO'}`);
        console.log('═'.repeat(70) + '\n');
        
        // ═══════════════════════════════════════════════════════════════
        // VERIFICAÇÃO DE QUOTA
        // ═══════════════════════════════════════════════════════════════
        
        // 1. Verificar autenticação
        const user = await getAuthUser(req);
        if (!user) {
            return res.status(401).json({
                error: "Não autorizado. Faça login para gerar imagens."
            });
        }

        // 2. Buscar role do usuário
        const { data: profile } = await globalSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role || 'free';

        // 3. Verificar se tem quota ilimitada (dev/owner/admin)
        const hasUnlimitedQuota = ['dev', 'owner', 'admin'].includes(role);

        if (!hasUnlimitedQuota) {
            // 4. Buscar uso atual
            const { data: usageData } = await globalSupabase
                .from('user_usage')
                .select('images_generated')
                .eq('user_id', user.id)
                .single();

            const currentUsage = usageData?.images_generated || 0;

            // 5. Buscar limite do plano
            const { data: planSettings } = await globalSupabase
                .from('plan_settings')
                .select('max_images_per_month')
                .eq('id', role)
                .single();

            const limit = planSettings?.max_images_per_month || (role === 'pro' ? 50 : (role === 'starter' ? 20 : 3));

            console.log(`📊 Quota: ${currentUsage}/${limit} (Plano: ${role.toUpperCase()})`);

            // 6. Verificar se atingiu o limite
            if (currentUsage >= limit) {
                console.log(`🚫 BLOQUEADO: Limite de ${limit} imagens atingido!`);
                return res.status(403).json({
                    error: "QUOTA_EXCEEDED",
                    message: `Você atingiu o limite de ${limit} imagens do plano ${role.toUpperCase()}. Faça upgrade para continuar gerando!`,
                    currentUsage,
                    limit,
                    plan: role
                });
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // VALIDAÇÃO DE DADOS
        // ═══════════════════════════════════════════════════════════════
        
        if (!form) {
            return res.status(400).json({
                error: "Dados do formulário não fornecidos."
            });
        }
        
        if (!form.companyName || form.companyName.trim().length < 2) {
            return res.status(400).json({
                error: "Nome da empresa é obrigatório."
            });
        }
        
        if (!form.details || form.details.trim().length < 5) {
            return res.status(400).json({
                error: "Briefing é obrigatório. Descreva o que você precisa."
            });
        }
        
        // IMPORTANTE: NÃO usar valores padrão - passar exatamente o que veio do formulário
        // Se o campo não foi preenchido, passar vazio ou undefined
        // A IA não deve inventar dados que o usuário não forneceu
        
        
        // ═══════════════════════════════════════════════════════════════
        // GERAÇÃO COM IMAGEN 4.0 ULTRA 2K
        // ═══════════════════════════════════════════════════════════════
        
        console.log('🎨 Gerando arte profissional com Imagen 4.0 ULTRA 2K...');
        
        // Gerar imagem (retorna base64)
        const base64Image = await imagen4Service.generateBackground(form, "3:4");
        
        // Converter para data URL
        const base64 = `data:image/png;base64,${base64Image}`;
        
        // ═══════════════════════════════════════════════════════════════
        // SALVAR IMAGEM PRIMEIRO (ANTES DE INCREMENTAR CONTADOR)
        // ═══════════════════════════════════════════════════════════════
        
        // 1. Salvar imagem no banco de dados PRIMEIRO
        console.log('💾 Salvando imagem no banco de dados...');
        console.log('📊 Dados a salvar:', {
            user_id: user.id,
            has_image_url: !!base64,
            prompt_length: form.details?.length || 0,
            has_business_info: !!form
        });

        const { data: savedImage, error: saveError } = await globalSupabase
            .from('images')
            .insert({
                user_id: user.id,
                image_url: base64,
                prompt: form.details,
                business_info: form
            })
            .select()
            .single();

        if (saveError) {
            console.error('❌ ERRO CRÍTICO ao salvar imagem:', saveError);
            throw new Error(`Falha ao salvar imagem no banco: ${saveError.message}`);
        }

        console.log('✅ Imagem salva com sucesso! ID:', savedImage?.id);

        // 2. SOMENTE AGORA incrementar contador (após salvar com sucesso)
        if (!hasUnlimitedQuota) {
            const { data: currentData } = await globalSupabase
                .from('user_usage')
                .select('images_generated')
                .eq('user_id', user.id)
                .single();

            const newCount = (currentData?.images_generated || 0) + 1;

            const { error: updateError } = await globalSupabase
                .from('user_usage')
                .update({ images_generated: newCount })
                .eq('user_id', user.id);

            if (updateError) {
                console.error('⚠️ Erro ao incrementar contador:', updateError);
                // NÃO lançar erro aqui - a imagem já foi salva
                // O contador pode ser corrigido depois com o script de auditoria
            } else {
                console.log(`✅ Contador atualizado: ${newCount - 1} → ${newCount}`);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // RETORNAR RESULTADO
        // ═══════════════════════════════════════════════════════════════
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '═'.repeat(70));
        console.log('✅ ARTE GERADA COM SUCESSO!');
        console.log('═'.repeat(70));
        console.log(`⏱️  Tempo total: ${elapsedTime}s`);
        console.log(`📦 Tamanho: ${Math.round(base64.length / 1024)}KB`);
        console.log(`🎯 Provedor: Google Imagen 4.0 ULTRA`);
        console.log(`🏢 Empresa: ${form.companyName}`);
        console.log('═'.repeat(70) + '\n');
        
        return res.json({ 
            base64,
            metadata: {
                provider: 'Google Imagen 4.0 ULTRA',
                quality: 'Professional',
                elapsedTime: parseFloat(elapsedTime),
                aspectRatio: '3:4',
                resolution: '2K'
            }
        });
        
    } catch (err) {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.error('\n' + '═'.repeat(70));
        console.error('❌ ERRO AO GERAR ARTE');
        console.error('═'.repeat(70));
        console.error(`⏱️  Tempo até erro: ${elapsedTime}s`);
        console.error(`🔴 Erro: ${err.message}`);
        console.error('═'.repeat(70));
        
        if (err.stack) {
            console.error('\nStack trace:');
            console.error(err.stack);
        }
        
        console.error('\n');
        
        // ═══════════════════════════════════════════════════════════════
        // MENSAGENS DE ERRO AMIGÁVEIS
        // ═══════════════════════════════════════════════════════════════
        
        let errorMessage = "Erro ao gerar arte. Tente novamente.";
        let statusCode = 500;
        
        // Rate limit (429)
        if (err.message?.includes('rate limit') || 
            err.message?.includes('429') || 
            err.message?.includes('Limite de requisições')) {
            errorMessage = "Limite de requisições do Google atingido. Por favor, aguarde 1-2 minutos e tente novamente.";
            statusCode = 429;
        }
        // Timeout
        else if (err.message?.includes('Timeout') || err.message?.includes('timeout')) {
            errorMessage = "A geração está demorando muito. Por favor, tente novamente com um briefing mais simples.";
            statusCode = 504;
        }
        // API Key inválida
        else if (err.message?.includes('API Key') || err.message?.includes('401') || err.message?.includes('403')) {
            errorMessage = "Erro de configuração da API Google. Entre em contato com o suporte.";
            statusCode = 500;
        }
        // Payload inválido
        else if (err.message?.includes('Payload inválido') || err.message?.includes('400')) {
            errorMessage = "Dados inválidos enviados para geração. Verifique o formulário.";
            statusCode = 400;
        }
        
        return res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            elapsedTime: parseFloat(elapsedTime)
        });
    }
});

module.exports = router;