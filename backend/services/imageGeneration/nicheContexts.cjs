/**
 * NICHE CONTEXTS - Definições visuais para cada nicho de negócio
 * Usado pelo Prompt Engine para guiar a IA na direção artistica correta.
 */

const NICHE_PROMPTS = {
    // 🚗 AUTOMOTIVO
    mecanica: {
        scene: "Modern automotive workshop with professional LED lighting and organized tools",
        elements: "car lift, diagnostic tablet, high-end tools, metal workbench, mechanic in uniform (background)",
        colors: ["#1a1a1a (Deep Black)", "#ff0000 (Racing Red)", "#c0c0c0 (Metallic Silver)"],
        mood: "Professional, trustworthy, technical, industrial",
        textStyle: "Bold sans-serif, metallic finish, maximum legibility",
        negative: "dirty, messy, rust, broken cars, oil spills"
    },
    estetica_automotiva: {
        scene: "High-end car detailing studio with studio lighting reflecting on polished car paint",
        elements: "foam cannon, polisher, ceramic coating bottles, microfiber towels, luxury car",
        colors: ["#000000 (Black)", "#00ffcc (Neon Teal)", "#ffffff (White)"],
        mood: "Sleek, shiny, pristine, luxury",
        textStyle: "Modern, thin, elegant sans-serif"
    },
    
    // 🍔 ALIMENTAÇÃO
    pizzaria: {
        scene: "Warm rustic italian pizzeria wooden table with flour dusting and fresh ingredients",
        elements: "hot pizza with melting cheese, basil, brick oven (blur), tomato sauce, olive oil",
        colors: ["#8b0000 (Tomato Red)", "#ffD700 (Cheese Gold)", "#2e8b57 (Basil Green)"],
        mood: "Appetizing, warm, traditional, delicious",
        textStyle: "Handwritten or serif, warm colors"
    },
    hamburgueria: {
        scene: "Dark moody gourmet burger join with neon sign in background",
        elements: "juicy artisanal burger, melted cheddar, brioche bun, fries, craft beer, wooden board",
        colors: ["#111111 (Black)", "#ffae00 (Cheddar)", "#5c3a21 (BBQ)"],
        mood: "Juicy, intense, urban, mouth-watering",
        textStyle: "Bold distressed sans-serif or neon style"
    },
    restaurante: {
        scene: "Elegant fine dining table setting with blurred restaurant ambience",
        elements: "gourmet plated food, wine glass, silverware, linen napkin, candle light",
        colors: ["#2c2c2c (Dark Grey)", "#d4af37 (Gold)", "#ffffff (White)"],
        mood: "Sophisticated, fine dining, elegant",
        textStyle: "Classic Serif, golden or white"
    },
    sushi: {
        scene: "Minimalist japanese wooden counter with zen atmosphere",
        elements: "fresh salmon sashimi, nigiri, chopsticks, soy sauce, bamboo mat, orchid flower",
        colors: ["#000000 (Black)", "#fa8072 (Salmon)", "#fffdd0 (Rice)"],
        mood: "Fresh, zen, premium, clean",
        textStyle: "Brush style or clean modern sans-serif"
    },
    acai: {
        scene: "Tropical vibrant setting with summer sunlight",
        elements: "fresh acai bowl with granola and fruits, banana slices, strawberry, mint leaf, splashes",
        colors: ["#4b0082 (Acai Purple)", "#green (Fresh Green)", "#yellow (Banana)"],
        mood: "Refreshing, energetic, natural, cold",
        textStyle: "Bold playful sans-serif, white or yellow"
    },

    // 💅 BELEZA & ESTÉTICA
    salao_beleza: {
        scene: "Luxury beauty salon interior with big mirrors and soft lighting",
        elements: "hair dryer, professional scissors, beauty products, comfortable leather chair, flower vase",
        colors: ["#pink (Rose Gold)", "#ffffff (White)", "#000000 (Black)"],
        mood: "Glamorous, feminine, transformative, chic",
        textStyle: "Elegant script or fashion serif"
    },
    barbearia: {
        scene: "Classic vintage barber shop with leather chairs and wood textures",
        elements: "straight razor, shaving brush, classic barber pole, pomade jars, leather textures",
        colors: ["#3b2f2f (Dark Leather)", "#b8860b (Brass)", "#000000 (Black)"],
        mood: "Masculine, vintage, classic, gentleman",
        textStyle: "Vintage slab serif or western style"
    },
    estetica: {
        scene: "Clean white medical aesthetic clinic spa room",
        elements: "orchid flower, rolled white towels, zen stones, medical device, soft natural light",
        colors: ["#ffffff (White)", "#e0f7fa (Cyan Tint)", "#d4af37 (Gold Accents)"],
        mood: "Clinical but relaxing, pure, medical, trustworthy",
        textStyle: "Clean thin sans-serif, minimalist"
    },
    manicure: {
        scene: "Close up of perfect nail art with soft bokeh background",
        elements: "nail polish bottles, manicure tools, female hands, flowers, glitter",
        colors: ["#ff69b4 (Hot Pink)", "#purple", "#white"],
        mood: "Detailed, colorful, delicate, artistic",
        textStyle: "Feminine script or modern sans-serif"
    },

    // 🏥 SAÚDE
    odontologia: {
        scene: "Ultra-modern dental clinic reception or office, bright and clean",
        elements: "perfect white smile model, toothbrush, dental mirror, blue medical light",
        colors: ["#0077be (Medical Blue)", "#ffffff (White)", "#e3f2fd (Light Blue)"],
        mood: "Clean, hygienic, friendly, professional",
        textStyle: "Modern humanist sans-serif, blue or white"
    },
    medico: {
        scene: "Professional medical office consultation room",
        elements: "stethoscope, doctor coat, medical clipboard, anatomy model, desk",
        colors: ["#0047AB (Cobalt Blue)", "#ffffff (White)", "#gray"],
        mood: "Serious, trustworthy, caring, scientific",
        textStyle: "Corporate sans-serif, very legible"
    },
    
    // 🏠 SERVIÇOS & CASAS
    imobiliaria: {
        scene: "Modern luxury house exterior with blue sky and green lawn",
        elements: "keys, house model, contract, 'sold' sign, sunlight",
        colors: ["#003366 (Navy)", "#ffffff (White)", "#4caf50 (Green)"],
        mood: "Success, homey, aspirational, stable",
        textStyle: "Bold corporate serif or sans-serif"
    },
    reformas: {
        scene: "Construction site or newly renormalized room",
        elements: "paint roller, blueprint, hard hat, measuring tape, wooden floor",
        colors: ["#ff9800 (Construction Orange)", "#333333 (Dark Grey)", "#ffffff"],
        mood: "Constructive, precise, reliable, transformative",
        textStyle: "Strong block sans-serif"
    },
    solar: {
        scene: "House roof with solar panels reflecting bright sun",
        elements: "sun rays, solar panel texture, green leaf, energy icon, electric bolt",
        colors: ["#ffeb3b (Sun Yellow)", "#1976d2 (Sky Blue)", "#4caf50 (Eco Green)"],
        mood: "Clean energy, bright, futuristic, savings",
        textStyle: "Modern thin sans-serif"
    },
    climatizacao: {
        scene: "Split air conditioner unit blowing cold air with ice crystals effect",
        elements: "remote control, blue cold wind flows, snowflakes, thermometer",
        colors: ["#00bcd4 (Cyan)", "#ffffff (White)", "#0d47a1 (Dark Blue)"],
        mood: "Cool, refreshing, technological, relief",
        textStyle: "Cold/Ice effect sans-serif"
    },

    // 🐾 PETS
    petshop: {
        scene: "Happy dog or cat playing in a grooming salon or park",
        elements: "bones, paw prints, pet food bowl, grooming scissors, bubbles",
        colors: ["#ff9800 (Orange)", "#8bc34a (Green)", "#ffffff"],
        mood: "Playful, cute, happy, energetic",
        textStyle: "Rounded bubbly comic or sans-serif"
    },

    // 💼 PROFISSIONAL (Fallback)
    advogado: {
        scene: "Law office library with wood bookshelves and scales of justice",
        elements: "gavel, leather book, scales of justice, fountain pen, document",
        colors: ["#4b3621 (Dark Wood)", "#d4af37 (Gold)", "#000000"],
        mood: "Serious, justice, traditional, authoritative",
        textStyle: "Traditional Serif (Times New Roman style)"
    },
    contabilidade: {
        scene: "Modern office desk with calculator and financial graphs",
        elements: "calculator, laptop, pen, stack of coins, growing chart",
        colors: ["#1b5e20 (Money Green)", "#ffffff", "#333333"],
        mood: "Organized, financial, growing, success",
        textStyle: "Monospace or clean sans-serif"
    },
    
    // 📦 OUTROS
    delivery: {
        scene: "Dynamic view of a delivery motorcycle in the city",
        elements: "delivery bag, motion blur, smartphone with map, package",
        colors: ["#ff0000 (Alert Red)", "#ffffff", "#000000"],
        mood: "Fast, urgent, convenient, urban",
        textStyle: "Italic bold sans-serif (speed)"
    }
};

module.exports = NICHE_PROMPTS;
