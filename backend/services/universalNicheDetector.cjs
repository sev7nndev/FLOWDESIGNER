/**
 * UNIVERSAL NICHE DETECTOR
 * Detecta nicho de negócio baseado em palavras-chave
 */

async function detectUniversalNiche(businessData) {
    const text = `${businessData.companyName} ${businessData.details}`.toLowerCase();
    
    const nicheCategories = {
        // Alimentação
        'food': ['restaurante', 'lanchonete', 'pizzaria', 'hamburgueria', 'comida', 'aliment', 'buffet', 'culinária', 'café', 'padaria', 'doceria', 'sorveteria', 'food', 'lanche', 'pizza', 'sushi', 'churrascaria', 'confeitaria', 'pastelaria', 'açaí', 'delivery'],
        
        // Beleza
        'beauty': ['salão', 'beleza', 'estética', 'spa', 'cabelo', 'unha', 'manicure', 'pedicure', 'sobrancelha', 'depilação', 'massagem', 'cosméticos', 'maquiagem', 'barbearia', 'barbeiro', 'tattoo', 'tatuagem', 'piercing'],
        
        // Saúde & Fitness
        'fitness': ['academia', 'fitness', 'personal', 'treino', 'crossfit', 'musculação', 'yoga', 'pilates', 'esporte', 'suplemento', 'nutrição', 'ginástica', 'artes marciais', 'jiu-jitsu', 'karatê'],
        
        // Profissional & Serviços
        'professional': ['advogado', 'advocacia', 'contador', 'contabilidade', 'consultoria', 'consultor', 'escritório', 'jurídico', 'arquiteto', 'engenheiro', 'corretor', 'seguro', 'imobiliária', 'financeiro', 'bancário', 'administrativo'],
        
        // Varejo & Comércio
        'retail': ['loja', 'shop', 'store', 'venda', 'comércio', 'mercado', 'supermercado', 'vestuário', 'roupa', 'calçado', 'eletrônicos', 'presente', 'brinquedo', 'celular', 'móveis', 'decoração'],
        
        // Tecnologia
        'technology': ['tecnologia', 'informática', 'manutenção', 'conserto', 'assistência técnica', 'assistência', 'técnica', 'software', 'hardware', 'internet', 'web', 'site', 'aplicativo', 'app', 'programação', 'desenvolvimento', 'ti'],
        
        // Educação
        'education': ['escola', 'curso', 'treinamento', 'educação', 'faculdade', 'universidade', 'aula', 'professor', 'mentoria', 'idioma', 'inglês', 'espanhol', 'particular', 'reforço', 'ensino'],
        
        // Automotivo
        'automotive': ['mecânica', 'oficina', 'carro', 'automóvel', 'auto', 'peças', 'lavagem', 'polimento', 'funilaria', 'pintura', 'pneu', 'bateria'],
        
        // Construção
        'construction': ['construção', 'reforma', 'pedreiro', 'encanador', 'eletricista', 'pintor', 'serralheria', 'marcenaria', 'jardinagem', 'paisagismo'],
        
        // Eventos
        'events': ['festas', 'casamento', 'formatura', 'aniversário', 'evento', 'buffet infantil', 'decoração', 'som', 'iluminação', 'photobooth', 'brinquedos'],
        
        // Transporte
        'transport': ['transporte', 'mudança', 'frete', 'entregas', 'taxi', 'uber', 'motoboy', 'logística', 'caminhão', 'van'],
        
        // Pet
        'pet': ['pet', 'animal', 'veterinário', 'pet shop', 'gato', 'cachorro', 'ração', 'banho', 'tosa', 'hotel para pets'],
        
        // Casa & Jardim
        'home': ['limpeza', 'faxina', 'dedetização', 'piscina', 'elétrica', 'hidráulica', 'gás', 'ar condicionado', 'alarme', 'portão'],
        
        // Moda
        'fashion': ['moda', 'boutique', 'costura', 'alfaiate', 'modista', 'confecção', 'malhas', 'roupas íntimas', 'lingerie'],
        
        // Arte & Cultura
        'art': ['arte', 'galeria', 'música', 'instrumento', 'teatro', 'cinema', 'fotografia', 'fotógrafo', 'design', 'ilustração'],
        
        // Saúde & Bem-estar
        'health': ['fisioterapia', 'psicólogo', 'nutricionista', 'massoterapia', 'acupuntura', 'quiropraxia', 'ortomolecular', 'meditação', 'clínica', 'médico', 'dentista', 'odontologia']
    };

    // Contar ocorrências
    const scores = {};
    
    for (const [niche, keywords] of Object.entries(nicheCategories)) {
        scores[niche] = keywords.filter(keyword => text.includes(keyword)).length;
    }

    // Encontrar nicho com maior score
    let bestNiche = 'professional';
    let bestScore = 0;

    for (const [niche, score] of Object.entries(scores)) {
        if (score > bestScore) {
            bestScore = score;
            bestNiche = niche;
        }
    }

    console.log(`✅ Nicho detectado: ${bestNiche} (score: ${bestScore})`);
    return bestNiche;
}

module.exports = {
    detectUniversalNiche
};
