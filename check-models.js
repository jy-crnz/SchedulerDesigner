const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log("🔍 Querying Google API directly for available models...");

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        console.log("\n--- ✅ ACCESSIBLE MODELS FOR YOUR KEY ---");

        data.models.forEach(m => {
            // Filter for models that support 'generateContent' (what we need for the scan)
            if (m.supportedGenerationMethods.includes("generateContent")) {
                // Remove the 'models/' prefix for easier reading
                const shortName = m.name.replace('models/', '');
                console.log(`🚀 ID: ${shortName}`);
                console.log(`   Display: ${m.displayName}`);
                console.log("------------------------------------------");
            }
        });

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        console.log("\n💡 TIP: Check if your API key in .env is correct!");
    }
}

listModels();