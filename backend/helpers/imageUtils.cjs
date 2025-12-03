const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { supabaseServiceRole, GEMINI_API_KEY } = require('../config.cjs');

// Geração de prompt detalhado
const generateDetailedPrompt = (promptInfo) => {
  const { companyName, phone, addressStreet, addressNumber, addressNeighborhood, addressCity, details } = promptInfo;

  const address = [addressStreet, addressNumber, addressNeighborhood, addressCity].filter(Boolean).join(', ');
  const servicesList = details.split(/[.;]/).map(s => s.trim()).filter(s => s.length > 5).join(', ');

  return `Você é um designer profissional de social media. Gere uma arte de FLYER VERTICAL em alta qualidade, estilo moderno e atraente.
Nicho: ${details}.
Informações de contato e negócio:
- Nome da Empresa: ${companyName}
- Serviços/Detalhes: ${servicesList}
- Telefone/WhatsApp: ${phone}
- Endereço: ${address}`;
};

// Geração de imagem com Gemini 2.5 Image
// Geração de imagem com Imagen 3
async function generateImage(detailedPrompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Configuração do servidor incompleta: A chave GEMINI_API_KEY está ausente.');
  }

  try {
    // Using Imagen 3 via REST API
    const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;

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