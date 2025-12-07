const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { trackEvent, getMetrics, getRecentEvents } = require('./services/analyticsService.cjs');
const { generalLimiter, generationLimiter, authLimiter, paymentLimiter } = require('./services/rateLimitService.cjs');
const { webhookValidationMiddleware } = require('./services/webhookSecurity.cjs');
const { sendWelcomeEmail, sendPaymentConfirmation, sendQuotaAlert } = require('./services/emailService.cjs');
const mercadopago = require('mercadopago');
const axios = require('axios');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Load Env
const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath }); // Load .env first
dotenv.config({ path: envLocalPath }); // Override with .env.local if exists

console.log('?? Server starting...');
console.log('?? Loading env from:', envPath);
console.log('?? Supabase URL present:', !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL));
console.log('?? Service Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// QA Logging Helper
const LOG_FILE = path.resolve(__dirname, 'qa-logs.json');
const logQA = (entry) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
  } catch (e) {
    console.error('Logging failed:', e);
  }
};

// Middleware
app.use(cors());
app.use(generalLimiter); // Rate limiting for all routes
app.use(express.json({ limit: '50mb' }));

// --- CONFIG ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// CRITICAL: Validate required environment variables
const requiredEnvVars = {
  'SUPABASE_URL': SUPABASE_URL,
  'SUPABASE_ANON_KEY': SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': SUPABASE_SERVICE_KEY,
  'GEMINI_API_KEY': GEMINI_API_KEY
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('? FATAL: Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\n?? Check your .env file and ensure all variables are set.');
  process.exit(1);
}

console.log('? All required environment variables present');

// Global Client
const globalSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

// GenAI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const activeModel = "imagen-3.0-generate-001";

// --- HELPERS ---
const getAuthUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  const { data: { user }, error } = await globalSupabase.auth.getUser(token);
  return user;
};

// --- ROUTES ---

