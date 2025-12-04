const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { supabaseServiceRole, GEMINI_API_KEY } = require('../config.cjs');

// Geração de prompt detalhado
const generateDetailedPrompt = (promptInfo) => {
  const { companyName, phone, addressStreet, addressNumber, addressNeighborhood, addressCity, details } = promptInfo;

  const address = [addressStreet, addressNumber, addressNeighborhood, addressCity].filter(Boolean).join(', ');
  const servicesList = details.split(/[.;]/).map(s => s.trim()).filter(s => s.length > 5).join(', ');

  return `Crie um design de FLYER VERTICAL (proporção 9:16) de alta conversão, profissional e moderno, para mídias sociais e impressão. O estilo deve ser hiper-detalhado, cinematográfico e visualmente impactante, adequado para uma campanha de marketing premium.

REQUISITOS CRÍTICOS:
- O flyer deve preencher TODA a área da imagem - SEM bordas, molduras, sombras ou mockups ao redor. A imagem É o design final.
- Use iluminação de alto contraste, sombras profundas e cores vibrantes.
- Concentre-se em um único elemento visual poderoso (produto, serviço ou conceito).
- O resultado final deve ser um flyer completo, pronto para uso, sem fundos adicionais.
- **IMPORTANTE: NÃO GERE TEXTO GENÉRICO, INCOMPLETO OU INCORRETO. USE APENAS AS INFORMAÇÕES FORNECIDAS ABAIXO.**

INFORMAÇÕES DO NEGÓCIO:
Empresa: ${companyName}
Serviços/Produtos/Oferta: ${servicesList}
Telefone/WhatsApp: ${phone}
Endereço: ${address}

ESPECIFICAÇÕES DE DESIGN:
1. LAYOUT: Layout vertical dinâmico e profissional. Separação clara entre áreas visuais e de texto.
2. TIPOGRAFIA: Use fontes sans-serif ousadas e modernas para manchetes. O texto deve ser altamente legível e integrado ao design.
3. CORES: Selecione uma paleta de cores que contraste fortemente com o fundo para máximo impacto.
4. COMPOSIÇÃO: 
   - Nome da empresa/logo em destaque.
   - Oferta principal/CTA (Call to Action) em texto grande e chamativo.
   - Informações de contato (telefone/WhatsApp) claramente visíveis na parte inferior ou centro-direita.
   - **Se for necessário incluir preço, use o formato brasileiro (Ex: R$ 99,90).**
5. ESTILO: Publicidade de alto nível, arte digital, iluminação cinematográfica, resolução 8K, ultra-detalhado, design de marketing de alta conversão.`;
};

// Geração de imagem com Imagen 4
async function generateImage(detailedPrompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Configuração do servidor incompleta: A chave GEMINI_API_KEY está ausente.');
  }

  try {
    // Using Imagen 4 via REST API
    const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;

    const payload = {
      instances: [
        { prompt: detailedPrompt }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "9:16", // Vertical for flyers
        // outputOptions: { mimeType: "image/png" } // Default is PNG
      }
    };

    const response = await axios.post(IMAGEN_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    const base64Image = response.data?.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      console.error('Resposta inesperada do Imagen:', JSON.stringify(response.data, null, 2));
      throw new Error('Nenhuma imagem retornada pelo modelo.');
    }

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    // Loga a resposta de erro completa para diagnóstico
    console.error('Erro ao gerar imagem com Imagen:', error.response?.data || error.message);

    // Fallback friendly message
    if (error.response?.status === 404) {
      throw new Error('Modelo de imagem não encontrado. Verifique se sua API Key tem acesso ao Imagen 3.');
    }
    throw new Error('Falha ao gerar imagem. Tente novamente mais tarde.');
  }
}

// Upload Supabase
async function uploadImageToSupabase(imageDataUrl, userId) {
  if (!supabaseServiceRole) throw new Error('Supabase Service Role Client ausente.');

  try {
    const matches = imageDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error('Formato de base64 inválido.');

    const contentType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const filePath = `images/${userId}/${uuidv4()}.png`; // Use 'images' bucket

    const { data, error } = await supabaseServiceRole.storage
      .from('images')
      .upload(filePath, imageBuffer, {
        contentType,
        upsert: false
      });

    if (error) throw new Error(`Erro no upload: ${error.message}`);

    return data.path;
  } catch (e) {
    console.error('Erro upload:', e);
    throw e;
  }
}

module.exports = {
  generateDetailedPrompt,
  generateImage,
  uploadImageToSupabase,
};