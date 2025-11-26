
import { AppSettings, BusinessInfo } from "../types";

// --- FALLBACK IMAGES (HIGH QUALITY MOCKUPS - NANO BANANA STYLE SIMULATION) ---
const FALLBACK_IMAGES = {
  mechanic: [
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1000&auto=format&fit=crop", // Oficina Dark Blue
    "https://images.unsplash.com/photo-1486262715619-01b80250e0dc?q=80&w=1000&auto=format&fit=crop", // Motor Detail
    "https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=1000&auto=format&fit=crop"  // Ferramentas Artisticas
  ],
  food: [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop", // Burger 3D Style
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop", // Sushi Dark
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop"  // Pizza Splash
  ],
  pet: [
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop", // Dog Studio
    "https://images.unsplash.com/photo-1450778865369-0994ca87d976?q=80&w=1000&auto=format&fit=crop", // Cute Dog
    "https://images.unsplash.com/photo-1597843786411-a79522a327e8?q=80&w=1000&auto=format&fit=crop"  // Cat Studio
  ],
  tech: [
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1000&auto=format&fit=crop", // Neon Circuit
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto=format&fit=crop"  // Gadgets Headphones
  ],
  law: [
    "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=1000&auto=format&fit=crop", // Clean Office
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000&auto=format&fit=crop"  // Justice Scale Gold
  ],
  beauty: [
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1000&auto=format&fit=crop", // Skincare
    "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=1000&auto=format&fit=crop"  // Salon Interior
  ],
  retail: [
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop", // Sale Tag
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop"  // Shopping Bags
  ],
  generic: [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"   // Abstract 3D Fluid
  ]
};

// Helper para selecionar a imagem correta baseada no texto do usuário
const getFallbackImage = (prompt: string): string => {
  const p = prompt.toLowerCase();
  let category = 'generic';

  if (p.match(/(carro|moto|oficina|mecânica|pneu|automóveis|lanternagem|revisão|freio|motor)/)) category = 'mechanic';
  else if (p.match(/(pizza|lanche|hambúrguer|comida|restaurante|sabor|fome|delivery|açaí|sushi|churrasco|burger)/)) category = 'food';
  else if (p.match(/(estética|beleza|unha|cabelo|maquiagem|botox|pele|salão|cílios|sobrancelha)/)) category = 'beauty';
  else if (p.match(/(celular|fone|eletrônico|computador|tech|iphone|conserto|smartphone|notebook|gamer)/)) category = 'tech';
  else if (p.match(/(pet|cão|gato|banho|tosa|veterinário|ração|cachorro|bicho|animal)/)) category = 'pet';
  else if (p.match(/(advogado|direito|lei|trabalhista|jurídico|escritório|causa|processo)/)) category = 'law';
  else if (p.match(/(loja|roupa|moda|oferta|promoção|venda|preço|black friday|desconto|sale)/)) category = 'retail';

  // Retorna uma imagem aleatória da categoria para dar variedade
  const images = (FALLBACK_IMAGES as any)[category];
  return images[Math.floor(Math.random() * images.length)];
};

