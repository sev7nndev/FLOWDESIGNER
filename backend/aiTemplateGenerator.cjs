// AI-POWERED FLYER GENERATOR
// Usa Gemini para gerar HTML/CSS premium com imagens reais

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Presets de nichos
const NICHE_PRESETS = {
    petshop: {
        keywords: 'cães, gatos, banho e tosa, acessórios, veterinário',
        icons: 'pata, tesoura, osso, telefone, WhatsApp, localização, Instagram',
        palette: 'laranja vibrante, creme, turquesa, branco',
        headline: 'Amor e Cuidado para Seu Melhor Amigo',
        subheadline: 'Banho, Tosa e Cuidados Veterinários',
        services: ['Banho e Tosa', 'Consultas Veterinárias', 'Vacinação', 'Pet Shop'],
        cta: 'Agende Agora!'
    },
    pizzaria: {
        keywords: 'pizza, forno, ingredients, delivery, massa',
        icons: 'pizza, relógio, motoboy, telefone, WhatsApp, Instagram',
        palette: 'vermelho escuro, dourado, preto',
        headline: 'A Melhor Pizza Artesanal!',
        subheadline: 'Massa Fresca e Ingredients Premium',
        services: ['Forno a Lenha', 'Massa Artesanal', 'Delivery Rápido', 'Promoções'],
        cta: 'Peça Agora!'
    },
    hamburgueria: {
        keywords: 'hambúrguer, batata frita, chopp, cozinha, fogo',
        icons: 'hambúrguer, batata, chopp, telefone, WhatsApp, Instagram',
        palette: 'vermelho, amarelo, preto, carvão',
        headline: 'Burger Gourmet Irresistível!',
        subheadline: 'Carne Premium e Sabor Único',
        services: ['Carne Angus', 'Bacon Crocante', 'Queijos Especiais', 'Batatas Artesanais'],
        cta: 'Peça Já!'
    },
    mecanica: {
        keywords: 'carro, ferramentas, elevador, pneus, oficina',
        icons: 'chave inglesa, roda, óleo, telefone, WhatsApp, localização',
        palette: 'azul escuro, cinza, amarelo, laranja',
        headline: 'Oficina Mecânica Especializada',
        subheadline: 'Qualidade e Confiança em Cada Serviço',
        services: ['Suspensão', 'Freios', 'Motor', 'Revisão Completa'],
        cta: 'Agende Seu Serviço!'
    },
    barbearia: {
        keywords: 'barbeiro, tesoura, navalha, espelho, cadeira',
        icons: 'tesoura, navalha, pente, telefone, WhatsApp, Instagram',
        palette: 'marrom escuro, dourado, creme, preto',
        headline: 'Estilo e Tradição',
        subheadline: 'Cortes Clássicos e Modernos',
        services: ['Corte Profissional', 'Barba na Navalha', 'Tratamentos', 'Produtos Premium'],
        cta: 'Agende Seu Horário!'
    },
    academia: {
        keywords: 'musculação, treino, halteres, academia, fitness',
        icons: 'haltere, músculo, coração, telefone, WhatsApp, Instagram',
        palette: 'preto, azul neon, ciano, branco',
        headline: 'Transforme Seu Corpo!',
        subheadline: 'Treinos Personalizados e Resultados Reais',
        services: ['Musculação', 'Funcional', 'Personal Trainer', 'Avaliação Física'],
        cta: 'Comece Hoje!'
    },
    beleza: {
        keywords: 'cabelo, maquiagem, unha, salão, estética',
        icons: 'tesoura, esmalte, flor, telefone, WhatsApp, Instagram',
        palette: 'rosa, pêssego, branco, dourado',
        headline: 'Beleza e Bem-Estar',
        subheadline: 'Realce Sua Beleza Natural',
        services: ['Cabelo', 'Unhas', 'Maquiagem', 'Estética'],
        cta: 'Agende Seu Horário!'
    },
    bar: {
        keywords: 'cerveja, bar, petiscos, futebol, torcida',
        icons: 'cerveja, bola, TV, telefone, WhatsApp, Instagram',
        palette: 'vermelho, preto, dourado, verde',
        headline: 'O Melhor Happy Hour!',
        subheadline: 'Cerveja Gelada e Petiscos Deliciosos',
        services: ['Cervejas Artesanais', 'Petiscos', 'Jogos ao Vivo', 'Música'],
        cta: 'Vem Pro Bar!'
    },
    festa: {
        keywords: 'festa, balões, confete, DJ, palco',
        icons: 'balão, microfone, nota musical, telefone, WhatsApp, Instagram',
        palette: 'rosa, roxo, dourado, ciano',
        headline: 'Festa Inesquecível!',
        subheadline: 'Diversão Garantida Para Todos',
        services: ['Animação', 'DJ Profissional', 'Buffet Completo', 'Decoração'],
        cta: 'Reserve Já!'
    },
    despachante: {
        keywords: 'carro, documentos, mapa, DETRAN, emplacamento',
        icons: 'documento, mapa, carro, telefone, WhatsApp, localização',
        palette: 'azul, cinza, branco, ciano',
        headline: 'Despachante Rápido e Confiável',
        subheadline: 'Todos os Serviços Veiculares',
        services: ['Emplacamento', 'Transferência', 'Licenciamento', 'CNH'],
        cta: 'Solicite Agora!'
    }
};

