// GERADOR DE TEMPLATES PREMIUM PARA TODOS OS NICHOS
// Cria templates HTML/CSS profissionais baseados no padrão Nano Banana

const fs = require('fs').promises;
const path = require('path');

const TEMPLATE_CONFIGS = {
    hamburgueria: {
        colors: {
            primary: '#1A1A1A',
            secondary: '#FFD700',
            accent: '#DC143C',
            gradient: 'linear-gradient(135deg, #1A1A1A 0%, #8B4513 50%, #FFD700 100%)'
        },
        headline: 'O Melhor Burger Gourmet!',
        subheadline: 'Suculento, Artesanal e Irresistível',
        emoji: '🍔',
        badge: '🔥 Promoção',
        features: [
            { icon: '🥩', text: 'Carne Premium' },
            { icon: '🧀', text: 'Queijos Especiais' },
            { icon: '🥓', text: 'Bacon Crocante' },
            { icon: '🍟', text: 'Batatas Artesanais' }
        ],
        cta: 'Peça Já!'
    },

    barbearia: {
        colors: {
            primary: '#3E2723',
            secondary: '#B8860B',
            accent: '#F5E6D3',
            gradient: 'linear-gradient(135deg, #3E2723 0%, #000000 50%, #B8860B 100%)'
        },
        headline: 'Estilo e Tradição',
        subheadline: 'Cortes Clássicos e Modernos',
        emoji: '💈',
        badge: '✂️ Premium',
        features: [
            { icon: '✂️', text: 'Corte Profissional' },
            { icon: '🪒', text: 'Barba na Navalha' },
            { icon: '💆', text: 'Tratamentos' },
            { icon: '🎩', text: 'Estilo Único' }
        ],
        cta: 'Agende Agora!'
    },

    academia: {
        colors: {
            primary: '#000000',
            secondary: '#0066FF',
            accent: '#00FFFF',
            gradient: 'linear-gradient(135deg, #000000 0%, #0066FF 50%, #00FFFF 100%)'
        },
        headline: 'Transforme Seu Corpo!',
        subheadline: 'Treinos Personalizados e Resultados Reais',
        emoji: '💪',
        badge: '⚡ Energia',
        features: [
            { icon: '🏋️', text: 'Musculação' },
            { icon: '🤸', text: 'Funcional' },
            { icon: '👨‍🏫', text: 'Personal Trainer' },
            { icon: '📊', text: 'Avaliação Física' }
        ],
        cta: 'Comece Hoje!'
    },

    beleza: {
        colors: {
            primary: '#FFB6C1',
            secondary: '#B76E79',
            accent: '#FFFFFF',
            gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 50%, #B76E79 100%)'
        },
        headline: 'Beleza e Bem-Estar',
        subheadline: 'Realce Sua Beleza Natural',
        emoji: '💅',
        badge: '✨ Glamour',
        features: [
            { icon: '💇', text: 'Cabelo' },
            { icon: '💅', text: 'Unhas' },
            { icon: '💄', text: 'Maquiagem' },
            { icon: '🧖', text: 'Estética' }
        ],
        cta: 'Agende Seu Horário!'
    },

    bar: {
        colors: {
            primary: '#DC143C',
            secondary: '#FFD700',
            accent: '#FFFFFF',
            gradient: 'linear-gradient(135deg, #DC143C 0%, #8B0000 50%, #1A1A1A 100%)'
        },
        headline: 'Diversão e Sabor!',
        subheadline: 'O Melhor Happy Hour da Cidade',
        emoji: '🍺',
        badge: '🎉 Promoção',
        features: [
            { icon: '🍺', text: 'Cervejas Geladas' },
            { icon: '🍖', text: 'Petiscos' },
            { icon: '⚽', text: 'Jogos ao Vivo' },
            { icon: '🎵', text: 'Música' }
        ],
        cta: 'Vem Pro Bar!'
    },

    festa: {
        colors: {
            primary: '#FF1493',
            secondary: '#9C27B0',
            accent: '#FFD700',
            gradient: 'linear-gradient(135deg, #FF1493 0%, #9C27B0 50%, #4A148C 100%)'
        },
        headline: 'Festa Inesquecível!',
        subheadline: 'Diversão Garantida Para Todos',
        emoji: '🎉',
        badge: '🎊 Evento',
        features: [
            { icon: '🎭', text: 'Animação' },
            { icon: '🎵', text: 'DJ' },
            { icon: '🍰', text: 'Buffet' },
            { icon: '📸', text: 'Fotos' }
        ],
        cta: 'Reserve Já!'
    }
};

