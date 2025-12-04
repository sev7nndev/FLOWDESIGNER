const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../backend/server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

// All Missing Endpoints in One Block
const missingEndpoints = `
// ==========================================
// MISSING ENDPOINTS (Admin & Features)
// ==========================================

// 1. GET /api/admin/images - List all images (Admin only)
app.get('/api/admin/images', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch all images (admin can see all)
    const { data, error } = await globalSupabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ images: data || [] });
  } catch (error) {
    console.error('Error fetching admin images:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. DELETE /api/admin/images/:id - Delete any image (Admin only)
app.delete('/api/admin/images/:imageId', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { imageId } = req.params;

    // Delete from database
    const { error } = await globalSupabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin image:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /api/admin/landing-images/upload - Upload landing carousel image
app.post('/api/admin/landing-images/upload', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { fileBase64, fileName } = req.body;

    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: 'Missing file data' });
    }

    // Convert base64 to buffer
    const base64Data = fileBase64.replace(/^data:image\\/\\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const ext = fileName.split('.').pop();
    const uniqueFileName = \`landing-\${timestamp}.\${ext}\`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await globalSupabase
      .storage
      .from('landing-carousel')
      .upload(uniqueFileName, buffer, {
        contentType: \`image/\${ext}\`,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Insert record into database
    const { data: dbData, error: dbError } = await globalSupabase
      .from('landing_carousel_images')
      .insert({
        image_url: uniqueFileName,
        sort_order: 0
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Get public URL
    const { data: { publicUrl } } = globalSupabase
      .storage
      .from('landing-carousel')
      .getPublicUrl(uniqueFileName);

    res.json({
      image: {
        id: dbData.id,
        url: publicUrl,
        sortOrder: dbData.sort_order
      }
    });
  } catch (error) {
    console.error('Error uploading landing image:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE /api/admin/landing-images/:id - Delete landing carousel image
app.delete('/api/admin/landing-images/:id', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { imagePath } = req.body;

    // Delete from storage
    if (imagePath) {
      await globalSupabase
        .storage
        .from('landing-carousel')
        .remove([imagePath]);
    }

    // Delete from database
    const { error } = await globalSupabase
      .from('landing_carousel_images')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting landing image:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. POST /api/enhance-prompt - AI prompt enhancement
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { prompt } = req.body;

    if (!prompt || prompt.length < 5) {
      return res.status(400).json({ error: 'Prompt muito curto' });
    }

    // Use Gemini to enhance the prompt
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const enhancementPrompt = \`Você é um especialista em marketing e design gráfico. 
Melhore o seguinte prompt para geração de flyer, tornando-o mais específico, criativo e eficaz.
Mantenha em português e seja conciso (máximo 200 caracteres).

Prompt original: "\${prompt}"

Prompt melhorado:\`;

    const result = await model.generateContent(enhancementPrompt);
    const enhancedPrompt = result.response.text().trim();

    res.json({ enhancedPrompt });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. POST /api/admin/mp-exchange - Exchange Mercado Pago OAuth code for token
app.post('/api/admin/mp-exchange', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile } = await globalSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'admin', 'dev'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const APP_ID = process.env.MP_APP_ID;
    const CLIENT_SECRET = process.env.MP_CLIENT_SECRET;
    const REDIRECT_URI = process.env.MP_REDIRECT_URI || 'http://localhost:3000/owner-panel';

    if (!APP_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: 'Mercado Pago credentials not configured' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.mercadopago.com/oauth/token', {
      client_id: APP_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });

    const { access_token, refresh_token, user_id } = tokenResponse.data;

    // Save to app_config table
    const { error: configError } = await globalSupabase
      .from('app_config')
      .upsert({
        key: 'mp_access_token',
        value: access_token,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (configError) throw configError;

    // Save refresh token
    await globalSupabase
      .from('app_config')
      .upsert({
        key: 'mp_refresh_token',
        value: refresh_token,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    console.log('✅ Mercado Pago connected successfully for user:', user_id);

    res.json({ success: true, message: 'Mercado Pago conectado com sucesso!' });
  } catch (error) {
    console.error('Error exchanging MP code:', error);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});
`;

// Find insertion point (before Guardian endpoints or health check)
const insertionPoint = /\/\/ ==========================================\n\/\/ GUARDIAN API ENDPOINTS/;

if (!content.includes('GET /api/admin/images')) {
    content = content.replace(insertionPoint, missingEndpoints + "\n" + insertionPoint);
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log("✅ All 6 missing endpoints added successfully!");
    console.log("   - GET /api/admin/images");
    console.log("   - DELETE /api/admin/images/:id");
    console.log("   - POST /api/admin/landing-images/upload");
    console.log("   - DELETE /api/admin/landing-images/:id");
    console.log("   - POST /api/enhance-prompt");
    console.log("   - POST /api/admin/mp-exchange");
} else {
    console.log("⚠️ Endpoints already exist");
}