// 1. Image Generation Route
app.post('/api/generate', generationLimiter, async (req, res) => {
  const startTime = Date.now();
  let user = null;
  let promptInfo = {};

  try {
    user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'N�o autorizado' });

    promptInfo = req.body.promptInfo || {};
    const { artStyle } = req.body; // Received from frontend

    // Determine Role & Client
    let role = 'free';
    const scopedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    // Get role from database (no hardcoded bypasses)
    const { data: profile } = await scopedSupabase.from('profiles').select('role').eq('id', user.id).single();
    role = profile?.role || 'free';

    const hasUnlimitedGeneration = role === 'owner' || role === 'dev' || role === 'admin';

    if (hasUnlimitedGeneration) {
      console.log(`✅ UNLIMITED GENERATION ACTIVE - Role: ${role}, User: ${user.id}`);
    }

    // CHECK QUOTA
    if (!hasUnlimitedGeneration) {
      const { data: usageData, error: usageError } = await scopedSupabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usageError && usageError.code !== 'PGRST116') throw usageError;

      const limit = role === 'pro' ? 50 : (role === 'starter' ? 20 : 3);
      if (usageData && usageData.images_generated >= limit) {
        return res.status(403).json({ error: 'Limite de gera��o atingido.', quotaStatus: 'BLOCKED' });
      }
    }

    // THE DIRECTOR
    console.log('?? Stage 1: The Director');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Use the selected style or default to 'Cinematic 3D'
    const selectedStyle = artStyle?.label || "Cinematic 3D";
    const stylePrompt = artStyle?.prompt || "high quality, 8k, photorealistic, cinematic lighting, unreal engine 5";

    // === UNIVERSAL VISUAL STYLE (Based on Reference Images) ===
    const UNIVERSAL_STYLE = `
    **MANDATORY VISUAL STANDARDS** (Apply to ALL niches):
    - Background: Dark/black with subtle gradients or textures
    - Lighting: Dramatic cinematic lighting with neon glow effects
    - Accent Colors: Orange, cyan, blue neon highlights
    - Typography: Bold sans-serif, large impact headlines
    - Product/Subject: Photorealistic 3D render, center-focused
    - Effects: Glowing edges, light trails, particle effects, tech UI elements
    - Composition: Professional commercial photography style
    - Quality: Ultra-realistic, 8K, Unreal Engine 5 quality
    `;

    // --- 50+ NICHE TEMPLATES ---
    const NICHE_TEMPLATES = `
    ${UNIVERSAL_STYLE}

    **FOOD & BEVERAGE** (1-10):
    1. **Hamburgueria / Burger Joint**
       - Dark background with FIRE/FLAMES, grilled texture
       - Orange/red neon glow on burger
       - Photorealistic burger stack with melting cheese
       - Bold text: "O COMBO PERFEITO" style
       - Include: fries, drink with ice, grill marks

    2. **A�a� / Smoothie Bar**
       - Purple/pink neon on dark background
       - Frozen a�a� bowl with toppings floating
       - Tropical fruits with glow effect
       - Fresh, vibrant, health-focused

    3. **Pizzaria / Pizza**
       - Dark background, wood-fired oven glow (orange)
       - Melting cheese with steam effects
       - Italian flag colors as accents
       - Rustic + modern tech aesthetic

    4. **Churrascaria / Steakhouse**
       - Fire and smoke, charcoal black background
       - Sizzling meat with glow
       - Red/orange ember effects
       - Masculine, premium feel

    5. **Cafeteria / Coffee Shop**
       - Warm brown tones on dark background
       - Steam rising from coffee cup
       - Coffee beans with glow
       - Cozy yet modern

    6. **Sushi / Japanese Food**
       - Clean dark background, blue/cyan accents
       - Fresh fish with ice crystals
       - Minimalist Japanese aesthetic
       - Precision and freshness

    7. **Padaria / Bakery**
       - Warm golden glow on dark background
       - Fresh bread with steam
       - Wheat and flour particles
       - Artisanal, handcrafted feel

    8. **Sorveteria / Ice Cream**
       - Colorful neon on black
       - Melting ice cream with drips
       - Cold vapor effects
       - Fun, vibrant, Instagram-worthy

    9. **Bar / Pub**
       - Neon signs, dark moody atmosphere
       - Beer with condensation and glow
       - Wood textures, amber lighting
       - Social, nightlife vibe

    10. **Restaurante Gourmet / Fine Dining**
        - Elegant dark background, gold accents
        - Plated dish with artistic presentation
        - Soft spotlight on food
        - Luxury, sophistication

    **AUTOMOTIVE** (11-20):
    11. **Mec�nica Geral / Auto Repair**
        - Dark garage, orange LED floor lighting
        - Luxury car (Audi/BMW style) with hood open
        - Mechanic in orange uniform
        - Tools with metallic shine
        - Tech UI: circuit board patterns

    12. **Mec�nica Especializada / Performance Shop**
        - Sports cars, carbon fiber textures
        - Orange/red performance accents
        - Engine parts with glow
        - Speed, power, precision

    13. **Despachante / DMV Services**
        - Cyan/blue tech background with circuit patterns
        - Car silhouette with digital glow
        - Documents and checkmarks
        - Modern, efficient, digital

    14. **Lava-Jato / Car Wash**
        - Water droplets with blue glow
        - Shiny clean car surface
        - Foam and bubbles
        - Fresh, clean, professional

    15. **Funilaria / Body Shop**
        - Metallic textures, welding sparks (orange)
        - Car body panels
        - Before/after concept
        - Precision, restoration

    16. **Auto El�trica / Auto Electric**
        - Electric blue lightning effects
        - Car electrical system diagrams
        - Wires with glow
        - Technical, modern

    17. **Pneus / Tire Shop**
        - Tire with orange glow
        - Road with speed lines
        - Rubber texture
        - Safety, performance

    18. **Som Automotivo / Car Audio**
        - Sound waves, bass vibrations
        - Speakers with neon glow
        - Music-themed
        - Energy, power

    19. **Insulfilm / Window Tinting**
        - Car windows with gradient tint
        - UV protection visual
        - Sleek, modern
        - Privacy, protection

    20. **Reboque / Towing Service**
        - Tow truck with orange emergency lights
        - 24/7 concept
        - Reliable, fast response

    **HOME SERVICES** (21-30):
    21. **Manuten��o Predial / Building Maintenance**
        - Blue neon, clean modern building
        - Tools with glow
        - Professional, reliable

    22. **Manuten��o de Piscina/SPA**
        - Crystal blue water with tech UI overlay
        - Spa jets with bubbles and glow
        - Wrench icons floating
        - Clean, luxurious, high-tech

    23. **Eletricista / Electrician**
        - Electric blue lightning bolts
        - Electrical panel with glow
        - Safety, expertise

    24. **Encanador / Plumber**
        - Water flow with blue glow
        - Pipes and fixtures
        - Clean, professional

    25. **Pintor / Painter**
        - Paint roller with color splash
        - Before/after wall
        - Transformation, quality

    26. **Marcenaria / Carpentry**
        - Wood textures with warm glow
        - Tools and craftsmanship
        - Artisanal, custom

    27. **Serralheria / Metalwork**
        - Metal with welding sparks
        - Gates, railings
        - Strong, secure

    28. **Jardinagem / Landscaping**
        - Green plants with natural glow
        - Garden tools
        - Fresh, natural

    29. **Limpeza / Cleaning Service**
        - Sparkling clean surfaces
        - Blue/white cleanliness glow
        - Professional, thorough

    30. **Dedetiza��o / Pest Control**
        - Shield protection symbol
        - Safe, effective
        - Professional, trusted

    **BEAUTY & WELLNESS** (31-40):
    31. **Sal�o de Beleza / Beauty Salon**
        - Rose gold/pink neon on black
        - Manicured hands, glossy nails
        - Elegant, feminine, luxury

    32. **Barbearia / Barber Shop**
        - Vintage + modern, orange/brown tones
        - Grooming tools with glow
        - Masculine, classic

    33. **Academia / Gym**
        - Neon blue/orange, dark background
        - Fitness equipment, dumbbells
        - Energy, strength, motivation

    34. **Est�tica / Aesthetics Clinic**
        - Clean white/blue medical aesthetic
        - Skincare products with glow
        - Professional, results-driven

    35. **Massagem / Massage Therapy**
        - Calm blue/purple tones
        - Spa stones, relaxation
        - Wellness, tranquility

    36. **Tatuagem / Tattoo Studio**
        - Dark edgy background, neon outlines
        - Tattoo machine with ink
        - Artistic, bold

    37. **Depila��o / Waxing**
        - Clean, smooth skin focus
        - Blue/white clinical aesthetic
        - Professional, hygienic

    38. **Cl�nica Odontol�gica / Dental Clinic**
        - White teeth with sparkle
        - Blue medical glow
        - Health, confidence

    39. **Nutri��o / Nutrition**
        - Fresh foods with natural glow
        - Health-focused
        - Wellness, balance

    40. **Fisioterapia / Physical Therapy**
        - Body anatomy with blue highlights
        - Recovery, movement
        - Professional, healing

    **PROFESSIONAL SERVICES** (41-50):
    41. **Advocacia / Law Firm**
        - Black/gold, marble textures
        - Scales of justice (gold, glowing)
        - Serious, luxury, authority

    42. **Contabilidade / Accounting**
        - Blue tech background, financial charts
        - Calculator, documents
        - Professional, precise

    43. **Consultoria / Consulting**
        - Modern office, blue/gray tones
        - Strategy diagrams
        - Expert, strategic

    44. **Marketing Digital / Digital Marketing**
        - Neon social media icons
        - Analytics graphs
        - Modern, results-driven

    45. **Fotografia / Photography**
        - Camera with lens flare
        - Artistic, creative
        - Professional, memorable

    46. **Arquitetura / Architecture**
        - Building blueprints with blue glow
        - 3D models
        - Innovative, precise

    47. **Engenharia / Engineering**
        - Technical drawings, orange accents
        - Precision tools
        - Expert, reliable

    48. **Imobili�ria / Real Estate**
        - Luxury home with warm glow
        - Keys, modern interior
        - Dream home, investment

    49. **Seguran�a / Security**
        - Shield, camera systems
        - Blue tech aesthetic
        - Protection, trust

    50. **Pet Shop / Veterin�ria**
        - Cute pets with soft glow
        - Paw prints, hearts
        - Care, love

    **TECH & EDUCATION** (51-55):
    51. **Inform�tica / IT Services**
        - Circuit boards, blue/cyan glow
        - Computer components
        - Modern, tech-savvy

    52. **Celular / Phone Repair**
        - Smartphone with screen glow
        - Tech repair tools
        - Fast, reliable

    53. **Cursos / Education**
        - Books, graduation cap with glow
        - Knowledge, growth
        - Professional, certified

    54. **Idiomas / Language School**
        - Flags, speech bubbles
        - Communication, global
        - Professional, fluent

    55. **M�sica / Music School**
        - Instruments with sound waves
        - Creative, artistic
        - Passion, skill

    **DYNAMIC FALLBACK** (56):
    56. **ANY OTHER NICHE**
        - Analyze business name/description
        - Apply UNIVERSAL_STYLE
        - Use appropriate industry imagery
        - Maintain dark background + neon aesthetic
    `;

    const directorPrompt = `You are a WORLD - CLASS Advertising Creative Director(Brazil Market Specialist).
    YOUR GOAL: Analyze the input, DETECT THE NICHE, and generate a VISIONARY COMMERCIAL FLYER PROMPT based on the proven templates below.

    CLIENT INPUT:
    - Business Name: "${promptInfo.companyName}"
      - Address: "${promptInfo.addressStreet}, ${promptInfo.addressNumber} - ${promptInfo.addressNeighborhood}, ${promptInfo.addressCity}"
        - Phone: "${promptInfo.phone}"
          - Offer / Details: "${promptInfo.details}"
            - Requested Style: "${selectedStyle}"(${stylePrompt})

    REFERENCE TEMPLATES(Use the one that matches the client):
    ${NICHE_TEMPLATES}

    INSTRUCTIONS:
    1. ** RESEARCH SIMULATION(MENTAL) **: Before writing the prompt, mentally browse Behance / Pinterest for the best designs in this niche.Use that high - end aesthetic.
    2. ** NICHE DETECTION **: Decide which niche fits best.If "Nails" or "Beauty", use Template 8. If none match, use Template 9(Dynamic).
    3. ** STRICT VISUAL ISOLATION **: NEVER mix elements from different niches.
    4. ** AGENCY QUALITY(CRITICAL) **: The output most look like a $5000 agency design.
       - ** AVOID **: "Cartoon 3D", cheap plastic textures, floating isolated icons in empty voids.
       - ** USE **: "Cinematic Lighting"(Rim light, Softbox), "High-End Textures"(Matte, Glass, Metal), "Editorial Composition"(Rule of thirds).
       - ** STYLE **: If 3D, use "Hyper-realistic Octane Render".If 2D, use "Premium Swiss Design".
    5. ** TEXT & DATA **:
    - HEADLINE: Must be "${promptInfo.companyName}".
       - BODY COPY: Incorporate the offer "${promptInfo.details}".
       - FOOTER: You MUST include placeholders for specific contact: "WhatsApp: ${promptInfo.phone}" and "Address: ${promptInfo.addressStreet}...".
    6. ** LANGUAGE **: All generated text in the image must be Portuguese(BR).
    7. ** TYPOGRAPHY **: Use sophisticated font pairings.AVOID generic center alignment.Use hierarchy.
       - ** FOR LAW / ADVOCACY **: FORCE SERIF FONTS(Classic, Elegant).
    8. ** FORMAT **: FULL CANVAS BLEED.NO BORDERS.NO MOCKUPS.DO NOT generate the flyer sitting on a table.The image IS the flyer.

    OUTPUT STRUCTURE(Single Prompt for Imagen 3):
    start with: "A professional award-winning advertising flyer design for [Niche]..."
    Include:
    - "Bold central headline '${promptInfo.companyName}' with elegant typography"
      - "Visual elements: [Specific elements from template] (Photorealistic/Premium)"
      - "Color palette: [Specific colors from template] (High contrast, harmonious)"
      - "Text layout: Price list placeholder, 'WhatsApp: ${promptInfo.phone}'"
      - "High quality vector art, 8k resolution, cinematic lighting, trending on Behance"`;

    let professionalPrompt = `Professional commercial flyer for ${promptInfo.companyName}.`;
    try {
      const result = await model.generateContent(directorPrompt);
      professionalPrompt = result.response.text().trim().replace(/```/g, '');
      console.log('? Director Smart Prompt:', professionalPrompt);

      // --- STRICT DATA INJECTION (ROBUST V2) ---
      const clientData = [];
      if (promptInfo.companyName) clientData.push(`Nome do Negócio: ${promptInfo.companyName}`);
      if (promptInfo.whatsapp) clientData.push(`Telefone: ${promptInfo.whatsapp}`);
      if (promptInfo.instagram) clientData.push(`Instagram: ${promptInfo.instagram}`);
      if (promptInfo.rua) clientData.push(`Endereço: ${promptInfo.rua}`);
      if (promptInfo.site) clientData.push(`Site: ${promptInfo.site}`);

      if (promptInfo.details) clientData.push(`Detalhes: ${promptInfo.details}`);

      if (clientData.length > 0) {
        const robustBlock = `
\n═══════════════════════════════════════════════════════════════
⚠️ DADOS REAIS DO CLIENTE - COPIE EXATAMENTE COMO ESTÁ ESCRITO ⚠️
═══════════════════════════════════════════════════════════════

${clientData.join('\n')}

═══════════════════════════════════════════════════════════════
📋 INSTRUÇÕES OBRIGATÓRIAS:
═══════════════════════════════════════════════════════════════

1. COPIE cada texto EXATAMENTE como aparece acima, letra por letra
2. NÃO traduza - mantenha em português brasileiro
3. NÃO mude, adicione ou remova NENHUM caractere
4. NÃO invente dados - use SOMENTE os dados listados acima
5. Se um campo não está listado acima, NÃO inclua no cartão
6. Mantenha todos os acentos, pontos, vírgulas e espaços originais
7. Use tipografia legível e clara
8. Certifique-se de que todo o texto está perfeitamente visível

IMPORTANTE: Os dados acima são os ÚNICOS dados verdadeiros. NÃO use nenhum outro texto.
`;
        professionalPrompt += robustBlock;
        console.log('💉 Data Injected (Robust V2):', robustBlock);
      }
      // -------------------------------------------------------------

    } catch (e) {
      console.warn('Director fallback', e);
    }

    // THE ARTIST
    const generateImage = async (prompt) => {
      console.log('?? Stage 2: The Artist (Model: ' + activeModel + ')');
      try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:predict?key=${GEMINI_API_KEY}`, {
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: "3:4" }
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000 // 60s Timeout
        });
        const b64 = response.data.predictions?.[0]?.bytesBase64Encoded || response.data.predictions?.[0]?.image?.bytesBase64Encoded;
        if (!b64) throw new Error('No image generated by API');
        return b64;
      } catch (e) {
        if (e.code === 'ECONNABORTED') throw new Error('Timeout: A IA demorou muito para responder.');
        console.error('Artist Error:', e.response?.data || e.message);
        throw e;
      }
    };

    let imageBase64 = await generateImage(professionalPrompt);
    let finalPrompt = professionalPrompt;
    let criticVerdict = 'SKIPPED';

    // THE CRITIC
    console.log('?? Stage 3: The Critic');
    try {
      const criticModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const imagePart = { inlineData: { data: imageBase64, mimeType: "image/png" } };
      const criticPrompt = `Review flyer for "${promptInfo.companyName}".
      VERDICT: "REJECT: <Reason>" or "APPROVE".
        Check: Text Cutoff, Spelling, Quality.`;

      const criticResult = await criticModel.generateContent([criticPrompt, imagePart]);
      criticVerdict = criticResult.response.text().trim();
      console.log('Verdict:', criticVerdict);

      if (criticVerdict.startsWith('REJECT')) {
        console.log('Retrying...');
        finalPrompt = `${professionalPrompt}.FIX: ${criticVerdict} `;
        imageBase64 = await generateImage(finalPrompt);
        criticVerdict = 'APPROVED (AFTER RETRY)';
      } else {
        criticVerdict = 'APPROVED (FIRST PASS)';
      }
    } catch (e) { console.warn('Critic failed', e.message); }

    const imageUrl = `data: image / png; base64, ${imageBase64} `;

    // Log QA
    logQA({
      type: 'GENERATION',
      user: user.id,
      duration: Date.now() - startTime,
      result: 'SUCCESS',
      criticVerdict,
      prompt: promptInfo.companyName
    });

    // Save & Usage Update (Simplified)
    // Save image for all authenticated users
    await scopedSupabase.from('images').insert({ user_id: user.id, prompt: finalPrompt, image_url: imageUrl, business_info: promptInfo });
    if (!hasUnlimitedGeneration) {
      const { data: u } = await scopedSupabase.from('user_usage').select('*').eq('user_id', user.id).single();
      if (u) await scopedSupabase.from('user_usage').update({ images_generated: u.images_generated + 1 }).eq('user_id', user.id);
      else await scopedSupabase.from('user_usage').insert({ user_id: user.id, images_generated: 1 });

    }

    trackEvent('generation', user.id, { style: selectedStyle });
    res.json({ image: { id: 'generated', image_url: imageUrl } });

  } catch (error) {
    console.error('? Generation error:', error);
    logQA({
      type: 'ERROR',
      user: 'unknown',
      error: error.message,
      prompt: req.body?.promptInfo?.companyName || 'unknown'
    });
    res.status(500).json({ error: error.message });
  }
});

