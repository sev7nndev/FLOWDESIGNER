import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client for the Edge Function environment
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Manual Authentication Handling
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  // Get user claims from the JWT token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Forbidden: Invalid or expired token' }), { 
      status: 403, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  // 2. Parse Request Body
  let filePath: string;
  try {
    const { path } = await req.json()
    if (!path || typeof path !== 'string') {
        throw new Error("Missing or invalid 'path' in request body.")
    }
    filePath = path;
  } catch (e: any) { // Explicitly typing 'e' as 'any' to access 'e.message'
    return new Response(JSON.stringify({ error: e.message || 'Invalid request body' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  // 3. Server-Side Path Validation (CRITICAL SECURITY CHECK)
  // The path must start with the authenticated user's ID to prevent IDOR.
  const expectedPrefix = `${user.id}/`;
  if (!filePath.startsWith(expectedPrefix)) {
    console.warn(`Security Alert: User ${user.id} attempted to access path: ${filePath}`);
    return new Response(JSON.stringify({ error: 'Access denied: Path validation failed.' }), { 
      status: 403, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // 4. Generate Signed URL (using the Service Role Key implicitly via the Edge Function environment)
  try {
    // Note: Edge functions use the Service Role Key for storage operations by default, 
    // but we still enforce user ownership via path validation (Step 3).
    const { data, error } = await supabase.storage
        .from('generated-arts')
        .createSignedUrl(filePath, 60); // Valid for 60 seconds

    if (error) {
        console.error("Supabase Storage Error:", error);
        return new Response(JSON.stringify({ error: 'Failed to generate signed URL.' }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    console.error("Internal Server Error:", e);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})