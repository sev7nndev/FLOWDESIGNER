import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Headers CORS para permitir que seu site chame esta função
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Lida com a requisição de "pre-flight" do CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTENTICAÇÃO ---
    // Cria um cliente Supabase com o contexto de autenticação do usuário que chamou a função.
    // Isso garante que as políticas de segurança (RLS) sejam aplicadas.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Pega os dados do usuário autenticado
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // --- VALIDAÇÃO DOS DADOS DE ENTRADA ---
    const body = await req.json();
    const { companyName, details } = body;

    if (!companyName || !details) {
      return new Response(JSON.stringify({ error: 'Nome da empresa e detalhes são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- LÓGICA DE GERAÇÃO (EXEMPLO) ---
    // Esta é uma simulação. A lógica real de geração de imagem com IA deve ser inserida aqui.
    // Por enquanto, vamos simular um atraso e retornar uma URL de imagem de exemplo.
    // Isso confirma que todo o fluxo de requisição/resposta está funcionando.
    
    // Simula um atraso de 5 segundos para imitar o tempo de processamento da IA
    await new Promise(resolve => setTimeout(resolve, 5000));

    const placeholderImageUrl = `https://via.placeholder.com/1024x1024.png/8B5CF6/FFFFFF?text=Arte+para+${encodeURIComponent(companyName)}`;

    // --- SALVAR NO BANCO DE DADOS ---
    // É uma boa prática salvar a URL da imagem gerada no banco de dados
    const { error: dbError } = await supabaseClient
      .from('images')
      .insert({
        user_id: user.id,
        prompt: details,
        image_url: placeholderImageUrl,
        business_info: body, // Salva todos os dados do formulário
      });

    if (dbError) {
      console.error('Erro no banco de dados:', dbError);
      // Não bloqueie o usuário se a gravação no banco de dados falhar, mas registre o erro.
    }

    // --- RESPOSTA DE SUCESSO ---
    return new Response(JSON.stringify({ imageUrl: placeholderImageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});