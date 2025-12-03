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
async function generateImage(detailedPrompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Configuração do servidor incompleta: A chave GEMINI_API_KEY está ausente.');
  }

  try {
    const GEMINI_IMAGE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-image:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: detailedPrompt }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "image/png"
      }
    };

    const response = await axios.post(GEMINI_IMAGE_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    const base64Image = response.data?.candidates?.[0]?.content?.[0]?.inlineData?.data;
    if (!base64Image) throw new Error('Nenhuma imagem gerada pelo Gemini.');

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    // Loga a resposta de erro completa do Gemini para diagnóstico
    console.error('Erro ao gerar imagem com Gemini:', error.response?.data || error.message);
    throw new Error('Falha ao gerar imagem. Verifique a GEMINI_API_KEY e se ela tem acesso a imagens.');
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