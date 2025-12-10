// TEMPLATE RENDERER - Gera flyers usando HTML/CSS + Puppeteer
// Substitui geração por IA (Imagen) por templates profissionais garantidos

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class TemplateRenderer {
    constructor() {
        this.templatesDir = path.join(__dirname, 'templates');
        this.browser = null;
    }

    async init() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    // Detecta nicho do negócio
    detectNiche(businessData) {
        const text = ((businessData.nome || '') + ' ' + (businessData.descricao || '')).toLowerCase();

        // Food & Beverage
        if (text.match(/acai|sorvete|gelato|sobremesa|doce/)) return 'acai';
        if (text.match(/pizza|pizzaria|italiano|massa/)) return 'pizzaria';
        if (text.match(/hamburger|burger|lanche|batata/)) return 'hamburgueria';
        if (text.match(/bar|restaurante|churrasco|bebida|cerveja/)) return 'bar';

        // Automotive
        if (text.match(/mecanica|carro|auto|oficina|motor/)) return 'mecanica';
        if (text.match(/despachante|detran|emplacamento/)) return 'despachante';

        // Beauty & Wellness
        if (text.match(/salao|beleza|estetica|cabelo|unha/)) return 'beleza';
        if (text.match(/barbearia|barber|corte.*cabelo|barba/)) return 'barbearia';
        if (text.match(/academia|fitness|musculacao|treino/)) return 'academia';

        // Events & Services
        if (text.match(/festa|evento|carnaval|show|balada/)) return 'festa';
        if (text.match(/pet.*shop|veterinaria|animais|cachorro|gato/)) return 'petshop';

        return 'geral';
    }

    // Carrega template HTML
    async loadTemplate(niche) {
        const templatePath = path.join(this.templatesDir, `${niche}.html`);

        try {
            return await fs.readFile(templatePath, 'utf-8');
        } catch (error) {
            console.log(`⚠️ Template ${niche}.html não encontrado, usando template geral`);
            return await fs.readFile(path.join(this.templatesDir, 'geral.html'), 'utf-8');
        }
    }

    // Substitui placeholders no template
    fillTemplate(html, data) {
        let filled = html;

        // Substituições básicas
        filled = filled.replace(/\{\{NOME_EMPRESA\}\}/g, data.nome || 'SUA EMPRESA');
        filled = filled.replace(/\{\{TAGLINE\}\}/g, data.descricao || 'Qualidade e Profissionalismo');

        // Contatos
        const whatsapp = data.whatsapp || data.telefone || '(00) 00000-0000';
        filled = filled.replace(/\{\{WHATSAPP\}\}/g, whatsapp);

        const instagram = data.instagram || '@' + (data.nome || 'empresa').toLowerCase().replace(/\s+/g, '');
        filled = filled.replace(/\{\{INSTAGRAM\}\}/g, instagram);

        // Endereço
        let endereco = '';
        if (data.addressStreet && data.addressNumber) {
            endereco = `${data.addressStreet}, ${data.addressNumber}`;
            if (data.addressNeighborhood) endereco += ` - ${data.addressNeighborhood}`;
        } else if (data.addressCity) {
            endereco = data.addressCity;
        } else {
            endereco = 'Consulte nosso endereço';
        }
        filled = filled.replace(/\{\{ENDERECO\}\}/g, endereco);

        return filled;
    }

    // Renderiza template para PNG
    async render(businessData) {
        try {
            console.log('🎨 [TEMPLATE RENDERER] Iniciando renderização...');

            await this.init();

            // Detecta nicho
            const niche = this.detectNiche(businessData);
            console.log(`   Nicho detectado: ${niche}`);

            // Carrega template
            const templateHtml = await this.loadTemplate(niche);
            console.log(`   Template carregado: ${niche}.html`);

            // Preenche com dados
            const filledHtml = this.fillTemplate(templateHtml, businessData);

            // Renderiza com Puppeteer
            const page = await this.browser.newPage();
            await page.setViewport({ width: 1080, height: 1920 });
            await page.setContent(filledHtml, { waitUntil: 'networkidle0' });

            // Captura screenshot
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: false
            });

            await page.close();

            console.log('✅ [TEMPLATE RENDERER] Renderização concluída!');
            return screenshot.toString('base64');

        } catch (error) {
            console.error('❌ [TEMPLATE RENDERER] Erro:', error.message);
            throw error;
        }
    }
}

// Singleton instance
let rendererInstance = null;

async function renderFlyer(businessData) {
    if (!rendererInstance) {
        rendererInstance = new TemplateRenderer();
    }
    return await rendererInstance.render(businessData);
}

async function closeRenderer() {
    if (rendererInstance) {
        await rendererInstance.close();
        rendererInstance = null;
    }
}

module.exports = {
    renderFlyer,
    closeRenderer,
    TemplateRenderer
};
