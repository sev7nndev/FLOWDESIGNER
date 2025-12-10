// 1.5 Enhance Prompt with AI - USING REST API
app.post('/api/enhance-prompt', async (req, res) => {
    try {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Não autorizado' });

        const { prompt } = req.body;
        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({ error: 'Prompt vazio' });
        }

        console.log('🎨 Enhancing prompt for user:', user.id);

        // Use Gemini REST API directly (library @google/generative-ai v0.24.1 has 404 bug)
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const enhancePrompt = "Melhore este texto de marketing em português brasileiro, adicionando detalhes visuais profissionais: " + prompt;

        console.log('📝 Calling Gemini REST API...');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: enhancePrompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Gemini API error:', response.status, errorText);
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const enhancedPrompt = data.candidates[0].content.parts[0].text.trim();

        console.log('✅ Prompt enhanced successfully:', enhancedPrompt.substring(0, 50));

        res.json({ enhancedPrompt });

    } catch (error) {
        console.error('❌ Enhance prompt error:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            errorDetails: error.errorDetails
        });
        res.status(500).json({
            error: 'Erro ao melhorar prompt',
            details: error.message
        });
    }
});
