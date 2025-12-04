// --- HELPER FUNC: UNIVERSAL PROMPT (VISUAL MEMORY V5 - REFERENCE MATCHING) ---
function gerarPromptUniversal(dados) {
    const textRules = [];

    // 1. Data Integrity & Content Blocks
    if (dados.nomeEmpresa) textRules.push(`- MAIN HEADLINE: "${dados.nomeEmpresa}" (Typography: Massive, Bold, Sans-Serif, Integrated into the design header)`);

    // Footer / Contact Strip
    const contactInfo = [];
    if (dados.whatsapp) contactInfo.push(`WhatsApp ${dados.whatsapp}`);
    if (dados.instagram) contactInfo.push(`${dados.instagram}`);
    if (dados.rua) contactInfo.push(`${dados.rua}`);

    if (contactInfo.length > 0) {
        // Reference Style: Solid contrasting strip at bottom (Seen in Uber/Nail examples)
        textRules.push(`- FOOTER INFO: A dedicated solid color strip at the very bottom containing: "${contactInfo.join('  •  ')}" (High contrast text).`);
    }

    // Price/Offer Badges (Seen in Nail/Uber examples)
    const priceMatch = dados.briefing?.match(/(?:R\$|brl)\s?[\d,.]+/i);
    if (priceMatch) {
        textRules.push(`- PRICE BADGE: A distinct graphical sticker or bubble element containing "${priceMatch[0]}" (Make it pop with drop shadow).`);
    }

    const briefing = dados.briefing || `Promotional flyer for ${dados.nomeEmpresa}`;
    const combinedText = (briefing + " " + (dados.nomeEmpresa || '')).toLowerCase();

    // 2. VISUAL MEMORY BANK (Based on User Uploaded References)
    // We map niches to the EXACT style of the photos provided.

    let visualArchetype = "";

    // ARCHETYPE A: TRANSPORT / DRIVER (Ref: Uber Bananal)
    // Style: Blue gradient, Phone Mockup, Car Cutout, Icons.
    if (combinedText.match(/uber|taxi|motorista|viagem|transporte|carro|passageiro/)) {
        visualArchetype = `
        **STYLE REFERENCE: MODERN APP TRANSPORT**
        - **Background**: Electric Blue to Dark Blue gradient. Tech/Abstract geometric shapes in background.
        - **Main Composition**: A high-quality cutout of a modern silver/white car on the right. A generous smartphone mockup on the left showing a map/app interface.
        - **Graphics**: Use 'Location Pin' icons and 'Shield' icons to imply safety.
        - **Typography**: Tall, condensed white sans-serif fonts for the title.
        - **Vibe**: Trust, Speed, Modernity.
      `;
    }
    // ARCHETYPE B: BEAUTY / NAILS (Ref: Manicure, Nail Bar)
    // Style: Pink/Magenta/Black, Circles, Hands, Elegant.
    else if (combinedText.match(/unha|nail|manicure|pedicure|beleza|estética|sobrancelha/)) {
        visualArchetype = `
        **STYLE REFERENCE: ELEGANT BEAUTY SALON**
        - **Background**: Option 1: Clean White/Soft Pink with curved magenta abstract shapes (Wave). Option 2: Chic Black background with Rose Gold accents.
        - **Main Composition**: Closeup macro photography of perfect fingernails or hands, framed inside Circular or Organic masks (Borders).
        - **Graphics**: Delicate floral vectors or sparkles.
        - **Typography**: Mix of Bold Sans-Serif for headers and Elegant Script for accent words (e.g., "Beleza").
        - **Vibe**: Feminine, Premium, Clean, Professional.
      `;
    }
    // ARCHETYPE C: SPORTS / EVENTS (Ref: Flamengo, Gremio)
    // Style: Grunge, Red/Black, Smoke, Lightning, Cutouts.
    else if (combinedText.match(/futebol|jogo|partida|lanche|burger|hamburguer|pizza/)) { // Mixing Food here as it fits the 'Event' high energy vibe often
        visualArchetype = `
        **STYLE REFERENCE: HIGH ENERGY / GRUNGE POSTER**
        - **Background**: Dark, intense texture (Asphalt, smoke, red lighting, lightning bolts).
        - **Main Composition**: Subject (Burger or Player) is a central CUTOUT with "Out of Bounds" effect (popping out of a frame).
        - **Graphics**: Torn paper edges, "Police Tape" style banners, glowing flares behind the subject.
        - **Typography**: Aggressive, slanted, distressed fonts or shiny metallic 3D text.
        - **Vibe**: Excitement, Action, Impact.
      `;
    }
    // ARCHETYPE D: GENERIC COMMERCIAL (Fallback ensuring 'Design' not just 'Photo')
    else {
        visualArchetype = `
        **STYLE REFERENCE: UNIVERSAL COMMERCIAL DESIGN**
        - **Background**: Professional textured background (Abstract geometry or clean gradient). NOT a real-world messy background.
        - **Main Composition**: Studio lighting product/service shot, isolated or neatly framed.
        - **Graphics**: Clean lines, dividing bars, checkmarks for lists.
        - **Typography**: Corporate, trustworthy, legible.
        - **Vibe**: Service-oriented, Organized, trustworthy.
      `;
    }

    // 3. The Instruction
    return `
    ACT AS AN ELITE SENIOR GRAPHIC DESIGNER specialized in Commercial Social Media Art.
    
    **YOUR MISSION:**
    Replicate the visual style described in the **VISUAL ARCHETYPE** below. 
    Do not create a plain photograph. Create a **DIGITAL COMPOSITE DESIGN** (Flyer/Banner).

    **INPUT DATA:**
    - Brand: ${dados.nomeEmpresa}
    - Context: "${briefing}"
    - **MANDATORY TEXT ELEMENTS (Non-negotiable):**
    ${textRules.join('\n    ')}

    ${visualArchetype}

    **DESIGN EXECUTION RULES:**
    1. **Layout**: Always enforce a clear hierarchy. Header (Top) -> Visual (Middle) -> Footer (Bottom).
    2. **Text Legibility**: Use strokes, drop shadows, or solid backplates behind text to ensure 100% readability on complex backgrounds.
    3. **Portuguese-BR**: Ensure all generated text (even dummy text if needed, though avoid it) looks like Portuguese.
    4. **No Distortion**: Hands/Cars/Faces must be anatomically/structurally perfect (8k render quality).

    **OUTPUT FORMAT (JSON):**
    {
      "prompt": "A professional social media flyer design for ${dados.nomeEmpresa}. [Insert the specific Style Reference description here]. \n\nCOMPOSITION:\n- [Detailed Layout Instructions based on Archetype]\n- [Text Placement Rules]\n\n(Masterpiece, 8k, Commercial Art, Perfect Text Spelling)."
    }
  `;
}