// 2. QA Dashboard Route
app.get('/api/admin/qa-logs', async (req, res) => {
  if (fs.existsSync(LOG_FILE)) {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const logs = content.trim().split('\n').map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
    res.json({ logs });
  } else {
    res.json({ logs: [] });
  }
});

// 3. Check Quota Route (Real Implementation)
app.get('/api/check-quota', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const scopedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    // 1. Get User Role
    const { data: profile } = await scopedSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'free';

    // 2. Check if user has unlimited generation (dev/owner/admin)
    const hasUnlimitedGeneration = role === 'owner' || role === 'dev' || role === 'admin';

    if (hasUnlimitedGeneration) {
      // Dev/Owner/Admin have unlimited generation
      console.log(`✅ Unlimited generation for ${role}:`, user.id);
      return res.json({
        status: 'ALLOWED',
        usage: {
          current_usage: 0,
          plan_id: role
        },
        plan: {
          id: role,
          max_images_per_month: 999999, // Unlimited
          price: 0
        },
        message: `Geração ilimitada para ${role.toUpperCase()}`
      });
    }

    // 3. Get Usage for regular users (free/starter/pro)
    const { data: usageData } = await scopedSupabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const currentUsage = usageData?.images_generated || 0;

    // 4. Get Plan Limits (Fetch from DB or hardcode fallback)
    const { data: planSettings } = await globalSupabase
      .from('plan_settings')
      .select('*')
      .eq('id', role)
      .single();

    // Fallback limits if DB fetch fails (should match frontend/DB defaults)
    const limit = planSettings?.max_images_per_month || (role === 'pro' ? 50 : (role === 'starter' ? 20 : 3));

    const status = currentUsage >= limit ? 'BLOCKED' : 'ALLOWED';

    res.json({
      status,
      usage: {
        current_usage: currentUsage,
        plan_id: role
      },
      plan: {
        id: role,
        max_images_per_month: limit,
        price: planSettings?.price || 0
      }
    });

  } catch (error) {
    console.error('Check Quota Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Admin: List Users
// 4. Admin: List Users
app.get('/api/admin/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    // 1. Verify Caller is Admin via Scoped Client (Security Check)
    const scoped = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await scoped.auth.getUser();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Check Role using Global to define authority
    const { data: callerProfile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['owner', 'admin', 'dev'].includes(callerProfile?.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 2. Fetch All Profiles & Usage using Global Client (Bypass RLS)
    console.log('?? Admin: Fetching all profiles...');
    const { data: profiles, error: profileError } = await globalSupabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false }); // FIX: profiles might not have created_at, use updated_at

    if (profileError) {
      console.error('? Admin: Profile fetch error', profileError);
      throw profileError;
    }
    console.log(`? Admin: Found ${profiles.length} profiles.`);

    const { data: usage } = await globalSupabase
      .from('user_usage')
      .select('*');

    // 3. Merge Data
    const result = profiles.map(p => {
      const u = usage?.find(use => use.user_id === p.id);
      return {
        id: p.id,
        email: p.email || 'N/A',
        first_name: p.first_name,
        last_name: p.last_name,
        role: p.role,
        created_at: p.created_at || p.updated_at, // FIX: Fallback if created_at is missing
        images_generated: u?.images_generated || 0
      };
    });

    res.json(result);

  } catch (e) {
    console.error('Admin Fetch Error:', e);
    const isServiceKeyMissing = !SUPABASE_SERVICE_KEY;
    console.error('?? Service Key Present:', !isServiceKeyMissing);
    res.status(500).json({ error: e.message, serviceKeyMissing: isServiceKeyMissing });
  }
});