// --- CÉREBRO OFFLINE (FALLBACK) ---
const generateOfflinePrompt = (info: BusinessInfo): string => {
  const text = (info.companyName + " " + info.details).toLowerCase();
  
  const styles = {
    mechanic: `Masterpiece 3D commercial render for Automotive Workshop. Dark metallic environment, neon orange rim lights, brushed metal textures. Floating 3D chrome tools (wrench, piston) and car parts. Floor is reflective wet concrete. Smoky, cinematic atmosphere. Text space in center. Octane render, 8k.`,
    food: `Mouth-watering 3D food photography for Gastronomy. Flying 3D ingredients (fresh tomato, cheese, basil, flour clouds) frozen in mid-air. Warm studio lighting, vibrant colors (red, yellow). Macro details, depth of field. Appetizing, delicious look. 8k resolution.`,
    beauty: `Luxury beauty salon 3D aesthetic. Soft pink and gold color palette, marble textures. Floating 3D cosmetics elements (lipstick, brushes, bubbles, flowers). Soft studio lighting, bokeh effect, elegant and clean composition. High-end fashion magazine style.`,
    tech: `Futuristic technology background. Cyber blue and purple neon lights, glassmorphism textures. Floating 3D gadgets (headphones, chips, circuit boards). Data streams visuals. Clean, modern, apple-style advertising render. Octane render, 8k.`,
    pet: `Cute Disney-Pixar style 3D environment for Pet Shop. Soft cyan and white color palette. Floating 3D pet accessories (bones, rubber balls, scissors, bubbles). Soft volumetric lighting, furry textures, friendly and welcoming atmosphere. Clean center composition.`,
    law: `Professional law office background. Dark blue and gold luxury palette. Mahogany wood textures, floating 3D scales of justice and gavel. Library background with depth of field. Serious, trustworthy, corporate aesthetic.`,
    retail: `Vibrant retail sale background. Red and yellow confetti, 3D rendered balloons. Floating 3D "%" symbols and gift boxes. Energetic, urgent atmosphere, high contrast. Perfect for Black Friday or Sales flyers.`
  };

  if (text.match(/(carro|moto|oficina|mecânica|pneu|óleo|motor|automóveis|lanternagem|revisão|freio)/)) return styles.mechanic;
  if (text.match(/(pizza|lanche|hambúrguer|comida|restaurante|sabor|fome|delivery|açaí|sushi|churrasco)/)) return styles.food;
  if (text.match(/(estética|beleza|unha|cabelo|maquiagem|botox|pele|salão|cílios|sobrancelha)/)) return styles.beauty;
  if (text.match(/(celular|fone|eletrônico|computador|tech|iphone|conserto|smartphone|notebook)/)) return styles.tech;
  if (text.match(/(pet|cão|gato|banho|tosa|veterinário|ração|cachorro|bicho)/)) return styles.pet;
  if (text.match(/(advogado|direito|lei|trabalhista|jurídico|escritório|causa|processo)/)) return styles.law;
  if (text.match(/(loja|roupa|moda|oferta|promoção|venda|preço|black friday|desconto)/)) return styles.retail;

  return `Premium abstract 3D background for commercial flyer. ${info.companyName} theme. Elegant gradients, floating geometric shapes, studio lighting, clean negative space in center. Glass and metal textures, professional corporate identity, 8k resolution, octane render.`;
};

// Passo 1: PERPLEXITY (O Cérebro - Diretor de Arte 3D)
export const createProfessionalPrompt = async (info: BusinessInfo, keys: AppSettings): Promise<string> => {
  // Se não tiver chave, usa o fallback
  if (!keys.perplexityKey) return generateOfflinePrompt(info);

  try {
    const systemPrompt = `
      You are an elite 3D Art Director specializing in "Commercial Advertising" & "Product Visualization".
      YOUR GOAL: Create a highly detailed text prompt for an image generator to create a **3D Commercial Flyer Background**.
      CLIENT DATA: Business: "${info.companyName}", Description: "${info.details}".
      STYLE: High-end 3D, Floating Elements, Studio Lighting, 8K, Octane Render.
    `;

    // PROXY CORS para Perplexity
    const proxyUrl = "https://corsproxy.io/?";
    const targetUrl = "https://api.perplexity.ai/chat/completions";

    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${keys.perplexityKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          { role: "system", content: "You are a prompt engineering expert." },
          { role: "user", content: systemPrompt }
        ],
        temperature: 0.6
      })
    });

    if (!response.ok) {
      // Se o proxy falhar, usa fallback
      return generateOfflinePrompt(info);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || generateOfflinePrompt(info);

  } catch (error) {
    // Erro real de rede -> Offline
    return generateOfflinePrompt(info);
  }
};

// Passo 2: FREEPIK (O Artista - Nano Banana Style)
export const generateImage = async (refinedPrompt: string, logoBase64: string | undefined, keys: AppSettings, info?: BusinessInfo): Promise<string> => {
  if (!keys.freepikKey) return getFallbackImage(refinedPrompt);

  try {
    const styleSuffix = `commercial flyer background, 3d render style, octane render, unreal engine 5, volumetric lighting, glossy textures, floating 3d elements, advertising masterpiece, 8k resolution, highly detailed, studio photography, no text, no watermark, vertical orientation`;
    const finalPrompt = `${refinedPrompt}, ${styleSuffix}`;

    // PROXY CORS para Freepik - Garantir HTTPS na URL do proxy
    const proxyUrl = "https://corsproxy.io/?";
    const targetUrl = "https://api.freepik.com/v1/ai/text-to-image";

    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
      method: "POST",
      headers: {
        "x-freepik-api-key": keys.freepikKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        num_images: 1,
        image: { size: "portrait_4_3" },
        styling: { style: "digital_art", color: "vibrant", lighting: "studio", framing: "portrait" }
      })
    });

    if (!response.ok) {
      console.warn(`Freepik API Error via Proxy (${response.status}). Fallback.`);
      return getFallbackImage(refinedPrompt);
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return `data:image/png;base64,${data.data[0].base64}`;
    }
    
    return getFallbackImage(refinedPrompt);

  } catch (error) {
    console.log("Erro crítico na chamada API. Usando Mockup.");
    return getFallbackImage(refinedPrompt);
  }
};
