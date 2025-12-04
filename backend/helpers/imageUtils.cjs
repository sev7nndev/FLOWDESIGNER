const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { supabaseServiceRole, GEMINI_API_KEY } = require('../config.cjs');

// Geração de prompt detalhado
const generateDetailedPrompt = (promptInfo) => {
  const { companyName, phone, addressStreet, addressNumber, addressNeighborhood, addressCity, details } = promptInfo;

  const address = [addressStreet, addressNumber, addressNeighborhood, addressCity].filter(Boolean).join(', ');
  const servicesList = details.split(/[.;]/).map(s => s.trim()).filter(s => s.length > 5).join(', ');

  return `Create a professional VERTICAL FLYER design (9:16 aspect ratio) for social media and printing.

CRITICAL REQUIREMENTS:
- The flyer must fill the ENTIRE image area - NO backgrounds, frames, shadows, or mockups around it
- The flyer itself IS the complete image - edge to edge
- Design should be ready to post/print directly without any cropping needed

BUSINESS INFORMATION:
Company: ${companyName}
Services/Products: ${servicesList}
Phone/WhatsApp: ${phone}
Address: ${address}

DESIGN SPECIFICATIONS:
1. LAYOUT: Modern, professional vertical flyer layout with clear visual hierarchy
2. TYPOGRAPHY: Bold, readable fonts for headlines; clean fonts for body text
3. COLORS: Vibrant, eye-catching color scheme appropriate for the business niche (${details})
4. COMPOSITION: 
   - Company name/logo prominently at top
   - Main message/offer in the center with large, bold text
   - Services/products listed clearly with icons or bullet points
   - Contact information (phone/WhatsApp) highly visible at bottom
   - Address included if space permits
5. VISUAL ELEMENTS:
   - High-quality imagery related to the business
   - Professional graphics, icons, or illustrations
   - Balanced use of negative space
   - Modern design trends (gradients, geometric shapes, etc.)
6. STYLE: Contemporary, polished, and marketing-focused design that grabs attention

The final output must be a complete, ready-to-use flyer with no additional backgrounds or frames.`;
};

// Geração de imagem com Gemini 2.5 Image
// Geração de imagem com Imagen 3
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