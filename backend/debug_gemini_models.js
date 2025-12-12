
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listModels() {
    console.log("🧪 Listing Available Gemini Models...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) return console.error("No Key");

    const genAI = new GoogleGenerativeAI(key);
    // Use the model management API if exposed or try a known older model to check access
    // Unfortunately SDK doesn't always expose listModels directly easily in all versions, 
    // but we can try to infer or just test 'gemini-pro'.
    
    // Testing common variants
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-pro",
        "gemini-1.5-pro-001",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    for (const m of models) {
        process.stdout.write(`Testing ${m}... `);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("Hi");
            console.log("✅ OK");
        } catch (e) {
            console.log("❌ " + e.message.split(' ')[0]); // Log first word of error (404, 400, etc)
        }
    }
}

listModels();
