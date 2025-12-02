import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função auxiliar para verificar se o usuário é 'owner'
async function isOwner(supabaseService: any, userId: string): Promise<boolean> {
  const { data: profile, error } = await supabaseService
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
    
  return !error && profile?.role === 'owner';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 1. Autenticação Manual
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders
    })
  }

  const token = authHeader.replace('Bearer ', '')
  try {
    // 2. Inicializa o cliente Supabase com Service Role Key (para acesso total)
    // FIX: createClient expects only two arguments when using the service role key in Deno environment
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Obtém o usuário autenticado
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 403,
        headers: corsHeaders
      })
    }

    // 4. Verifica se o usuário é 'owner'
    if (!(await isOwner(supabaseService, user.id))) {
      return new Response(JSON.stringify({ error: 'Access Denied: Not an owner' }), {
        status: 403,
        headers: corsHeaders
      })
    }

    // 5. Lógica de Negócio: Buscar Métricas
    // A. Contagem de usuários por plano (role) - Usando count() no select
    const { data: planCounts, error: planError } = await supabaseService
      .from('profiles_with_email') // Usando a VIEW
      .select('role, count', { count: 'exact', head: false })
      .in('role', ['free', 'starter', 'pro']); // Filtrando apenas planos de cliente

    if (planError) throw planError;

    const countsByPlan = (planCounts as any[]).reduce((acc: Record<string, number>, item: any) => {
      acc[item.role] = item.count;
      return acc;
    }, { free: 0, starter: 0, pro: 0 });

    // B. Contagem de usuários por status
    const { data: statusCounts, error: statusError } = await supabaseService
      .from('profiles_with_email') // Usando a VIEW
      .select('status, count', { count: 'exact', head: false })
      .in('role', ['free', 'starter', 'pro']); // Filtrando apenas planos de cliente

    if (statusError) throw statusError;

    const countsByStatus = (statusCounts as any[]).reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = item.count;
      return acc;
    }, { on: 0, paused: 0, cancelled: 0 });

    // C. Lista de Clientes (Nome, Email, Plano, Status)
    const { data: clients, error: clientsError } = await supabaseService
      .from('profiles_with_email') // Usando a VIEW
      .select('id, first_name, last_name, email, role, status')
      .in('role', ['free', 'starter', 'pro']) // Filtrando apenas planos de cliente
      .order('created_at', { ascending: false });

    if (clientsError) throw clientsError;

    const clientList = clients.map(client => ({
      id: client.id,
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A',
      email: client.email || 'N/A',
      plan: client.role,
      status: client.status,
    }));

    return new Response(JSON.stringify({
      planCounts: countsByPlan,
      statusCounts: countsByStatus,
      clients: clientList,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) { // Cast error to any
    console.error("Edge Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})