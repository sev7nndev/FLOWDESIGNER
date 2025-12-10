// SISTEMA HÍBRIDO V3 - GRAPHIC DESIGN FLYERS (NÃO FOTOS)
// Baseado em feedback do cliente: precisa gerar FLYERS GRÁFICOS, não fotos realistas

const HYBRID_GENERATION_SYSTEM = {
   detectNiche: function (businessData) {
      const text = ((businessData.nome || '') + ' ' + (businessData.descricao || '')).toLowerCase();

      // Automotive
      if (text.match(/mecanica|carro|auto|oficina|motor|suspensao|embreagem|pneu|alinhamento|balanceamento/)) return 'mecanica';
      if (text.match(/despachante|detran|emplacamento|transferencia|veiculo|licenciamento|cnh|habilitacao/)) return 'despachante';

      // Food & Beverage
      if (text.match(/bar|restaurante|churrasco|bebida|heineken|cerveja|jogo|futebol|lanche|petisco/)) return 'bar_restaurante';
      if (text.match(/pizza|pizzaria|italiano|massa|delivery/)) return 'pizzaria';
      if (text.match(/hamburger|burger|lanche|batata|milk.*shake|hamburguer/)) return 'hamburgueria';
      if (text.match(/acai|sorvete|gelato|sobremesa|doce/)) return 'sorveteria';

      // Beauty & Wellness
      if (text.match(/salao|beleza|estetica|cabelo|unha|maquiagem|manicure|pedicure/)) return 'beleza';
      if (text.match(/barbearia|barber|corte.*cabelo|barba|navalha/)) return 'barbearia';
      if (text.match(/academia|fitness|musculacao|personal|treino|crossfit/)) return 'academia';

      // Events & Entertainment
      if (text.match(/festa|evento|carnaval|show|balada|aniversario|esquenta|casamento/)) return 'festa_evento';
      if (text.match(/buffet|catering|formatura|corporativo/)) return 'buffet';

      // Services
      if (text.match(/manutencao|predial|banheira|spa|hidro|encanamento|eletrica|reforma/)) return 'manutencao';
      if (text.match(/pet.*shop|veterinaria|animais|cachorro|gato|banho.*tosa/)) return 'petshop';
      if (text.match(/clinica|medico|dentista|odonto|saude|consulta/)) return 'clinica';
      if (text.match(/imovel|imobiliaria|apartamento|casa|venda|aluguel/)) return 'imobiliaria';
      if (text.match(/escola|curso|aula|educacao|ensino|faculdade/)) return 'educacao';

      return 'geral';
   },

   // Gera prompt para GRAPHIC DESIGN FLYER (NÃO FOTO)
   generateBackgroundPrompt: function (businessData) {
      const niche = this.detectNiche(businessData);

      // Template base para TODOS os nichos
      const baseInstructions = `
CRITICAL INSTRUCTIONS - READ CAREFULLY:

This is a GRAPHIC DESIGN FLYER for social media marketing, NOT a realistic photograph.
Think: Instagram post, Facebook ad, digital marketing poster.

DESIGN STYLE:
- Modern graphic design flyer/poster aesthetic
- Flat design with bold colors and geometric shapes
- Social media post style (1080x1920px vertical)
- Professional Brazilian marketing design
- NOT realistic photography - use graphic design elements

LAYOUT STRUCTURE:
- Top 25%: Header area with brand colors and geometric shapes
- Middle 35%: Main visual element (illustration/stylized image)
- Bottom 40%: SOLID COLOR PANEL for text overlay

TEXT HANDLING:
- Do NOT generate readable text or numbers
- Create visual placeholder areas for text
- Text will be added programmatically afterwards

FORBIDDEN:
❌ NO realistic photography style
❌ NO readable text, numbers, or letters
❌ NO stock photo appearance
❌ Must look like GRAPHIC DESIGN, not a photo
`;

      const nichePrompts = {
         mecanica: `
AUTOMOTIVE WORKSHOP GRAPHIC DESIGN FLYER

COLOR SCHEME:
- Background: Dark gradient (#1A1A1A to #000000)
- Primary Accent: Vibrant orange (#FF6600)
- Secondary: Electric blue (#00D9FF)
- Highlights: White (#FFFFFF)

VISUAL ELEMENTS:
- Car silhouette or stylized illustration (NOT realistic photo)
- Geometric shapes: hexagons, circuit patterns, tech lines
- Icon-style graphics: wrench, gear, tools
- Orange glowing accent lines
- Speed/motion graphics
- Diagonal stripes for dynamism

COMPOSITION:
- Center: Stylized car graphic with orange accents
- Background: Dark with geometric tech patterns
- Bottom 40%: Solid dark panel (#000000) for text
- Corner decorations: geometric shapes

STYLE: Modern tech-inspired automotive flyer, Instagram post aesthetic, bold geometric design
${baseInstructions}
`,

         beleza: `
BEAUTY SALON GRAPHIC DESIGN FLYER

COLOR SCHEME:
- Background: Soft pink gradient (#FFB6C1 to #FFFFFF)
- Primary Accent: Rose gold (#B76E79)
- Secondary: Soft pastels
- Highlights: White (#FFFFFF)

VISUAL ELEMENTS:
- Stylized beauty product illustrations
- Elegant geometric shapes (circles, curves)
- Floral graphic elements (roses, petals)
- Sparkle/shine effects
- Soft gradient overlays
- Elegant divider lines

COMPOSITION:
- Center: Beauty products arranged artistically
- Background: Soft gradient with elegant shapes
- Bottom 40%: Light panel for text
- Feminine, elegant, premium feel

STYLE: Luxury beauty salon flyer, Instagram aesthetic, soft feminine design, rose gold accents
${baseInstructions}
`,

         pizzaria: `
PIZZERIA GRAPHIC DESIGN FLYER

COLOR SCHEME:
- Background: Warm red gradient (#C41E3A to #2A1810)
- Primary Accent: Golden yellow (#D4A574)
- Secondary: Orange (#FF6600)
- Highlights: White (#FFFFFF)

VISUAL ELEMENTS:
- Stylized pizza illustration (NOT realistic photo)
- Italian flag colors as accents
- Flame graphics (wood-fired oven)
- Geometric shapes: circles, arcs
- Steam/smoke graphic effects
- Rustic texture overlays

COMPOSITION:
- Center: Pizza graphic with melted cheese illustration
- Background: Warm gradient with flame graphics
- Bottom 35%: Dark panel for text
- Artisan, traditional, authentic feel

STYLE: Artisan pizzeria flyer, Instagram food post, warm Italian colors, traditional aesthetic
${baseInstructions}
`,

         hamburgueria: `
BURGER RESTAURANT GRAPHIC DESIGN FLYER

COLOR SCHEME:
- Background: Dark with warm spots (#1A1A1A)
- Primary Accent: Golden yellow (#FFD700)
- Secondary: Rich brown (#8B4513)
- Highlights: Vibrant red (#DC143C)

VISUAL ELEMENTS:
- Stylized burger illustration (layers visible)
- Geometric shapes: circles, badges
- Steam/smoke graphics
- Grill marks as design elements
- Bold graphic shapes
- Dynamic composition

COMPOSITION:
- Center: Hero burger graphic
- Background: Dark with warm lighting effects
- Bottom 40%: Solid dark panel for text
- Bold, satisfying, premium street food feel

STYLE: Gourmet burger flyer, Instagram food post, bold colors, premium street food aesthetic
${baseInstructions}
`,

         academia: `
FITNESS GYM GRAPHIC DESIGN FLYER

COLOR SCHEME:
- Background: Dark gradient (#000000 to #0066FF)
- Primary Accent: Electric blue (#0066FF)
- Secondary: Cyan (#00FFFF)
- Highlights: White (#FFFFFF)

VISUAL ELEMENTS:
- Athlete silhouette or stylized figure
- Geometric shapes: angular, dynamic
- Motion lines, energy effects
- Muscle/strength graphic symbols
- Neon LED light effects
- Bold angular shapes

COMPOSITION:
- Center: Dynamic athlete silhouette
- Background: Dark with blue neon effects
- Bottom 40%: Solid dark panel for text
- Energetic, motivational, strong feel

STYLE: Modern gym flyer, Instagram fitness post, neon blue aesthetic, motivational energy
${baseInstructions}
`,

         petshop: `
PET SHOP GRAPHIC DESIGN FLYER

COLOR SCHEME:
- Background: Bright gradient (#4A90E2 to #FFFFFF)
- Primary Accent: Warm orange (#FF8C42)
- Secondary: Grass green (#7CB342)
- Highlights: White (#FFFFFF)

VISUAL ELEMENTS:
- Cute pet illustrations (dog/cat graphics)
- Paw print graphics
- Heart shapes, playful elements
- Bone/toy icons
- Cheerful geometric shapes
- Soft rounded corners

COMPOSITION:
- Center: Happy pet illustrations
- Background: Bright cheerful gradient
- Bottom 35%: Light panel for text
- Joyful, caring, professional feel

STYLE: Pet care flyer, Instagram pet post, bright cheerful colors, playful design
${baseInstructions}
`,

         festa_evento: `
PARTY/EVENT GRAPHIC DESIGN FLYER

COLOR SCHEME:
- Background: Rainbow gradient (pink, purple, blue, yellow)
- Primary Accent: Hot pink (#FF1493)
- Secondary: Electric purple (#9C27B0)
- Highlights: Golden yellow (#FFD700)

VISUAL ELEMENTS:
- Carnival mask illustrations
- Confetti graphics
- Sparkle/glitter effects
- Colorful streamers
- Geometric shapes: circles, stars
- Light ray graphics
- Festive decorative elements

COMPOSITION:
- Center: Carnival masks and confetti
- Background: Vibrant rainbow gradient
- Center 50%: Clear area for text
- Explosive, joyful, celebratory feel

STYLE: Brazilian Carnaval flyer, Instagram party post, rainbow colors, festive celebration
${baseInstructions}
`,

         barbearia: `
BARBERSHOP GRAPHIC DESIGN FLYER

COLOR SCHEME:
- Background: Dark brown gradient (#3E2723 to #000000)
- Primary Accent: Brass/gold (#B8860B)
- Secondary: Cream (#F5E6D3)
- Highlights: White (#FFFFFF)

VISUAL ELEMENTS:
- Barber tool illustrations (scissors, razor)
- Vintage decorative elements
- Geometric shapes: badges, frames
- Leather texture graphics
- Wood grain patterns
- Classic masculine design elements

COMPOSITION:
- Center: Barber tools arranged artistically
- Background: Dark vintage aesthetic
- Bottom 35%: Dark panel for text
- Masculine, classic, premium feel

STYLE: Classic barbershop flyer, Instagram grooming post, vintage masculine aesthetic
${baseInstructions}
`,

         geral: `
PROFESSIONAL BUSINESS GRAPHIC DESIGN FLYER

COLOR SCHEME:
- Background: Navy gradient (#1A2332 to #0066CC)
- Primary Accent: Bright blue (#0066CC)
- Secondary: White (#FFFFFF)
- Highlights: Light gray (#E0E0E0)

VISUAL ELEMENTS:
- Clean geometric shapes
- Professional design elements
- Modern abstract graphics
- Minimal, organized composition
- Corporate aesthetic
- Trust-building visual elements

COMPOSITION:
- Center: Professional business graphics
- Background: Clean gradient
- Bottom 40%: Solid panel for text
- Professional, trustworthy, modern feel

STYLE: Professional business flyer, Instagram corporate post, clean modern design
${baseInstructions}
`
      };

      const nichePrompt = nichePrompts[niche] || nichePrompts.geral;

      return `${nichePrompt}

=== FINAL REQUIREMENTS ===

ASPECT RATIO: 3:4 vertical (1080x1920px)
QUALITY: High-resolution graphic design
OUTPUT: Graphic design flyer background ready for text overlay

This must look like a professional GRAPHIC DESIGN FLYER created by a designer,
NOT a realistic photograph. Think Instagram marketing post, NOT stock photo.
`;
   }
};

module.exports = HYBRID_GENERATION_SYSTEM;
