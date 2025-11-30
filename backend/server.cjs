// ... existing imports and setup ...

    // Service Role Client (High Privilege)
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Anon Client (Low Privilege - for JWT verification)
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { // Corrected SUPAPASE_URL to SUPABASE_URL
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ... existing middleware and helper functions ...

    app.post('/api/generate', authenticateToken, generationLimiter, async (req, res, next) => {
      const { promptInfo } = req.body;
      const user = req.user;

      if (!promptInfo) {
        return res.status(400).json({ error: "Corpo da requisição inválido: objeto 'promptInfo' ausente." });
      }

      // ... existing input validation and sanitization ...

      try {
        // Check user role and generation count
        const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${user.token}` } }
        });
        const { data: profile, error: profileError } = await supabaseAuth.from('profiles').select('role, generations_count').eq('id', user.id).single();
        if (profileError) throw new Error(`Acesso negado ou perfil não encontrado no Supabase: ${profileError.message}. Verifique a configuração do Supabase.`);
        
        const userRole = profile?.role || 'free';
        const generationsCount = profile?.generations_count || 0;

        if (userRole === 'free' && generationsCount >= 3) {
          return res.status(403).json({ error: 'Você atingiu o limite de 3 gerações gratuitas. Faça upgrade para um plano pago para continuar gerando artes.' });
        }
        
        if (!['admin', 'pro', 'dev', 'free'].includes(userRole)) {
          return res.status(403).json({ error: 'Acesso negado. A geração de arte requer um plano Pro.' });
        }
        
        // --- REAL AI GENERATION FLOW ---
        console.log(`[${user.id}] Step 1: Generating detailed prompt for user ${user.email}...`);
        const detailedPrompt = await generateDetailedPrompt(sanitizedPromptInfo.details);
        console.log(`[${user.id}] Step 1 Complete. Detailed prompt (first 100 chars): ${detailedPrompt.substring(0, 100)}...`);

        console.log(`[${user.id}] Step 2: Generating image with Freepik...`);
        const generatedImageUrl = await generateImage(detailedPrompt);
        console.log(`[${user.id}] Step 2 Complete. Generated URL: ${generatedImageUrl}`);

        console.log(`[${user.id}] Step 3: Uploading image to Supabase for user ${user.id}...`);
        const imagePath = await uploadImageToSupabase(generatedImageUrl, user.id);
        console.log(`[${user.id}] Step 3 Complete. Supabase path: ${imagePath}`);

        console.log(`[${user.id}] Step 4: Saving record to database for user ${user.id}...`);
        const { data: image, error: dbError } = await supabaseService
          .from('images')
          .insert({
            user_id: user.id,
            prompt: detailedPrompt,
            image_url: imagePath, // Store the path, not the public URL
            business_info: sanitizedPromptInfo,
          })
          .select()
          .single();

        if (dbError) {
          console.error(`[${user.id}] DB Insert Error:`, dbError);
          const errorMessage = dbError.message || 'Erro desconhecido ao inserir no banco de dados Supabase.';
          return res.status(500).json({ error: `Erro ao salvar a imagem no banco de dados Supabase: ${errorMessage}. Verifique a tabela 'images' e suas permissões.` });
        }
        console.log(`[${user.id}] Step 4 Complete. Image ID: ${image.id}`);

        // Increment generations_count for free users
        if (userRole === 'free') {
            const { error: updateError } = await supabaseService
                .from('profiles')
                .update({ generations_count: generationsCount + 1 })
                .eq('id', user.id);
            if (updateError) {
                console.error(`[${user.id}] Error incrementing generations_count:`, updateError);
                // This is a non-critical error, but should be logged.
            }
        }

        res.json({ 
          message: 'Arte gerada com sucesso!',
          image: image
        });

      } catch (error) {
        // Pass the error to the global error handler
        next(error);
      }
    });

    // ... rest of the backend code ...