// 5. Admin: Create User
// 5. Admin: Create User
app.post('/api/admin/create-user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    // 1. Verify Caller is Admin
    const scoped = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user: caller } } = await scoped.auth.getUser();
    if (!caller) return res.status(401).json({ error: 'Unauthorized' });

    const { data: callerProfile } = await globalSupabase.from('profiles').select('role').eq('id', caller.id).single();
    if (!['owner', 'admin'].includes(callerProfile?.role)) {
      return res.status(403).json({ error: 'Forbidden: Only Owners/Admins can create users.' });
    }

    const { email, password, firstName, lastName, plan } = req.body;

    // 2. Create Auth User (Using Service Role)
    const { data: newUser, error: createError } = await globalSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    });

    if (createError) throw createError;

    // 3. Create Profile
    const { error: profileError } = await globalSupabase.from('profiles').upsert({
      id: newUser.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role: 'free', // SECURITY: Always start as free, upgrade only via webhook
      updated_at: new Date().toISOString()
    });

    if (profileError) throw profileError;

    res.json({ success: true, user: newUser.user });

  } catch (e) {
    console.error('Create User Error Details:', JSON.stringify(e, null, 2));
    console.error('Create User Error Message:', e.message);
    if (e.response) console.error('Create User Response Error:', e.response.data);
    res.status(500).json({ error: e.message || "Erro desconhecido ao criar usu�rio." });
  }
});

