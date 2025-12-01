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
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  const token = authHeader.replace('Bearer ', '')

  try {
    // 2. Inicializa o cliente Supabase com Service Role Key (para acesso total)
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )
    
    // 3. Obtém o usuário autenticado
    const { data: { user }, error: userError } = await supabaseService.auth.getUser(token);
    if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 403, headers: corsHeaders })
    }
    
    // 4. Verifica se o usuário é 'owner'
    if (!(await isOwner(supabaseService, user.id))) {
        return new Response(JSON.stringify({ error: 'Access Denied: Not an owner' }), { status: 403, headers: corsHeaders })
    }

    // 5. Lógica de Negócio: Buscar Métricas
    
    // A. Contagem de usuários por plano (role)
    const { data: planCounts, error: planError } = await supabaseService
        .from('profiles')
        .select('role, count')
        .not('role', 'in', '("admin", "dev", "owner")') // Exclui roles de gestão
        .rollup();

    if (planError) throw planError;
    
    const countsByPlan = planCounts.reduce((acc: Record<string, number>, item: any) => {
        acc[item.role] = item.count;
        return acc;
    }, { free: 0, starter: 0, pro: 0 }); // Inicializa para garantir que todos os planos apareçam

    // B. Contagem de usuários por status
    const { data: statusCounts, error: statusError } = await supabaseService
        .from('profiles')
        .select('status, count')
        .not('role', 'in', '("admin", "dev", "owner")')
        .rollup();
        
    if (statusError) throw statusError;
    
    const countsByStatus = statusCounts.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item.count;
        return acc;
    }, { on: 0, paused: 0, cancelled: 0 });

    // C. Lista de Clientes (Nome, Email, Plano, Status)
    const { data: clients, error: clientsError } = await supabaseService
        .from('profiles')
        .select('first_name, last_name, role, status, id, auth_user:id(email)')
        .not('role', 'in', '("admin", "dev", "owner")')
        .order('created_at', { ascending: false });
        
    if (clientsError) throw clientsError;
    
    const clientList = clients.map(client => ({
        id: client.id,
        name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'N/A',
        email: client.auth_user?.email || 'N/A',
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

  } catch (error) {
    console.error("Edge Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})