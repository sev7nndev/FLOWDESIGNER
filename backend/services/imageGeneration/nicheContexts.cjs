/**
 * NICHE CONTEXTS - Definições visuais para cada nicho de negócio
 * Usado pelo Prompt Engine para guiar a IA na direção artistica correta.
 */

const NICHE_PROMPTS = {
    // 🔧 SERVIÇOS TÉCNICOS
    assistencia_tecnica: {
        scene: "Flat digital pattern of circuit board traces with blue neon glow effect, abstract tech grid background",
        elements: "schematic line graphics, cybernetic detail overlays, floating motherboard component icons, glowing node effects",
        colors: ["#0055ff (Tech Blue)", "#1a1a1a (Dark Metal)", "#ffffff (White Highlights)"],
        mood: "Futuristic, technical, digital, reliable",
        textStyle: "Modern tech sans-serif, clean and digital",
        negative: "billboard, mockup, photo, room, desk, physical context, cluttered, messy, broken glass, old computer, blur"
    },
    // 🚗 AUTOMOTIVO
    mecanica: {
        scene: "Flat digital carbon fiber texture pattern with orange neon accent lines, dark metallic gradient background",
        elements: "metallic gear graphic overlays, wrench icon elements, speed line effects, engine blueprint pattern",
        colors: ["#0d0d0d (Carbon Black)", "#ff3300 (Performance Orange)", "#silver (Chrome)"],
        mood: "High performance, powerful, industrial, automotive",
        textStyle: "Bold racing sans-serif, metallic finish",
        negative: "billboard, mockup, photo, garage, street, rust, broken cars, oil spills, physical environment"
    },
    estetica_automotiva: {
        scene: "Premium liquid metal background with glossy reflections and light flares",
        elements: "sparkle effects, water droplets, smooth curves, shield/protection icons",
        colors: ["#000000 (Piano Black)", "#00ffcc (Cyan Glow)", "#ffffff (Shine)"],
        mood: "Luxury, showroom quality, pristine, shiny",
        textStyle: "Sleek automotive sans-serif"
    },
    
    // 🍔 ALIMENTAÇÃO
    pizzaria: {
        scene: "Flat wood grain texture pattern with flour dust effect overlay and warm fire glow gradient edges",
        elements: "fresh basil leaf graphics floating, flying tomato slice illustrations, melted cheese splash effect, fire spark particles",
        colors: ["#8b0000 (Tomato Red)", "#ffD700 (Cheese Gold)", "#2f1a0e (Wood)"],
        mood: "Appetizing, hot, traditional, artisanal",
        textStyle: "Handwritten or rustic serif",
        negative: "billboard, mockup, photo, kitchen, oven, table, physical pizza, restaurant interior"
    },
    hamburgueria: {
        scene: "Flat digital gradient from dark slate to charcoal with abstract smoke pattern overlay and vibrant BBQ sauce splash effects",
        elements: "fire flame graphics, flying sesame seed particles, condensation droplet effects, grill marks texture pattern",
        colors: ["#111111 (Matte Black)", "#ffae00 (Cheddar)", "#d32f2f (Ketchup)"],
        mood: "Juicy, intense, radical, delicious",
        textStyle: "Bold grunge or neon display font",
        negative: "billboard, mockup, photo, restaurant, kitchen, grill, table, physical burger, street food"
    },
    restaurante: {
        scene: "Elegant dark silk texture background with golden bokeh light particles",
        elements: "minimalist plate outline, golden cutlery graphics, steam swirls, luxury patterns",
        colors: ["#1a1a1a (Luxury Dark)", "#d4af37 (Gold Foil)", "#ffffff"],
        mood: "Sophisticated, exclusive, gourmet, premium",
        textStyle: "Classic elegant serif"
    },
    sushi: {
        scene: "Minimalist black slate texture with bamboo leaf patterns and water ripples",
        elements: "cherry blossom petals falling, ink wash brush strokes, koi fish graphic",
        colors: ["#000000 (Ink Black)", "#fa8072 (Salmon Pink)", "#f0f0f0 (Rice White)"],
        mood: "Zen, artistic, fresh, japanese tradition",
        textStyle: "Brush strokes or clean modern sans"
    },
    acai: {
        scene: "Vibrant purple liquid splash background with tropical leaf shadows",
        elements: "flying frozen acai drops, banana slices, granola texture, sun rays",
        colors: ["#4b0082 (Acai Deep)", "#00ff00 (Neon Green)", "#ffff00 (Sun Yellow)"],
        mood: "Energetic, summer, refreshing, organic",
        textStyle: "Fun bold sans-serif"
    },

    // 💅 BELEZA & ESTÉTICA
    salao_beleza: {
        scene: "Soft rose gold gradient background with silk fabric texture",
        elements: "floating golden scissors, hair strand curves, glitter dust, beauty sparkles",
        colors: ["#fce4ec (Soft Pink)", "#d4af37 (Gold)", "#ffffff (Pearl)"],
        mood: "Glamorous, feminine, transformative, chic",
        textStyle: "Fashion editorial serif"
    },
    barbearia: {
        scene: "Flat vintage wood grain and leather texture pattern with tobacco smoke effect overlay",
        elements: "razor blade graphic icon, vintage typography element overlays, barber pole stripe pattern",
        colors: ["#2c1b18 (Dark Leather)", "#c0a062 (Aged Gold)", "#000000"],
        mood: "Masculine, vintage, classic, gentleman",
        textStyle: "Western or vintage slab serif",
        negative: "billboard, mockup, photo, barbershop interior, mirror, chair, physical tools, room"
    },
    estetica: {
        scene: "Clean white marble texture with soft teal water ripples",
        elements: "lotus flower graphic, zen stones, soft light rays, aroma swirls",
        colors: ["#ffffff (Clean White)", "#80deea (Cyan Tint)", "#gold"],
        mood: "Pure, relaxing, medical, aesthetic",
        textStyle: "Minimalist thin sans-serif"
    },
    manicure: {
        scene: "Bright pastel gradient background with glossy finish",
        elements: "nail polish splatter, flower petals, glitter overlay, light bokeh",
        colors: ["#ff80ab (Pink)", "#e1bee7 (Purple)", "#ffffff"],
        mood: "Artistic, colorful, delicate, beauty",
        textStyle: "Playful feminine script"
    },

    // 🏥 SAÚDE
    odontologia: {
        scene: "Clean blue medical gradient background with hexagonal geometric patterns",
        elements: "white tooth 3D icon, sparkles, water splash, fresh mint leaf",
        colors: ["#0077be (Clinical Blue)", "#ffffff (Bright White)", "#e0f7fa (Ice Blue)"],
        mood: "Fresh, hygienic, trustworthy, professional",
        textStyle: "Modern medical sans-serif"
    },
    medico: {
        scene: "Professional white and navy blue abstract background with pulse line graph",
        elements: "cross symbol (subtle), DNA helix graphic, molecular structure",
        colors: ["#003366 (Navy)", "#ffffff", "#4fc3f7 (Light Blue)"],
        mood: "Scientific, serious, caring, health",
        textStyle: "Clean corporate sans-serif"
    },
    
    // 🏠 SERVIÇOS & CASAS
    imobiliaria: {
        scene: "Premium architectural blueprint overlay on blue hour sky background",
        elements: "house outline sketch, key icon, geometric building shapes, lens flare",
        colors: ["#0d47a1 (Royal Blue)", "#ffffff", "#gold"],
        mood: "Trust, stability, premium, dream home",
        textStyle: "Strong corporate serif"
    },
    reformas: {
        scene: "Construction schematic background with grunge paint brush strokes",
        elements: "ruler lines, paint splash, brick texture, hammer icon, blueprint grid",
        colors: ["#ff6f00 (Amber)", "#212121 (Asphalt)", "#ffffff"],
        mood: "Constructive, strong, renovation, bold",
        textStyle: "Heavy block sans-serif"
    },
    solar: {
        scene: "Bright sunny sky background with photovoltaic cell texture pattern",
        elements: "sun burst, clean energy green leaf, electric bolt icon, circuit lines",
        colors: ["#fdd835 (Sun)", "#0277bd (Sky)", "#4caf50 (Eco)"],
        mood: "Sustainable, bright, future, energy",
        textStyle: "Modern eco-friendly sans-serif"
    },
    climatizacao: {
        scene: "Frozen ice texture background with cold blue wind swirls",
        elements: "snowflakes, thermometer icon, cool air flow lines, water condensation",
        colors: ["#00e5ff (Cyan)", "#ffffff", "#01579b (Deep Blue)"],
        mood: "Freezing, relief, refreshing, powerful",
        textStyle: "Icy effects sans-serif"
    },

    // 🐾 PETS
    petshop: {
        scene: "Playful pop-art background with paw print pattern and bone shapes",
        elements: "cartoon bubbles, bouncy balls, hearts, dog collar graphic",
        colors: ["#ff9800 (Orange)", "#8bc34a (Lime Green)", "#ffffff"],
        mood: "Fun, lovely, energetic, friendly",
        textStyle: "Bubble font or comic style"
    },

    // 💼 PROFISSIONAL (Fallback - GENERIC FLYER TEMPLATE)
    profissional: {
        scene: "Abstract professional business background with geometric shapes and dynamic lines",
        elements: "3D floating shapes, light rays, subtle tech grid, blurred city lights overlay",
        colors: ["#1c3b72 (Business Blue)", "#f5f5f5 (Light Grey)", "#ffc107 (Accent Gold)"],
        mood: "Corporate, reliable, successful, modern",
        textStyle: "Clean bold sans-serif",
        negative: "cluttered, messy, photo of a laptop, writing on paper, hands"
    },
    advogado: {
        scene: "Classic column marble texture background with deep red velvet drape",
        elements: "scales of justice graphic, gavel icon, pillar silhouette, parchment texture",
        colors: ["#4a1414 (Deep Red)", "#c5a059 (Gold)", "#000000"],
        mood: "Solemn, authoritative, justice, premium",
        textStyle: "Traditional Roman Serif"
    },
    contabilidade: {
        scene: "Digital financial grid background with rising graph arrows (green)",
        elements: "calculator buttons, percentage signs, coin stack graphic, data stream",
        colors: ["#1b5e20 (Profit Green)", "#ffffff", "#263238 (Dark Grey)"],
        mood: "Growth, profit, organized, success",
        textStyle: "Monospace financial font"
    },
    
    // 📦 OUTROS
    delivery: {
        scene: "Flat digital motion blur pattern with abstract speed line effects, dynamic gradient background",
        elements: "location pin icon graphics, fast arrow elements, checkered flag pattern overlay, delivery box icon",
        colors: ["#d50000 (Fast Red)", "#ffea00 (Yellow)", "#ffffff"],
        mood: "Urgent, fast, express, dynamic",
        textStyle: "Italic slanted bold font",
        negative: "billboard, mockup, photo, street, road, motorcycle, physical delivery, traffic"
    },

    // 💪 SAÚDE & FITNESS
    academia: {
        scene: "Dark intense background with grungy concrete texture and neon yellow stripes",
        elements: "heavy metal texture, sweat drops, heartbeat line, dumbbell icon",
        colors: ["#000000 (Hard Black)", "#c6ff00 (Volt)", "#ffffff"],
        mood: "Hardcore, power, strength, grit",
        textStyle: "Aggressive sports display font"
    },

    // 🍞 GASTRONOMIA
    padaria: {
        scene: "Warm wheat field texture background with golden sunlight glow",
        elements: "flour explosion, wheat ears, rolling pin graphic, steam",
        colors: ["#a1887f (Wheat)", "#ffecb3 (Cream)", "#5d4037 (Dark Brown)"],
        mood: "Homemade, warm, morning, fresh",
        textStyle: "Rustic vintage serif"
    },
    cafeteria: {
        scene: "Coffee stain artistic background on beige paper texture",
        elements: "steam swirls, coffee bean pattern, mug silhouette, cinnamon stick",
        colors: ["#3e2723 (Espresso)", "#d7ccc8 (Latte)", "#795548 (Cocoa)"],
        mood: "Aromatic, cozy, artistic, break",
        textStyle: "Minimalist hipster sans-serif"
    },
    supermercado: {
        scene: "Bright radial burst background (yellow and red) for offers",
        elements: "percent signs %, sale tag graphics, confetti, shopping basket icon",
        colors: ["#d50000 (Sale Red)", "#ffeb3b (Yellow Alert)", "#ffffff"],
        mood: "Bargain, urgent, fresh, variety",
        textStyle: "Heavy impact sans-serif (Sale style)"
    },

    // 👗 LIFESTYLE
    moda: {
        scene: "Minimalist studio grey background with spotlight and shadow play",
        elements: "hanger silhouette, fabric flow, diamond sparkle, geometric fashion shapes",
        colors: ["#212121 (Vogue Black)", "#ffffff (White)", "#gold"],
        mood: "Chic, trendy, elegant, high-fashion",
        textStyle: "Thin editorial serif"
    },
    viagens: {
        scene: "Dreamy cloud sky background with map contour lines overlay",
        elements: "paper plane, location pin, globe wireframe, sun flare",
        colors: ["#00b0ff (Sky Blue)", "#ffeb3b (Sun)", "#ffffff"],
        mood: "Freedom, world, explore, dream",
        textStyle: "Handwritten travel font"
    },
    eventos: {
        scene: "Vibrant bokeh party background with confetti explosion and laser beams",
        elements: "music notes, balloon graphics, champagne glass outline, sparkles",
        colors: ["#6200ea (Purple)", "#00e5ff (Cyan)", "#ffed00 (Gold)"],
        mood: "Fun, night, celebration, electric",
        textStyle: "Loud festive display font"
    },

    // 📚 SERVIÇOS GERAIS
    educacao: {
        scene: "Blueprint grid or lined paper background with doodle sketches",
        elements: "lightbulb idea icon, pencil drawn elements, formula, book outline",
        colors: ["#1a237e (Academic Blue)", "#ffca28 (Pencil Yellow)", "#ffffff"],
        mood: "Smart, creative, learning, bright",
        textStyle: "Serif or Chalkboard style"
    },
    limpeza: {
        scene: "Crystal clear water splash background, bright and airy",
        elements: "bubbles, sparkles, shine star icons, feather duster graphic",
        colors: ["#00b0ff (Water Blue)", "#ffffff (Sparkle)", "#green"],
        mood: "Fresh, hygienic, pure, shiny",
        textStyle: "Rounded clean bubbly font"
    },
    seguranca: {
        scene: "Dark blue tech grid background with padlock digital overlay",
        elements: "shield icon, radar sweep, binary code (subtle), circuit lines",
        colors: ["#002f6c (Police Blue)", "#ffeb3b (Alert)", "#ffffff"],
        mood: "Secure, guarded, strong, tech",
        textStyle: "Stencil or Military font"
    }
};

module.exports = NICHE_PROMPTS;
