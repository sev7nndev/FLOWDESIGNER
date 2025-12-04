const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const key = process.env.GEMINI_API_KEY;

async function list() {
    try {
        console.log('Listing models...');
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const models = res.data.models;
        const imagen = models.filter(m => m.name.includes('imagen'));
        console.log('Imagen Models:');
        imagen.forEach(m => console.log(`- ${m.name} (${m.version})`));
    } catch (e) {
        console.error(e.response?.data || e.message);
    }
}
list();
