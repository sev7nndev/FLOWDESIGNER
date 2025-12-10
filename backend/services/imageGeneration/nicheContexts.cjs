// Niche Context Definitions for FLOW Image Generation Engine
// Defines visual styles, elements, and colors for specific business types

const NICHE_PROMPTS = {
    // === AUTOMOTIVE ===
    mecanica: {
        scene: "Modern automotive workshop with professional LED lighting, clean concrete floor",
        elements: "organized tool wall, car lift with a modern sedan, diagnostic computer, metal workbench",
        colors: ["#1a1a1a", "#e63946", "#f1faee"], // Dark grey, Red, White
        mood: "Professional, Trustworthy, Industrial, Clean",
        textStyle: "Bold, Industrial, Sans-serif, Metallic textures",
        keywords: ["automotive", "mechanic", "car repair", "workshop", "tools", "engine"]
    },
    estetica_automotiva: {
        scene: "High-end car detailing studio with studio lighting, glossy floor reflection",
        elements: "luxury car being polished, foam cannon, microfiber towels, ceramic coating bottles",
        colors: ["#000000", "#ffd700", "#ffffff"], // Black, Gold, White
        mood: "Luxury, Shiny, Meticulous, Premium",
        textStyle: "Sleek, Modern, Minimalist",
        keywords: ["detailing", "car wash", "coating", "gloss", "luxury car"]
    },

    // === HEALTH & BEAUTY ===
    estetica: {
        scene: "Luxurious medical aesthetic clinic, soft sterile white lighting, marble counter",
        elements: "modern aesthetic equipment, orchids, white towels, serene atmosphere",
        colors: ["#ffffff", "#d4af37", "#f8f9fa"], // White, Gold, Off-white
        mood: "Sophisticated, Clean, Peaceful, Beauty",
        textStyle: "Elegant, Thin, Serif or Sans-serif, Gold or Rose Gold accents",
        keywords: ["beauty clinic", "skincare", "botox", "spa", "treatment"]
    },
    salao_beleza: {
        scene: "Chic beauty salon interior, large mirrors with ring lights",
        elements: "hair styling chair, professional hair products, scissors, modern decor",
        colors: ["#000000", "#ff69b4", "#ffffff"], // Black, Hot Pink (subtle), White
        mood: "Glamorous, Trendy, Welcoming",
        textStyle: "Stylish, Fashionable, Modern Script or Bold Sans",
        keywords: ["hair salon", "beauty", "haircut", "styling"]
    },
    barbearia: {
        scene: "Vintage industrial barbershop, brick walls, leather chairs",
        elements: "classic barber chair, straight razor, warm edison bulb lighting, wood accents",
        colors: ["#2b2b2b", "#8b4513", "#ffffff"], // Dark Grey, Leather Brown, White
        mood: "Masculine, Vintage, Classic, Rough",
        textStyle: "Vintage, slab-serif, Western style, Bold",
        keywords: ["barbershop", "beard", "men's grooming", "vintage"]
    },
    manicure: {
        scene: "Close up of a manicured hand holding a polish bottle, soft bokeh background",
        elements: "nail polish bottles, nail tools, flowers, soft lighting",
        colors: ["#ffe4e1", "#ff007f", "#ffffff"], // Misty Rose, Pink, White
        mood: "Feminine, Delicate, Colorful",
        textStyle: "Playful, Curvy, Script or Soft Sans",
        keywords: ["nails", "manicure", "nail polish", "pedicure"]
    },

    // === FOOD & DRINK ===
    restaurante: {
        scene: "Warm, inviting restaurant atmosphere, beautifully plated food in foreground",
        elements: "gourmet dish, wine glass, candle light, blurred restaurant background",
        colors: ["#2c3e50", "#e74c3c", "#f1c40f"], // Dark Blue, Red, Gold
        mood: "Appetizing, Warm, Gourmet, Delicious",
        textStyle: "Elegant, Classic, Readable",
        keywords: ["restaurant", "dining", "food", "gourmet", "chef"]
    },
    pizzaria: {
        scene: "Rustic wooden table, fresh hot pizza with melting cheese pulling",
        elements: "pizza cutter, fresh basil, flour dusting, brick oven background",
        colors: ["#8b0000", "#ffcc00", "#ffffff"], // Dark Red, Cheese Yellow, White
        mood: "Mouth-watering, Rustic, Italian, Hot",
        textStyle: "Fun, Bold, Italian-style, Red/Green accents",
        keywords: ["pizza", "italian food", "cheese", "pepperoni"]
    },
    hamburgueria: {
        scene: "Dark wood table, massive gourmet burger with fresh ingredients",
        elements: "fries, soda, rustic wooden board, dark moody lighting",
        colors: ["#1a1a1a", "#ff9900", "#ffffff"], // Black, Burger Orange, White
        mood: "Juicy, Bold, Modern, Tasty",
        textStyle: "Grunge, Bold, Impactful, Street Food style",
        keywords: ["burger", "fast food", "fries", "american food"]
    },
    confeitaria: {
        scene: "Bright pastry display case, beautiful cakes and sweets",
        elements: "cupcakes, chocolate drizzle, fresh berries, pastel colors",
        colors: ["#ffc0cb", "#87ceeb", "#ffffff"], // Pink, Sky Blue, White
        mood: "Sweet, Delightful, Bright, Cute",
        textStyle: "Whimsical, Cursive, Sweet",
        keywords: ["bakery", "cake", "sweets", "dessert", "pastry"]
    },
     acai: {
        scene: "Tropical vibrant setting, fresh acai bowl with fruits",
        elements: "acai bowl, granola, banana, strawberry, splashing liquid",
        colors: ["#4b0082", "#32cd32", "#ffff00"], // Acai Purple, Green, Yellow
        mood: "Fresh, Energetic, Tropical, Healthy",
        textStyle: "Organic, Bold, Fun",
        keywords: ["acai", "smoothie", "tropical", "fruit"]
    },

    // === SERVICES ===
    despachante: {
        scene: "Modern office desk with documents, car license plate, computer",
        elements: "paperwork, pen, calculator, license plate, professional office blurred background",
        colors: ["#003366", "#ffffff", "#cccccc"], // Navy Blue, White, Grey
        mood: "Bureaucratic, Organized, Efficient, Official",
        textStyle: "Corporate, Clean, Serious, Sans-serif",
        keywords: ["office", "documents", "license", "bureaucracy"]
    },
    imobiliaria: {
        scene: "Bright modern living room interior or exterior of luxury house",
        elements: "keys, house model, sunlight, open space",
        colors: ["#0047ab", "#e0e0e0", "#ffffff"], // Cobalt Blue, Grey, White
        mood: "Trustworthy, Aspirational, Bright, Home",
        textStyle: "Classic, Stable, Serif",
        keywords: ["real estate", "house", "home", "property", "keys"]
    },
    advogado: {
        scene: "Law library or modern law office, scales of justice",
        elements: "gavel, books, suit, document signing",
        colors: ["#000000", "#b8860b", "#ffffff"], // Black, Dark Goldenrod, White
        mood: "Serious, Justice, Authority, Professional",
        textStyle: "Traditional, Serif, Roman style",
        keywords: ["lawyer", "justice", "legal", "court"]
    },
    contabilidade: {
        scene: "Close up of calculator, financial graphs on tablet, glasses",
        elements: "charts, calculator, money, laptop",
        colors: ["#155724", "#ffffff", "#85bb65"], // Dark Green, White, Dollar Green
        mood: "Calculated, Growing, Secure, Financial",
        textStyle: "Modern, Numeric, Clean",
        keywords: ["accounting", "finance", "tax", "money"]
    },
    seguros: {
        scene: "Family under an umbrella or holding hands, safety concept",
        elements: "shield icon (subtle), happy family, house protection",
        colors: ["#0056b3", "#ffffff", "#f8f9fa"], // Blue, White
        mood: "Safe, Protected, Assurance, Calm",
        textStyle: "Trustworthy, Rounded Sans",
        keywords: ["insurance", "protection", "safety", "family"]
    },
     solar: {
        scene: "House roof with solar panels, bright sun in blue sky",
        elements: "solar panels, sun visual, green leaves, clean energy concept",
        colors: ["#ff8c00", "#1e90ff", "#ffffff"], // Orange, Blue, White
        mood: "Sustainable, Bright, Tech",
        textStyle: "Modern, Eco-friendly, Clean",
        keywords: ["solar energy", "sun", "panels", "renewable", "green"]
    },

    // === FITNESS & RECREATION ===
    academia: {
        scene: "Modern gym interior, weights, cardio machines",
        elements: "dumbbells, treadmill, energetic lighting, sweat",
        colors: ["#000000", "#ff0000", "#ffffff"], // Black, Red, White
        mood: "Active, Strong, Energetic, Intense",
        textStyle: "Bold, Italic, Racing style, Impact",
        keywords: ["gym", "fitness", "workout", "muscle"]
    },
    crossfit: {
        scene: "Raw warehouse gym, chalk dust, tires",
        elements: "kettlebells, ropes, heavy lifting, grunge texture",
        colors: ["#333333", "#ffff00", "#000000"], // Dark Grey, Neon Yellow, Black
        mood: "Hardcore, Raw, Industrial",
        textStyle: "Stencil, Distressed, Bold",
        keywords: ["crossfit", "training", "functional", "strength"]
    },
    pilates: {
        scene: "Bright studio with pilates reformer machines, wood floors",
        elements: "yoga mat, balance ball, natural light, plants",
        colors: ["#e0f7fa", "#a8dadc", "#ffffff"], // Cyan tint, Pastel Blue, White
        mood: "Calm, Flexible, Healthy, Zen",
        textStyle: "Thin, Elegant, Clean",
        keywords: ["pilates", "yoga", "stretch", "balance"]
    },

    // === PETS ===
    petshop: {
        scene: "Bright clean pet grooming area or pet store",
        elements: "happy dog, cat, bubbles, pet toys, grooming tools",
        colors: ["#ff99cc", "#00bfff", "#ffffff"], // Pink, Sky Blue, White
        mood: "Playful, Cute, Friendly, Clean",
        textStyle: "Rounded, Bubble font, Fun",
        keywords: ["pet", "dog", "cat", "grooming", "cute"]
    },
    veterinaria: {
        scene: "Modern sterile veterinary clinic, vet holding a puppy",
        elements: "stethoscope, white coat, clean clinic background",
        colors: ["#008080", "#ffffff", "#e0ffff"], // Teal, White, Light Cyan
        mood: "Caring, Professional, Medical, Trust",
        textStyle: "Soft, Professional, Rounded",
        keywords: ["vet", "veterinarian", "animal doctor", "care"]
    },

    // === EVENTS ===
    festas: {
        scene: "Decorated party venue, balloons, confetti",
        elements: "cake, balloons, streamers, bright lights",
        colors: ["#ff00ff", "#00ffff", "#ffff00"], // Magenta, Cyan, Yellow
        mood: "Celebration, Fun, Colorful, Happy",
        textStyle: "Festive, Script, Bold",
        keywords: ["party", "celebration", "birthday", "event"]
    },
    casamento: {
        scene: "Elegant wedding setup, floral arrangements",
        elements: "flowers, rings, lace, soft lighting, white dress fabric",
        colors: ["#fffdd0", "#d4af37", "#ffb6c1"], // Cream, Gold, Light Pink
        mood: "Romantic, Elegant, Soft, Dreamy",
        textStyle: "Calligraphy, Script, Formal",
        keywords: ["wedding", "bride", "marriage", "love"]
    },

    // FALLBACK
    profissional: {
        scene: "Modern professional office workspace or abstract business background",
        elements: "laptop, notebook, glasses, clean desk",
        colors: ["#000000", "#ffffff", "#808080"], // Black, White, Grey
        mood: "Professional, Minimalist, Corporate",
        textStyle: "Clean, Sans-serif, Neutral",
        keywords: ["business", "office", "professional", "work"]
    }
};

module.exports = { NICHE_PROMPTS };
