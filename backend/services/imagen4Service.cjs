// IMAGEN 4 – CORRIGIDO E OTIMIZADO
const axios = require('axios');

class Imagen4Service {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.url = https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImage?key=${this.apiKey};
    }

    async generateBackground(prompt, aspectRatio = "9:16") {
        try {
            console.log("🚀 Generating with Imagen 4 (Correct API)");

            const body = {
                prompt: {
                    text: `
                    ${prompt}

                    ⚠️ INSTRUÇÕES IMPORTANTES:
                    • Texto totalmente em português do Brasil
                    • Não usar espanhol, nem inglês
                    • Não inventar frases
                    • Manter layout profissional de flyer comercial
                    • Texto super legível, sem distorção
                    • Tipografia limpa, realista e clara
                    `
                },
                negativePrompt: {
                    text: `
                    texto distorcido, inglês, espanhol, blur, low quality,
                    palavras quebradas, letras erradas,
                    fontes caricatas, efeitos irreais, ruído, manchas
                    `
                },
                image: {
                    aspectRatio: aspectRatio
                }
            };

            const response = await axios.post(this.url, body, {
                headers: { "Content-Type": "application/json" },
                timeout: 120000
            });

            const img = response.data?.images?.[0]?.imageBytes;
            if (!img) throw new Error("No image returned from Imagen 4");

            console.log("✅ Imagen 4 OK");
            return img;

        } catch (err) {
            console.error("❌ Imagen 4 Error:", err.response?.data || err);
            return this.fallback();
        }
    }

    fallback() {
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }
}

module.exports = new Imagen4Service();