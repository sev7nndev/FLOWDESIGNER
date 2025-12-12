class Imagen4Service {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.url = https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImage?key=${this.apiKey};
    }

    buildPrompt(form) {
        return `
Crie uma arte profissional em português do Brasil usando os seguintes dados inseridos pelo usuário:

--- IDENTIDADE ---
Nome da empresa: ${form.companyName}
Descrição: ${form.details}

--- ENDEREÇO ---
Rua: ${form.addressStreet}, ${form.addressNumber}
Bairro: ${form.addressNeighborhood}
Cidade: ${form.addressCity}

--- CONTATO ---
WhatsApp: ${form.phone}
Email: ${form.email || "não informado"}
Instagram: ${form.instagram || "não informado"}
Facebook: ${form.facebook || "não informado"}
Site: ${form.website || "não informado"}

--- INSTRUÇÕES OBRIGATÓRIAS ---
1. Todo o texto da imagem deve estar em PORTUGUÊS DO BRASIL.
2. NÃO usar inglês, NÃO usar espanhol.
3. NÃO criar frases aleatórias.
4. Escrever o texto exatamente como um designer faria.
5. Arte limpa, nítida e com tipografia legível.
6. Sem distorção, sem letras quebradas, sem ruído.
7. Layout profissional estilo flyer comercial vertical.

Gere uma arte moderna, com composição organizada e de alta qualidade visual.
        `;
    }

    async generateBackground(form, aspectRatio = "9:16") {
        try {
            console.log("🚀 Generating with Imagen 4 (Correct API)");

            const finalPrompt = this.buildPrompt(form);

            const body = {
                prompt: { text: finalPrompt },
                negativePrompt: {
                    text: `
texto distorcido, inglês, espanhol, blur, low quality,
palavras quebradas, letras erradas,
fontes caricatas, efeitos irreais, ruído, manchas
                    `
                },
                image: { aspectRatio }
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