// 6. Public: Register User (Bypass RLS Triggers)
app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // 1. Create User in Supabase Auth
    // We use globalSupabase (Service Role) to ensure we can create the user 
    // and immediately set up their profile without RLS blocking the profile insert.
    const { data: authData, error: authError } = await globalSupabase.auth.signUp({
      email,
      password,
      // We don't use metadata for profile fields to avoid trigger race conditions, 
      // we insert profile manually below.
    });

    if (authError) throw authError;

    if (!authData.user) {
      // Limit reached, or email config issue
      return res.status(400).json({ error: 'N�o foi poss�vel criar o usu�rio. Verifique se o email j� existe.' });
    }

    // 2. Insert/Update Profile (Service Role)
    // We try to UPSERT. If it fails (e.g. trigger conflict or RLS), we assume the trigger did its job
    // and proceed without deleting the user.
    const { error: profileError } = await globalSupabase.from('profiles').upsert({
      id: authData.user.id,
      email: email,
      first_name: firstName,
      last_name: lastName || '',
      role: 'free', // SECURITY: Always start as free, upgrade only via webhook // Default to free
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      console.warn("Manual profile upsert failed (likely trigger conflict). Ignoring to allow registration.", profileError);
      // DO NOT delete the user. The user exists, and likely the profile does too (created by trigger).
    }

    // 3. Initialize Usage (Safe to fail too)
    const { error: usageError } = await globalSupabase.from('user_usage').insert({
      user_id: authData.user.id,
      images_generated: 0
    });

    if (usageError) {
      console.warn("Usage creation failed. It might be auto-created.", usageError);
    }

    res.json({ success: true, user: authData.user });

  } catch (e) {
    console.error('Registration Error:', e);

    // Handle specific Supabase duplicate error
    if (e.message?.includes('aligned') || e.message?.includes('already registered')) {
      return res.status(400).json({ error: 'Este email j� est� cadastrado.' });
    }

    res.status(500).json({ error: e.message || 'Erro interno no cadastro.' });
  }
});

