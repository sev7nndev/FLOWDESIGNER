// 8 TEMPLATES DE FOOTER PROFISSIONAIS - GARANTINDO CONSISTÊNCIA DE NICHO
// Todos os templates usam data.nome para garantir que o nome correto apareça

const FOOTER_TEMPLATES = {
    // Template 1: Barra com nome da empresa
    social_bar: (data) => `
        <div class="footer-social-bar">
            <div class="social-brand">${data.nome || 'SUA EMPRESA'}</div>
            <div class="social-contacts">
                ${data.whatsapp || data.telefone ? `<span>📱 ${data.whatsapp || data.telefone}</span>` : ''}
                ${formatAddress(data) ? `<span>📍 ${formatAddress(data)}</span>` : ''}
                ${data.instagram ? `<span>📷 ${data.instagram}</span>` : ''}
            </div>
        </div>
        <style>
            .footer-social-bar { position: absolute; top: 1750px; left: 0; right: 0; height: 170px; background: #1a1a1a; padding: 20px 40px; border-top: 3px solid #FFD700; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
            .social-brand { font-size: 28px; font-weight: 900; color: white; text-transform: uppercase; text-align: center; letter-spacing: 2px; }
            .social-contacts { display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap; }
            .social-contacts span { font-size: 14px; font-weight: 700; color: white; }
        </style>
    `,

    // Template 2: Grid com nome
    split_info: (data) => `
        <div class="footer-split">
            <div class="split-section"><div class="split-content">${data.nome || 'SUA EMPRESA'}</div></div>
            <div class="split-section"><div class="split-content">${data.whatsapp || data.telefone || ''} • ${formatAddress(data)}</div></div>
        </div>
        <style>
            .footer-split { position: absolute; top: 1750px; left: 0; right: 0; height: 170px; background: rgba(0,0,0,0.95); padding: 20px 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; }
            .split-content { font-size: 20px; font-weight: 700; color: white; text-align: center; }
        </style>
    `,

    // Template 3: Barra verde com nome
    green_bar: (data) => `
        <div class="footer-green-bar">
            <div class="green-logo">${data.nome || 'SUA EMPRESA'}</div>
            <div class="green-contact">
                ${data.whatsapp || data.telefone ? `<span>📱 ${data.whatsapp || data.telefone}</span>` : ''}
                ${formatAddress(data) ? `<span>📍 ${formatAddress(data)}</span>` : ''}
            </div>
        </div>
        <style>
            .footer-green-bar { position: absolute; top: 1750px; left: 0; right: 0; height: 170px; background: linear-gradient(90deg, #1a5f1a 0%, #2d8b2d 100%); padding: 20px 50px; display: flex; justify-content: space-between; align-items: center; border-top: 4px solid #FFD700; }
            .green-logo { font-size: 24px; font-weight: 900; color: white; background: rgba(0,0,0,0.3); padding: 10px 20px; border-radius: 8px; }
            .green-contact { display: flex; gap: 25px; align-items: center; }
            .green-contact span { font-size: 16px; font-weight: 700; color: white; }
        </style>
    `,

    // Template 4: Simples com nome
    simple_bar: (data) => `
        <div class="footer-simple">
            <div class="simple-item">${data.nome || 'SUA EMPRESA'}</div>
            ${data.whatsapp || data.telefone ? `<div class="simple-item">📱 ${data.whatsapp || data.telefone}</div>` : ''}
            ${formatAddress(data) ? `<div class="simple-item">📍 ${formatAddress(data)}</div>` : ''}
        </div>
        <style>
            .footer-simple { position: absolute; top: 1750px; left: 0; right: 0; height: 170px; background: linear-gradient(90deg, #1a5f1a 0%, #2d8b2d 100%); padding: 20px 50px; display: flex; justify-content: space-around; align-items: center; }
            .simple-item { font-size: 18px; font-weight: 700; color: white; }
        </style>
    `,

    // Template 5: Evento com nome centralizado
    event_style: (data) => `
        <div class="footer-event">
            <div class="event-main">
                <div class="event-name">${data.nome || 'SUA EMPRESA'}</div>
                <div class="event-details">${data.whatsapp || data.telefone || ''} • ${formatAddress(data)} • ${data.instagram || ''}</div>
            </div>
        </div>
        <style>
            .footer-event { position: absolute; top: 1750px; left: 0; right: 0; height: 170px; background: rgba(139, 0, 0, 0.95); padding: 25px 50px; display: flex; align-items: center; justify-content: center; }
            .event-main { text-align: center; }
            .event-name { font-size: 36px; font-weight: 900; color: white; text-transform: uppercase; margin-bottom: 12px; text-shadow: 0 4px 12px rgba(0,0,0,0.8); }
            .event-details { font-size: 16px; font-weight: 700; color: white; letter-spacing: 1px; }
        </style>
    `,

    // Template 6: Cards com nome
    gradient_bar: (data) => `
        <div class="footer-gradient">
            <div class="gradient-brand">${data.nome || 'SUA EMPRESA'}</div>
            <div class="gradient-contacts">
                ${data.whatsapp || data.telefone ? `<span>📱 ${data.whatsapp || data.telefone}</span>` : ''}
                ${formatAddress(data) ? `<span>📍 ${formatAddress(data)}</span>` : ''}
                ${data.instagram ? `<span>📷 ${data.instagram}</span>` : ''}
            </div>
        </div>
        <style>
            .footer-gradient { position: absolute; top: 1750px; left: 0; right: 0; height: 170px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 50px; display: flex; flex-direction: column; justify-content: center; gap: 12px; }
            .gradient-brand { font-size: 28px; font-weight: 900; color: white; text-align: center; text-transform: uppercase; }
            .gradient-contacts { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
            .gradient-contacts span { font-size: 14px; font-weight: 700; color: white; }
        </style>
    `,

    // Template 7: Minimalista com nome
    minimal_modern: (data) => `
        <div class="footer-minimal">
            <div class="minimal-divider"></div>
            <div class="minimal-content">
                <div class="minimal-brand">${data.nome || 'SUA EMPRESA'}</div>
                <div class="minimal-contacts">
                    ${data.whatsapp || data.telefone ? `<span>📱 ${data.whatsapp || data.telefone}</span>` : ''}
                    ${formatAddress(data) ? `<span>📍 ${formatAddress(data)}</span>` : ''}
                    ${data.instagram ? `<span>📷 ${data.instagram}</span>` : ''}
                </div>
            </div>
        </div>
        <style>
            .footer-minimal { position: absolute; top: 1750px; left: 0; right: 0; height: 170px; background: rgba(0,0,0,0.9); padding: 20px 60px; }
            .minimal-divider { height: 2px; background: linear-gradient(90deg, transparent 0%, white 50%, transparent 100%); margin-bottom: 15px; }
            .minimal-content { text-align: center; }
            .minimal-brand { font-size: 28px; font-weight: 900; color: white; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
            .minimal-contacts { font-size: 14px; font-weight: 600; color: white; display: flex; justify-content: center; align-items: center; gap: 15px; flex-wrap: wrap; }
        </style>
    `,

    // Template 8: Bold com nome
    bold_contact: (data) => `
        <div class="footer-bold">
            <div class="bold-main">
                <div class="bold-name">${data.nome || 'SUA EMPRESA'}</div>
                <div class="bold-phone">📱 ${data.whatsapp || data.telefone || ''}</div>
            </div>
            <div class="bold-secondary">
                ${formatAddress(data) ? `<span>📍 ${formatAddress(data)}</span>` : ''}
                ${data.instagram ? `<span>📷 ${data.instagram}</span>` : ''}
            </div>
        </div>
        <style>
            .footer-bold { position: absolute; top: 1750px; left: 0; right: 0; height: 170px; background: rgba(0,0,0,0.95); padding: 20px 60px; }
            .bold-main { text-align: center; margin-bottom: 15px; }
            .bold-name { font-size: 24px; font-weight: 900; color: white; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
            .bold-phone { font-size: 28px; font-weight: 900; color: white; text-shadow: 0 4px 15px rgba(0,0,0,0.8); }
            .bold-secondary { display: flex; justify-content: center; gap: 30px; font-size: 16px; font-weight: 700; color: white; }
        </style>
    `
};

// Mapeamento de nicho para template ideal
const NICHE_TO_TEMPLATE = {
    petshop: 'gradient_bar',
    pizzaria: 'event_style',
    hamburgueria: 'bold_contact',
    mecanica: 'simple_bar',
    barbearia: 'minimal_modern',
    academia: 'social_bar',
    beleza: 'gradient_bar',
    bar: 'event_style',
    festa: 'event_style',
    despachante: 'split_info'
};

function formatAddress(data) {
    if (data.addressStreet && data.addressNumber) {
        let addr = `${data.addressStreet}, ${data.addressNumber}`;
        if (data.addressNeighborhood) addr += ` - ${data.addressNeighborhood}`;
        if (data.addressCity) addr += `, ${data.addressCity}`;
        return addr;
    }
    return data.addressCity || '';
}

function getFooterHTML(niche, businessData) {
    const templateName = NICHE_TO_TEMPLATE[niche] || 'social_bar';
    const templateFunc = FOOTER_TEMPLATES[templateName];
    return templateFunc(businessData);
}

module.exports = {
    FOOTER_TEMPLATES,
    NICHE_TO_TEMPLATE,
    getFooterHTML
};
