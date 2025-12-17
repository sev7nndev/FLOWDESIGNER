const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkImages() {
    // 1. Total de imagens
    const { data: images, error } = await supabase
        .from('images')
        .select('id, user_id, created_at')
        .order('created_at', { ascending: false });

    console.log('\n📊 TOTAL DE IMAGENS NO BANCO:', images?.length || 0);
    
    if (images && images.length > 0) {
        console.log('\n📸 Últimas 10 imagens:');
        images.slice(0, 10).forEach((img, i) => {
            console.log(`${i + 1}. User: ${img.user_id.substring(0, 12)}... Data: ${img.created_at}`);
        });
    }

    // 2. Usuários e seus contadores
    const { data: users } = await supabase
        .from('profiles')
        .select('id, email, role');

    console.log('\n👥 USUÁRIOS E CONTADORES:\n');
    
    for (const user of users || []) {
        const { data: usage } = await supabase
            .from('user_usage')
            .select('images_generated')
            .eq('user_id', user.id)
            .single();

        const { data: userImages } = await supabase
            .from('images')
            .select('id')
            .eq('user_id', user.id);

        const counter = usage?.images_generated || 0;
        const saved = userImages?.length || 0;

        console.log(`${user.email} (${user.role})`);
        console.log(`  Contador: ${counter} | Imagens salvas: ${saved} | Diferença: ${counter - saved}\n`);
    }
}

checkImages().then(() => process.exit(0)).catch(console.error);
