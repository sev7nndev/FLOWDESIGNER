const axios = require('axios');

const generate = async (name, payload) => {
    console.log(`\n-----------------------------------`);
    console.log(`😈 CHAOS TEST: ${name}`);
    console.log(`-----------------------------------`);
    try {
        const start = Date.now();
        const response = await axios.post('http://localhost:3001/api/generate', {
            promptInfo: payload,
            artStyle: "Photorealistic"
        }, {
            headers: {
                'x-bypass-auth': 'testing-secret-123',
                'Content-Type': 'application/json'
            },
            timeout: 120000
        });

        const duration = ((Date.now() - start) / 1000).toFixed(1);
        if (response.data.image) {
            console.log(`✅ SURVIVED in ${duration}s`);
            console.log(`🖼️  Image ID: ${response.data.image.id || 'mock-id'}`);
        }
    } catch (error) {
        console.error(`❌ FAILED: ${error.response?.data?.error || error.message}`);
        if (error.response?.data?.details) {
            console.error('Details:', JSON.stringify(error.response.data.details, null, 2));
        }
    }
};

const runChaos = async () => {
    // 1. The Novelist (Excessive Text)
    // Goal: Verify if Director shortens it or Critic rejects text cutoff
    await generate("The Novelist (High Risk of Cutoff)", {
        companyName: "The Super Duper Extremely Long Company Name That Definitely Will Not Fit On A Standard Flyer Limitada S.A.",
        details: "We sell tiny things with big names.",
        addressStreet: "Verbose Lane",
        addressNumber: "1000",
        addressNeighborhood: "Longwinded",
        addressCity: "Textville",
        phone: "(11) 99999-9999"
    });

    // 2. The Camouflage (Contrast Attack)
    // Goal: Verify if Critic or Director enforces visibility rules
    await generate("The Camouflage (Contrast Attack)", {
        companyName: "White Ghosts",
        details: "White text on a snow white background. Make it invisible.",
        addressStreet: "Hidden Rd",
        addressNumber: "0",
        addressNeighborhood: "Void",
        addressCity: "Nowhere",
        phone: "(11) 00000-0000"
    });

    // 3. The Gibberish (Nonsense)
    // Goal: Verify Director hallucination resistance
    await generate("The Gibberish", {
        companyName: "Xae12-;;@@!!",
        details: "lorem ipsum dolor sit amet",
        addressStreet: "???",
        addressNumber: "0",
        addressNeighborhood: "???",
        addressCity: "???",
        phone: "???"
    });

    // 4. The Black Hole (Data Overload)
    // Goal: Test DoS protection and payload limits
    const hugeString = "A".repeat(1024 * 1024); // 1MB String
    await generate("The Black Hole (1MB Payload)", {
        companyName: "Black Hole Corp " + hugeString.substring(0, 100) + "...", // Truncated for log
        details: hugeString,
        addressStreet: "Infinity Loop",
        addressNumber: "∞",
        addressNeighborhood: "Event Horizon",
        addressCity: "Singularity",
        phone: "000"
    });

    // 5. The Glitch (Corrupt Types)
    // Goal: Test JSON validation
    await generate("The Glitch (Type Mismatch)", {
        companyName: 12345, // Number instead of string
        details: ["Array", "Instead", "Of", "String"],
        addressStreet: null,
        addressNumber: undefined,
        addressNeighborhood: {},
        addressCity: true,
        phone: 999
    });
};

runChaos();