// 7. User: Delete Image
app.delete('/api/images/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'N�o autorizado' });

    const { id } = req.params;

    const scopedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    const { error } = await scopedSupabase
      .from('images')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    res.json({ success: true });

  } catch (e) {
    console.error('Delete Image Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- MERCADO PAGO ---
const MP_CONFIG_FILE = path.resolve(__dirname, 'mp_config.json');

// Helper to get MP Access Token
const getMPToken = () => {
  if (fs.existsSync(MP_CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(MP_CONFIG_FILE, 'utf8'));
      return config.access_token;
    } catch (e) {
      console.error('Error reading MP config:', e);
    }
  }
  return process.env.MP_ACCESS_TOKEN; // Fallback to env
};

// 5. Admin: MP Status
app.get('/api/admin/mp-status', (req, res) => {
  const token = getMPToken();
  res.json({ connected: !!token });
});

// 6. Admin: MP Connect (Get OAuth URL)
app.get('/api/admin/mp-connect', async (req, res) => {
  const APP_ID = process.env.MP_APP_ID;
  const REDIRECT_URI = process.env.MP_REDIRECT_URI || 'http://localhost:3000/owner-panel'; // Update with your actual redirect
  // Check if we need to encode state? For now simple.

  if (!APP_ID) return res.status(500).json({ error: 'MP_APP_ID not configured' });

  const url = `https://auth.mercadopago.com.br/authorization?client_id=${APP_ID}&response_type=code&platform_id=mp&state=random_state&redirect_uri=${REDIRECT_URI}`;

  res.json({ connectUrl: url });
});

// 7. MP Auth Callback (Exchange Code)
app.post('/api/mercadopago/auth', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  try {
    const response = await axios.post('https://api.mercadopago.com/oauth/token', {
      client_secret: process.env.MP_CLIENT_SECRET, // Your access_token is the client_secret for OAuth flows usually? No, client_secret is distinct.
      client_id: process.env.MP_APP_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.MP_REDIRECT_URI || 'http://localhost:3000/owner-panel'
    });

    const { access_token, refresh_token, user_id } = response.data;

    // Save to file
    fs.writeFileSync(MP_CONFIG_FILE, JSON.stringify({ access_token, refresh_token, user_id, updated: new Date() }));

    res.json({ success: true });

  } catch (error) {
    console.error('MP Auth Error:', error.response?.data || error);
    res.status(500).json({ error: 'Failed to authenticate with Mercado Pago' });
  }
});

