const { GoogleGenerativeAI } = require('@google/generative-ai');
const fontManager = require('./fontManager.cjs');

// Initialize GenAI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeImageLayoutV2({ imageBase64, data }) {
    try {
        console.log("🧠 TextEngineV2: Analyzing layout with Gemini 1.5 Flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You now act as a PREMIUM BRAZILIAN GRAPHIC DESIGNER.
        Your task: Create the PERFECT TEXT LAYOUT for this image. Do not generate an image, just the layout plan.

        CLIENT DATA (Auto-pulled from App):
        - NAME: "${data.companyName}"
        - PHONE: "${data.whatsapp}"
        - ADDRESS: "${data.addressStreet} ${data.addressNumber || ''}"
        - SOCIAL: "${data.instagram}"
        - OFFER: "${data.slogan || ''}"
        - DESC: "${data.email || ''} ${data.site || ''}"

        CREATIVE INSTRUCTIONS:
        Create a HIGHLY PROFESSIONAL text layout. NO SPELLING ERRORS. NO BLUR.
        
        DELIVERABLES (JSON):
        1) Main Headline (Short & Strong)
        2) Subheadline
        3) Call to Action
        4) Contact Fields (Correctly Formatted)
        5) Font Suggestions (Typography)
        6) Font Sizes
        7) EXACT Position (x, y) for each element

        LANGUAGE: Portuguese (Brazil).

        CRITICAL RULES:
        1. **DATA INTEGRITY**: If the client provided a phone, address, or name, it MUST appear in the layout. DO NOT SKIP ANY DATA.
        2. **VISUAL HIERARCHY**: 
           - Headline: Massive, distinct font, top or center.
           - Contact Info: Readable, grouped (usually bottom), high contrast.
        3. **PROFESSIONAL STYLES**:
           - Use 'stroke' properties for text on busy backgrounds.
           - Use 'backgroundColor' (box behind text) if legibility is hard.
           - Use 'textShadow' for depth.

        RESPONSE FORMAT (Direct JSON Only):
        {
          "layout": [
            {
              "type": "string (headline|subhead|contact|info)",
              "text": "string (EXACT text from client data)",
              "x": number (0-100 % from left),
              "y": number (0-100 % from top),
              "fontSize": number (scales with image, e.g., 60 for headline, 25 for contact),
              "fontFamily": "string (Impact, Arial Black, Roboto, Brush Script MT, Courier New)",
              "color": "hex string",
              "align": "string (left|center|right)",
              "fontWeight": "string (bold|normal|900)",
              "textShadow": "string (e.g., '4px 4px 0px #000000' or '0px 0px 20px #FF00FF')",
              "strokeColor": "hex string (optional, for outline)",
              "strokeWidth": number (optional, e.g., 2-5)",
              "backgroundColor": "hex string (optional, for box behind text)",
              "padding": number (optional, padding for background box),
              "rotation": number (degrees),
              "maxWidth": number (pixels)
            }
          ],
          "analysis": "Brief design rationale"
        }
        `;

        const imagePart = {
            inlineData: {
                data: imageBase64.split(',')[1] || imageBase64,
                mimeType: "image/png"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        // Clean JSON
        const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const layoutData = JSON.parse(jsonString);

        return { layout: layoutData.layout, analysis: layoutData.analysis };

    } catch (error) {
        console.error("❌ TextEngineV2 Failed:", error);
        return createFallbackLayout(data);
    }
}

function createFallbackLayout(data) {
    // Robust Default Layout
    const layout = [
        data.companyName && {
            type: 'headline', text: data.companyName, x: 50, y: 15, fontSize: 60, color: '#FFFFFF', align: 'center', strokeColor: '#000000', strokeWidth: 4
        },
        data.whatsapp && {
            type: 'contact', text: `WhatsApp: ${data.whatsapp}`, x: 50, y: 85, fontSize: 30, color: '#FFFFFF', align: 'center', backgroundColor: '#25D366', padding: 10
        },
        data.addressStreet && {
            type: 'address', text: `${data.addressStreet} ${data.addressNumber || ''}`, x: 50, y: 92, fontSize: 24, color: '#FFFFFF', align: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 5
        }
    ].filter(Boolean);

    return { layout, analysis: "Fallback applied (V2)" };
}

module.exports = { analyzeImageLayoutV2 };
