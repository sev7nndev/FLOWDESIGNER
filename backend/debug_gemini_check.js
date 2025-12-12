
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testGemini() {
    console.log("🧪 Testing Gemini API Connection...");

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ GEMINI_API_KEY is missing in process.env");
        return;
    }
    console.log(`🔑 Key found (starts with: ${key.substring(0, 4)}...)`);

    const genAI = new GoogleGenerativeAI(key);

    // Test 1: Gemini 1.5 Flash (Stable)
    try {
        console.log("\n[Test 1] Testing gemini-1.5-flash...");
        const model15 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result15 = await model15.generateContent("Hello, are you working?");
        console.log("✅ 1.5 Flash Responded:", result15.response.text());
    } catch (e) {
        console.error("❌ 1.5 Flash Failed:", e.message);
    }

    // Test 2: Gemini 2.0 Flash (Experimental/New)
    try {
        console.log("\n[Test 2] Testing gemini-2.0-flash...");
        const model20 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result20 = await model20.generateContent("Hello, are you working?");
        console.log("✅ 2.0 Flash Responded:", result20.response.text());
    } catch (e) {
        console.error("❌ 2.0 Flash Failed:", e.message);
    }
}

testGemini();
