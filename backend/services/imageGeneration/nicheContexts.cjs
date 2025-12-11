/**
 * NICHE CONTEXTS - Definições visuais para cada nicho de negócio
 * Usado pelo Prompt Engine para guiar a IA na direção artistica correta.
 */

const NICHE_PROMPTS = {
    // 🔧 SERVIÇOS TÉCNICOS
    assistencia_tecnica: {
        scene: "High-tech electronics repair workbench with tools and motherboard",
        elements: "soldering iron, circuit board, disassembled smartphone, multimeter, magnifying glass, antistatic mat",
        colors: ["#0055ff (Tech Blue)", "#333333 (Dark Grey)", "#ffffff (White)"],
        mood: "Technical, precise, expert, reliable",
        textStyle: "Modern tech sans-serif, clean and digital",
        negative: "dirty, messy, broken glass, old computer, blur"
    },
    // 🚗 AUTOMOTIVO
    mecanica: {
        scene: "Modern automotive workshop with professional LED lighting and organized tools, sharp focus",
        elements: "car lift, diagnostic tablet, high-end tools, metal workbench, mechanic in uniform (background)",
        colors: ["#1a1a1a (Deep Black)", "#ff0000 (Racing Red)", "#c0c0c0 (Metallic Silver)"],
        mood: "Professional, trustworthy, technical, industrial",
        textStyle: "Bold sans-serif, metallic finish, maximum legibility",
        negative: "dirty, messy, rust, broken cars, oil spills, blur, bokeh"
    },
    estetica_automotiva: {
        scene: "High-end car detailing studio with studio lighting reflecting on polished car paint, crystal clear",
        elements: "foam cannon, polisher, ceramic coating bottles, microfiber towels, luxury car",
        colors: ["#000000 (Black)", "#00ffcc (Neon Teal)", "#ffffff (White)"],
        mood: "Sleek, shiny, pristine, luxury",
        textStyle: "Modern, thin, elegant sans-serif"
    },
    
    // 🍔 ALIMENTAÇÃO
    pizzaria: {
        scene: "Warm rustic italian pizzeria wooden table with flour dusting and fresh ingredients, high resolution",
        elements: "hot pizza with melting cheese, basil, brick oven, tomato sauce, olive oil",
        colors: ["#8b0000 (Tomato Red)", "#ffD700 (Cheese Gold)", "#2e8b57 (Basil Green)"],
        mood: "Appetizing, warm, traditional, delicious",
        textStyle: "Handwritten or serif, warm colors"
    },
    hamburgueria: {
        scene: "Dark moody gourmet burger join with neon sign in background, sharp details",
        elements: "juicy artisanal burger, melted cheddar, brioche bun, fries, craft beer, wooden board",
        colors: ["#111111 (Black)", "#ffae00 (Cheddar)", "#5c3a21 (BBQ)"],
        mood: "Juicy, intense, urban, mouth-watering",
        textStyle: "Bold distressed sans-serif or neon style"
    },
    restaurante: {
        scene: "Elegant fine dining table setting with clear restaurant ambience",
        elements: "gourmet plated food, wine glass, silverware, linen napkin, candle light",
        colors: ["#2c2c2c (Dark Grey)", "#d4af37 (Gold)", "#ffffff (White)"],
        mood: "Sophisticated, fine dining, elegant",
        textStyle: "Classic Serif, golden or white"
    },
    sushi: {
        scene: "Minimalist japanese wooden counter with zen atmosphere, sharp focus",
        elements: "fresh salmon sashimi, nigiri, chopsticks, soy sauce, bamboo mat, orchid flower",
        colors: ["#000000 (Black)", "#fa8072 (Salmon)", "#fffdd0 (Rice)"],
        mood: "Fresh, zen, premium, clean",
        textStyle: "Brush style or clean modern sans-serif"
    },
    acai: {
        scene: "Tropical vibrant setting with summer sunlight, crystal clear",
        elements: "fresh acai bowl with granola and fruits, banana slices, strawberry, mint leaf, splashes",
        colors: ["#4b0082 (Acai Purple)", "#green (Fresh Green)", "#yellow (Banana)"],
        mood: "Refreshing, energetic, natural, cold",
        textStyle: "Bold playful sans-serif, white or yellow"
    },

    // 💅 BELEZA & ESTÉTICA
    salao_beleza: {
        scene: "Luxury beauty salon interior with big mirrors and perfect lighting",
        elements: "hair dryer, professional scissors, beauty products, comfortable leather chair, flower vase",
        colors: ["#pink (Rose Gold)", "#ffffff (White)", "#000000 (Black)"],
        mood: "Glamorous, feminine, transformative, chic",
        textStyle: "Elegant script or fashion serif"
    },
    barbearia: {
        scene: "Classic vintage barber shop with leather chairs and wood textures, sharp focus",
        elements: "straight razor, shaving brush, classic barber pole, pomade jars, leather textures",
        colors: ["#3b2f2f (Dark Leather)", "#b8860b (Brass)", "#000000 (Black)"],
        mood: "Masculine, vintage, classic, gentleman",
        textStyle: "Vintage slab serif or western style"
    },
    estetica: {
        scene: "Clean white medical aesthetic clinic spa room, high key lighting",
        elements: "orchid flower, rolled white towels, zen stones, medical device, soft natural light",
        colors: ["#ffffff (White)", "#e0f7fa (Cyan Tint)", "#d4af37 (Gold Accents)"],
        mood: "Clinical but relaxing, pure, medical, trustworthy",
        textStyle: "Clean thin sans-serif, minimalist"
    },
    manicure: {
        scene: "Close up of perfect nail art with clear background",
        elements: "nail polish bottles, manicure tools, female hands, flowers, glitter",
        colors: ["#ff69b4 (Hot Pink)", "#purple", "#white"],
        mood: "Detailed, colorful, delicate, artistic",
        textStyle: "Feminine script or modern sans-serif"
    },

    // 🏥 SAÚDE
    odontologia: {
        scene: "Ultra-modern dental clinic reception or office, bright and clean, sharp focus",
        elements: "perfect white smile model, toothbrush, dental mirror, blue medical light",
        colors: ["#0077be (Medical Blue)", "#ffffff (White)", "#e3f2fd (Light Blue)"],
        mood: "Clean, hygienic, friendly, professional",
        textStyle: "Modern humanist sans-serif, blue or white"
    },
    medico: {
        scene: "Professional medical office consultation room, clear visibility",
        elements: "stethoscope, doctor coat, medical clipboard, anatomy model, desk",
        colors: ["#0047AB (Cobalt Blue)", "#ffffff (White)", "#gray"],
        mood: "Serious, trustworthy, caring, scientific",
        textStyle: "Corporate sans-serif, very legible"
    },
    
    // 🏠 SERVIÇOS & CASAS
    imobiliaria: {
        scene: "Modern luxury house exterior with blue sky and green lawn, wide angle, sharp",
        elements: "keys, house model, contract, 'sold' sign, sunlight",
        colors: ["#003366 (Navy)", "#ffffff (White)", "#4caf50 (Green)"],
        mood: "Success, homey, aspirational, stable",
        textStyle: "Bold corporate serif or sans-serif"
    },
    reformas: {
        scene: "Construction site or newly renovated room, sharp details",
        elements: "paint roller, blueprint, hard hat, measuring tape, wooden floor",
        colors: ["#ff9800 (Construction Orange)", "#333333 (Dark Grey)", "#ffffff"],
        mood: "Constructive, precise, reliable, transformative",
        textStyle: "Strong block sans-serif"
    },
    solar: {
        scene: "House roof with solar panels reflecting bright sun, high resolution",
        elements: "sun rays, solar panel texture, green leaf, energy icon, electric bolt",
        colors: ["#ffeb3b (Sun Yellow)", "#1976d2 (Sky Blue)", "#4caf50 (Eco Green)"],
        mood: "Clean energy, bright, futuristic, savings",
        textStyle: "Modern thin sans-serif"
    },
    climatizacao: {
        scene: "Split air conditioner unit blowing cold air with ice crystals effect, sharp",
        elements: "remote control, blue cold wind flows, snowflakes, thermometer",
        colors: ["#00bcd4 (Cyan)", "#ffffff (White)", "#0d47a1 (Dark Blue)"],
        mood: "Cool, refreshing, technological, relief",
        textStyle: "Cold/Ice effect sans-serif"
    },

    // 🐾 PETS
    petshop: {
        scene: "Happy dog or cat playing in a grooming salon or park, action shot, sharp focus",
        elements: "bones, paw prints, pet food bowl, grooming scissors, bubbles",
        colors: ["#ff9800 (Orange)", "#8bc34a (Green)", "#ffffff"],
        mood: "Playful, cute, happy, energetic",
        textStyle: "Rounded bubbly comic or sans-serif"
    },

    // 💼 PROFISSIONAL (Fallback)
    profissional: {
        scene: "Modern minimalist office workspace with laptop and notebook, business atmosphere",
        elements: "macbook, coffee cup, pen, glasses, clean desk",
        colors: ["#2c3e50 (Dark Blue)", "#ecf0f1 (Light Grey)", "#bdc3c7 (Silver)"],
        mood: "Professional, clean, organized, business",
        textStyle: "Clean modern sans-serif",
        negative: "cluttered, messy, dark, blur"
    },
    advogado: {
        scene: "Law office library with wood bookshelves and scales of justice, clear focus",
        elements: "gavel, leather book, scales of justice, fountain pen, document",
        colors: ["#4b3621 (Dark Wood)", "#d4af37 (Gold)", "#000000"],
        mood: "Serious, justice, traditional, authoritative",
        textStyle: "Traditional Serif (Times New Roman style)"
    },
    contabilidade: {
        scene: "Modern office desk with calculator and financial graphs, sharp text",
        elements: "calculator, laptop, pen, stack of coins, growing chart",
        colors: ["#1b5e20 (Money Green)", "#ffffff", "#333333"],
        mood: "Organized, financial, growing, success",
        textStyle: "Monospace or clean sans-serif"
    },
    
    // 📦 OUTROS
    delivery: {
        scene: "Professional courier service with package and city background, motion freeze",
        elements: "delivery bag, smartphone with map, package, courier uniform",
        colors: ["#ff0000 (Alert Red)", "#ffffff", "#000000"],
        mood: "Fast, urgent, convenient, urban",
        textStyle: "Italic bold sans-serif (speed)"
    },

    // 💪 SAÚDE & FITNESS
    academia: {
        scene: "Modern gym interior with weights and cardio equipment, sharp focus",
        elements: "dumbbells, treadmill, mirrors, fitness model workout, protein shaker",
        colors: ["#000000 (Black)", "#ffff00 (Neon Yellow)", "#grey"],
        mood: "Energetic, strong, intense, motivating",
        textStyle: "Bold slanted sports font, dynamic"
    },

    // 🍞 GASTRONOMIA (Novos)
    padaria: {
        scene: "Traditional bakery counter with fresh golden breads, warm lighting",
        elements: "fresh bread basket, croissant, flour dust, baker hat, ears of wheat",
        colors: ["#d2691e (Bread Brown)", "#f4a460 (Golden)", "#ffffff"],
        mood: "Warm, fresh, homemade, traditional",
        textStyle: "Rustic serif or handwritten"
    },
    cafeteria: {
        scene: "Cozy coffee shop table with steam coming from cup, sharp detail",
        elements: "latte art, coffee beans, espresso machine, wooden table, croissant",
        colors: ["#6f4e37 (Coffee Brown)", "#f5f5dc (Beige)", "#black"],
        mood: "Cozy, aromatic, premium, energizing",
        textStyle: "Vintage minimalist sans-serif"
    },
    supermercado: {
        scene: "Bright supermarket aisle with fresh colorful products, high resolution",
        elements: "shopping cart, fresh fruits, vegetables, shelves, discount tags",
        colors: ["#ff0000 (Sale Red)", "#ffffff", "#228b22 (Fresh Green)"],
        mood: "Fresh, variety, economical, family",
        textStyle: "Bold heavy sans-serif (retail style)"
    },

    // 👗 LIFESTYLE
    moda: {
        scene: "Fashion boutique or street style photo shoot, high fashion",
        elements: "trendy clothing on hanger, mannequin, fashion accessories, shopping bags",
        colors: ["#000000 (Chic Black)", "#ffffff", "#gold"],
        mood: "Trendy, stylish, elegant, exclusive",
        textStyle: "Modern editorial serif (Vogue style)"
    },
    viagens: {
        scene: "Breathtaking travel destination landscape (beach or city), cinematic",
        elements: "airplane wing, suitcase, passport, palm trees, blue ocean",
        colors: ["#00bfff (Ocean Blue)", "#ffd700 (Sun)", "#white"],
        mood: "Adventurous, relaxing, dream, freedom",
        textStyle: "Clean modern sans-serif or handwritten travel"
    },
    eventos: {
        scene: "Festive party decoration with balloons and lighting, vibrant",
        elements: "balloons, confetti, champagne glass, party lights, gift box",
        colors: ["#ffd700 (Gold)", "#ff00ff (Purple)", "#00ffff (Cyan)"],
        mood: "Celebration, happy, fun, memorable",
        textStyle: "Festive script or bold display font"
    },

    // 📚 SERVIÇOS GERAIS
    educacao: {
        scene: "Modern classroom or study desk with books and learning tools",
        elements: "books, globe, graduation cap, pencil, laptop, blackboard",
        colors: ["#000080 (Navy Blue)", "#ffffff", "#ffd700 (Success Gold)"],
        mood: "Knowledge, growth, smart, future",
        textStyle: "Academic serif or clean geometric sans"
    },
    limpeza: {
        scene: "Sparkling clean living room with cleaning tools, bright window",
        elements: "spray bottle, yellow gloves, bucket, vacuum cleaner, sparkles",
        colors: ["#00bfff (Clean Blue)", "#ffffff (Pure White)", "#ffff00 (Lemon)"],
        mood: "Clean, fresh, hygienic, efficient",
        textStyle: "Clean rounded sans-serif"
    },
    seguranca: {
        scene: "High-tech security monitoring room or secure home gate",
        elements: "CCTV camera, digital shield lock icon, security guard uniform, fence",
        colors: ["#002244 (Security Blue)", "#ffff00 (Warning)", "#grey"],
        mood: "Safe, protected, vigilant, trustworthy",
        textStyle: "Strong block military/tech font"
    }
};

module.exports = NICHE_PROMPTS;