const UNIVERSAL_PROMPT_TEMPLATE = `
Tarefa:
Crie um flyer vertical (1080x1920 px) premium e profissional no estilo Nano Banana, voltado para o público brasileiro, usando HTML e CSS prontos para renderização com Puppeteer.

NICHO: {NICHO}

Objetivo:
Montar uma arte visualmente impactante e profissional que pareça feita por um designer de alto nível, com hierarquia tipográfica forte, ícones SVG inline e elementos modernos (mesh gradient, glassmorphism, blend modes).

IMPORTANTE SOBRE IMAGENS:
- Use emojis grandes (200-300px) como elementos visuais principais
- Crie círculos/formas geométricas com gradientes para simular fotos recortadas
- Exemplo: Para pet shop, use 🐕🐈 em círculos com borda branca
- Para pizzaria: 🍕 em círculo com sombra profunda
- Para hamburgueria: 🍔 em forma destacada

Composição visual PREMIUM:
- Aplicar mesh gradient com 3+ cores vibrantes baseado na paleta: {PALETTE}
- Glassmorphism em TODOS os cards (background: rgba(255,255,255,0.15), backdrop-filter: blur(20px))
- Sombras profundas (0 20px 60px rgba(0,0,0,0.4))
- Blur suave em elementos de fundo
- Formas orgânicas/geométricas decorativas
- Grain texture overlay (opacity 0.3, mix-blend-mode: overlay)
- Grid 12 colunas, safe area de 64px

Badges e Selos:
- Criar badge promocional no topo direito
- Usar glassmorphism: rgba(255,255,255,0.2) + backdrop-filter: blur(20px)
- Borda: 2-3px solid rgba(255,255,255,0.3)
- Texto em UPPERCASE, fonte Manrope 800
- Exemplos: "🔥 PROMOÇÃO", "⚡ DELIVERY", "✨ PREMIUM"

Tipografia premium (Google Fonts):
- Título principal: Archivo Black ou Bebas Neue, 72-96px, line-height 1.1
- Subtítulo: Sora 600, 28-36px
- Serviços: Sora 700, 22-26px
- CTA: Manrope 800, 36-44px, UPPERCASE
- Contatos: Sora 600, 20-24px
- Incluir: <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Sora:wght@600;700&family=Manrope:wght@800&display=swap" rel="stylesheet">

Ícones SVG inline (minimalistas, modernos):
- Telefone: <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 10.2c1.5 3.1 4.1 5.7 7.2 7.2l2.4-2.4c.3-.3.9-.4 1.3-.2 1.4.6 2.9 1 4.5 1 .7 0 1.3.6 1.3 1.3v3.8c0 .7-.6 1.3-1.3 1.3C10.9 22.5 1.5 13.1 1.5 1.3 1.5.6 2.1 0 2.8 0h3.8c.7 0 1.3.6 1.3 1.3 0 1.6.3 3.1 1 4.5.2.4.1 1-.2 1.3l-2.4 2.4z"/></svg>
- WhatsApp: <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 1.7.4 3.3 1.2 4.7L2 22l5.4-1.1A9.9 9.9 0 0 0 12 22a10 10 0 1 0 0-20zm5.8 14.6c-.3.8-1.6 1.5-2.4 1.6-.6.1-1.4.2-3.8-.8-3.2-1.4-5.3-4.7-5.5-4.9-.2-.3-1.3-1.7-1.3-3.3s.8-2.4 1.2-2.7c.3-.3.7-.4 1-.4h.7c.3 0 .5 0 .7.6.3.7 1.1 2.6 1.2 2.8.1.2.2.5 0 .8-.1.3-.2.5-.4.7s-.4.5-.2.9c.2.4.9 1.5 1.9 2.4 1.3 1.1 2.4 1.4 2.8 1.6.3.1.6.1.8-.1s.5-.5.7-.8c.2-.3.4-.5.6-.4s1.6.8 1.9.9c.3.2.5.3.6.5.2.2.2.8 0 1.2z"/></svg>
- Localização: <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.1 2 5 5.1 5 9c0 5.4 7 13 7 13s7-7.6 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z"/></svg>
- Instagram: <svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/></svg>
- Adicionar ícones específicos do nicho: {ICONS}

Layout Structure (OBRIGATÓRIO):
1. HEADER (padding: 60px 64px 40px):
   - Logo/Marca: Archivo Black, 88-96px, centralizado
   - Badge promocional: position absolute, top-right

2. HERO (padding: 40px 64px):
   - Headline: Archivo Black, 68-72px, line-height 1.1
   - Subheadline: Sora 600, 28-32px
   - Hero visual: Emoji 200-280px em círculo/forma com gradiente
   - Margin: 40px 0

3. FEATURES/SERVICES (padding: 40px 64px):
   - Grid 2 colunas (grid-template-columns: 1fr 1fr)
   - Gap: 24px
   - Cards com glassmorphism
   - Cada card: ícone (64px) + texto (Sora 700, 24px)

4. CTA (padding: 40px 64px):
   - Botão grande: padding 28px 90px
   - Border-radius: 70px
   - Gradiente vibrante
   - Sombra: 0 15px 50px com cor do botão
   - Fonte: Manrope 800, 40px, UPPERCASE

5. FOOTER (position: absolute, bottom: 0):
   - Background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 30%)
   - Padding: 100px 64px 50px
   - Grid 2 colunas para contatos
   - Instagram centralizado abaixo

Conteúdo do cliente (PT-BR):
- Marca: {BRAND}
- Headline: {HEADLINE}
- Subheadline: {SUBHEADLINE}
- Serviços: {SERVICES}
- CTA: {CTA}
- Telefone: {PHONE}
- WhatsApp: {WHATSAPP}
- Endereço: {ADDRESS}
- Instagram: {INSTAGRAM}

Acessibilidade:
- Todo texto em português do Brasil
- Contraste mínimo AA (4.5:1)
- Alt text descritivo em emojis

SAÍDA OBRIGATÓRIA:
Retorne APENAS o código HTML completo (incluindo CSS inline no <style>) pronto para renderizar.
NÃO inclua explicações, markdown ou comentários.
O HTML deve ter exatamente 1080x1920px e ser renderizável com Puppeteer.
Use apenas as cores da paleta especificada.
Inclua TODOS os elementos: mesh gradient, grain texture, glassmorphism, badges, ícones SVG, tipografia premium.
`;

