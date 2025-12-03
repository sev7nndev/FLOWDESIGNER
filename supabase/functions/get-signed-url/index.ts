import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Restringir a origem para o domínio do seu aplicativo em produção
// Para fins de desenvolvimento, mantemos '*' mas é crucial restringir em produção.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Mudar para o domínio de produção (ex: 'https://flowdesigner.com')
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ... (rest of the file)