function generateTemplate(niche, config) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1080, height=1920">
    <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Sora:wght@600;700&family=Manrope:wght@800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            width: 1080px;
            height: 1920px;
            font-family: 'Sora', sans-serif;
            background: ${config.colors.gradient};
            position: relative;
            overflow: hidden;
        }

        .mesh-gradient {
            position: absolute;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 30%, ${config.colors.primary}80 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, ${config.colors.accent}40 0%, transparent 50%);
            filter: blur(80px);
        }

        .grain {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=');
            opacity: 0.3;
            mix-blend-mode: overlay;
        }

        .header {
            position: relative;
            z-index: 10;
            padding: 60px 64px 40px;
            text-align: center;
        }

        .logo {
            font-family: 'Archivo Black', sans-serif;
            font-size: 88px;
            color: white;
            text-shadow: 
                0 0 30px ${config.colors.secondary}80,
                0 4px 20px rgba(0, 0, 0, 0.8);
            letter-spacing: 3px;
        }

        .badge {
            position: absolute;
            top: 60px;
            right: 80px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(20px);
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50px;
            padding: 14px 32px;
            font-family: 'Manrope', sans-serif;
            font-size: 20px;
            font-weight: 800;
            color: white;
            text-transform: uppercase;
        }

        .hero {
            position: relative;
            z-index: 5;
            padding: 40px 64px;
            text-align: center;
        }

        .headline {
            font-family: 'Archivo Black', sans-serif;
            font-size: 68px;
            line-height: 1.1;
            color: white;
            text-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
            margin-bottom: 24px;
        }

        .subheadline {
            font-family: 'Sora', sans-serif;
            font-size: 32px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
            margin-bottom: 50px;
        }

        .hero-icon {
            width: 100%;
            height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 280px;
            filter: drop-shadow(0 30px 60px rgba(0, 0, 0, 0.5));
            margin: 40px 0;
        }

        .features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin: 50px 0;
        }

        .feature-card {
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            padding: 32px;
            text-align: center;
        }

        .feature-icon {
            font-size: 64px;
            margin-bottom: 16px;
        }

        .feature-text {
            font-family: 'Sora', sans-serif;
            font-size: 24px;
            font-weight: 700;
            color: white;
        }

        .cta {
            position: relative;
            z-index: 10;
            padding: 40px 64px;
            text-align: center;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, ${config.colors.secondary} 0%, ${config.colors.accent} 100%);
            color: ${config.colors.primary};
            font-family: 'Manrope', sans-serif;
            font-size: 40px;
            font-weight: 800;
            padding: 28px 90px;
            border-radius: 70px;
            text-transform: uppercase;
            box-shadow: 
                0 15px 50px ${config.colors.secondary}60,
                inset 0 -4px 12px rgba(0, 0, 0, 0.2);
            border: 4px solid rgba(255, 255, 255, 0.3);
        }

        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 10;
            background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.9) 30%);
            padding: 100px 64px 50px;
        }

        .contact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 20px;
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 24px;
            border: 2px solid rgba(255, 255, 255, 0.15);
        }

        .contact-icon {
            width: 56px;
            height: 56px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
        }

        .contact-text {
            font-family: 'Sora', sans-serif;
            font-size: 22px;
            font-weight: 700;
            color: white;
        }

        .social {
            text-align: center;
            margin-top: 24px;
            font-family: 'Sora', sans-serif;
            font-size: 26px;
            font-weight: 700;
            color: white;
        }
    </style>
</head>
<body>
    <div class="mesh-gradient"></div>
    <div class="grain"></div>
    <div class="badge">${config.badge}</div>

    <div class="header">
        <div class="logo">{{NOME_EMPRESA}}</div>
    </div>

    <div class="hero">
        <h1 class="headline">${config.headline}</h1>
        <p class="subheadline">${config.subheadline}</p>
        
        <div class="hero-icon">${config.emoji}</div>

        <div class="features">
            ${config.features.map(f => `
            <div class="feature-card">
                <div class="feature-icon">${f.icon}</div>
                <div class="feature-text">${f.text}</div>
            </div>`).join('')}
        </div>
    </div>

    <div class="cta">
        <div class="cta-button">${config.cta}</div>
    </div>

    <div class="footer">
        <div class="contact-grid">
            <div class="contact-item">
                <div class="contact-icon">📱</div>
                <div class="contact-text">{{WHATSAPP}}</div>
            </div>
            <div class="contact-item">
                <div class="contact-icon">📍</div>
                <div class="contact-text">{{ENDERECO}}</div>
            </div>
        </div>
        <div class="social">📷 {{INSTAGRAM}}</div>
    </div>
</body>
</html>`;
}

async function generateAllTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    console.log('🎨 Gerando templates premium para todos os nichos...\n');

    for (const [niche, config] of Object.entries(TEMPLATE_CONFIGS)) {
        const html = generateTemplate(niche, config);
        const filepath = path.join(templatesDir, `${niche}.html`);

        await fs.writeFile(filepath, html, 'utf-8');
        console.log(`✅ ${niche}.html criado`);
    }

    console.log(`\n🎉 ${Object.keys(TEMPLATE_CONFIGS).length} templates criados com sucesso!`);
}

// Executar se chamado diretamente
if (require.main === module) {
    generateAllTemplates().catch(console.error);
}

module.exports = { generateAllTemplates, TEMPLATE_CONFIGS };