async function generateFlyerWithAI(businessData) {
    try {
        console.log('🤖 [AI GENERATOR] Gerando flyer com Gemini...');

        // Detecta nicho
        const niche = detectNiche(businessData);
        const preset = NICHE_PRESETS[niche] || NICHE_PRESETS.petshop;

        console.log(`   Nicho: ${niche}`);
        console.log(`   Preset: ${preset.headline}`);

        // Monta prompt
        const prompt = UNIVERSAL_PROMPT_TEMPLATE
            .replace('{NICHO}', niche)
            .replace('{PALETTE}', preset.palette)
            .replace('{ICONS}', preset.icons)
            .replace('{BRAND}', businessData.nome || 'Sua Empresa')
            .replace('{HEADLINE}', preset.headline)
            .replace('{SUBHEADLINE}', businessData.descricao || preset.subheadline)
            .replace('{SERVICES}', preset.services.join(', '))
            .replace('{CTA}', preset.cta)
            .replace('{PHONE}', businessData.telefone || businessData.whatsapp || '(00) 00000-0000')
            .replace('{WHATSAPP}', businessData.whatsapp || businessData.telefone || '(00) 00000-0000')
            .replace('{ADDRESS}', formatAddress(businessData))
            .replace('{INSTAGRAM}', businessData.instagram || '@empresa');

        console.log('📝 Enviando prompt para Gemini...');

        // Chama Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const html = response.text();

        // Limpa o HTML (remove markdown se houver)
        const cleanHtml = html
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        console.log('✅ [AI GENERATOR] HTML gerado com sucesso!');
        console.log(`   Tamanho: ${cleanHtml.length} caracteres`);

        return cleanHtml;

    } catch (error) {
        console.error('❌ [AI GENERATOR] Erro:', error.message);
        throw error;
    }
}

function detectNiche(businessData) {
    const text = ((businessData.nome || '') + ' ' + (businessData.descricao || '')).toLowerCase();

    if (text.match(/pet.*shop|veterinaria|animais|cachorro|gato|banho.*tosa/)) return 'petshop';
    if (text.match(/pizza|pizzaria|italiano|massa/)) return 'pizzaria';
    if (text.match(/hamburger|burger|lanche|batata/)) return 'hamburgueria';
    if (text.match(/mecanica|carro|auto|oficina|motor/)) return 'mecanica';
    if (text.match(/barbearia|barber|corte.*cabelo|barba/)) return 'barbearia';
    if (text.match(/academia|fitness|musculacao|treino/)) return 'academia';
    if (text.match(/salao|beleza|estetica|cabelo|unha/)) return 'beleza';
    if (text.match(/bar|restaurante|churrasco|bebida|cerveja/)) return 'bar';
    if (text.match(/festa|evento|carnaval|show|balada/)) return 'festa';
    if (text.match(/despachante|detran|emplacamento/)) return 'despachante';

    return 'petshop'; // fallback
}

function formatAddress(data) {
    if (data.addressStreet && data.addressNumber) {
        let addr = `${data.addressStreet}, ${data.addressNumber}`;
        if (data.addressNeighborhood) addr += ` - ${data.addressNeighborhood}`;
        if (data.addressCity) addr += `, ${data.addressCity}`;
        return addr;
    }
    return data.addressCity || 'Consulte nosso endereço';
}

module.exports = {
    generateFlyerWithAI,
    NICHE_PRESETS
};