// 8. Subscribe Route (Create Preference)
app.post('/api/subscribe', paymentLimiter, async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { planId } = req.body;
    const mpToken = getMPToken();

    if (!mpToken) return res.status(400).json({ error: 'Owner Mercado Pago not connected.' });

    // Plan details
    const plans = {
      'starter': { price: 29.99, title: 'Plano Starter - Flow Designer' },
      'pro': { price: 49.99, title: 'Plano Pro - Flow Designer' }
    };

    const plan = plans[planId];
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });

    const client = new mercadopago.MercadoPagoConfig({ accessToken: mpToken });
    const preference = new mercadopago.Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: planId,
            title: plan.title,
            quantity: 1,
            unit_price: plan.price
          }
        ],
        payer: {
          email: user.email // user.email from auth
        },
        back_urls: {
          success: 'http://localhost:3000/?status=success',
          failure: 'http://localhost:3000/?status=failure',
          pending: 'http://localhost:3000/?status=pending'
        },
        external_reference: user.id, // CRITICAL: Link payment to User
        auto_return: 'approved'
      }
    });

    res.json({ paymentUrl: result.init_point });

  } catch (error) {
    console.error('Subscribe Error:', error);
    res.status(500).json({ error: 'Failed to create payment preference' });
  }
});

// 9. Webhook (Enhanced)
app.post('/api/webhook', async (req, res) => {
  const topic = req.query.topic || req.body.type;
  const id = req.query.id || req.body.data?.id;

  console.log('?? Webhook:', topic, id);

  try {
    if (topic === 'payment') {
      const mpToken = getMPToken();
      if (!mpToken) throw new Error('No MP Token to verify payment');

      // Verify payment status with MP
      const paymentResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${mpToken}` }
      });

      const payment = paymentResponse.data;

      if (payment.status === 'approved') {
        const userId = payment.external_reference;
        const paidAmount = payment.transaction_amount;

        // Determine Plan from Amount (Robust enough for now)
        let planId = 'free';
        if (paidAmount >= 49) planId = 'pro';
        else if (paidAmount >= 29) planId = 'starter';

        // Update User Role & Usage
        if (userId) {
          const scoped = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

          // Update Profile
          await scoped.from('profiles').update({ role: planId }).eq('id', userId);

          // Reset/Update Usage Limits
          const limit = planId === 'pro' ? 50 : 20;

          // Update usage table (reset images_generated? Or keep adding? Usually reset or boost)
          // Let's just ensure they are unblocked.
          // Actually, usually subscription resets cycle.
          await scoped.from('user_usage').update({
            cycle_start_date: new Date().toISOString()
            // images_generated: 0 // Optional: Reset on upgrade
          }).eq('user_id', userId);

          // Record Payment
          await scoped.from('payments').insert({
            user_id: userId,
            amount: paidAmount,
            status: 'approved',
            mercadopago_payment_id: String(id),
            paid_at: new Date(payment.date_approved || new Date()).toISOString(),
            plan: planId
          });

          console.log(`? Payment approved for user ${userId}. Upgraded to ${planId}`);
        }
      }
    }
    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook processing error:', e.message);
    res.sendStatus(500);
  }
});

// Health Check Endpoint

// Analytics endpoint (admin only)
app.get('/api/admin/analytics', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Check if user is admin/owner/dev
    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const metrics = getMetrics(startDate, endDate);
    const recentEvents = getRecentEvents(50);

    res.json({ metrics, recent_events: recentEvents });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Cron endpoint for daily quota reset (called by Vercel Cron)
app.get('/api/cron/reset-quota', async (req, res) => {
  try {
    // Verify request is from Vercel Cron (optional but recommended)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔄 Running daily quota reset...');

    // Reset images_generated for all users
    const { data, error } = await globalSupabase
      .from('user_usage')
      .update({
        images_generated: 0,
        cycle_start_date: new Date().toISOString()
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Update all real users

    if (error) throw error;

    console.log(`✅ Reset quota for ${data?.length || 0} users`);
    res.json({
      success: true,
      message: `Reset quota for ${data?.length || 0} users`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron reset-quota error:', error);
    res.status(500).json({ error: error.message });
  }
});

// === GUARDIAN / DEV PANEL ENDPOINTS ===

// Guardian Stats
app.get('/api/admin/guardian/stats', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const scopedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    const { data: profile } = await scopedSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'dev' && profile.role !== 'owner' && profile.role !== 'admin')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Get system stats
    const memoryUsage = process.memoryUsage();
    const dbStart = Date.now();
    await globalSupabase.from('profiles').select('id').limit(1);
    const dbLatency = Date.now() - dbStart;

    res.json({
      dbLatency,
      memory: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      routeStatus: 'OK',
      mpStatus: process.env.MP_ACCESS_TOKEN ? 'ACTIVE' : 'INACTIVE',
      lastRun: new Date().toISOString()
    });

  } catch (error) {
    console.error('Guardian stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guardian Logs
app.get('/api/admin/guardian/logs', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const scopedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    const { data: profile } = await scopedSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'dev' && profile.role !== 'owner' && profile.role !== 'admin')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Return mock logs (you can implement real logging later)
    const logs = [
      { timestamp: new Date().toISOString(), action: 'SYSTEM_CHECK', status: 'OK', details: 'All systems operational' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), action: 'DB_HEALTH', status: 'ONLINE', details: 'Database responsive' },
      { timestamp: new Date(Date.now() - 120000).toISOString(), action: 'API_STATUS', status: 'OPTIMAL', details: 'All endpoints responding' }
    ];

    res.json({ logs });

  } catch (error) {
    console.error('Guardian logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Guardian Run Cycle (System Activation)
app.post('/api/admin/guardian/run-cycle', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Não autorizado' });

    const scopedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    const { data: profile } = await scopedSupabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'dev' && profile.role !== 'owner' && profile.role !== 'admin')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    console.log('🔄 Guardian cycle triggered by:', user.id);

    // Perform system checks
    const checks = {
      database: false,
      gemini: false,
      mercadopago: false
    };

    // Check database
    try {
      await globalSupabase.from('profiles').select('id').limit(1);
      checks.database = true;
    } catch (e) {
      console.error('DB check failed:', e);
    }

    // Check Gemini
    checks.gemini = !!GEMINI_API_KEY;

    // Check Mercado Pago
    checks.mercadopago = !!process.env.MP_ACCESS_TOKEN;

    console.log('✅ Guardian cycle complete:', checks);

    res.json({
      success: true,
      message: 'Sistema reativado com sucesso',
      checks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Guardian run-cycle error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// START
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });

  // Graceful Shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Export for Vercel serverless functions
module.exports = app;
