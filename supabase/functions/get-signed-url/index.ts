import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const ALLOWED_ORIGINS = [
  'http://localhost:3000', 
  'https://ai.studio', // Domínio de desenvolvimento/produção
];

serve(async (req) => {
  const origin = req.headers.get('Origin');
  
  // Determine the allowed origin to reflect back
  let allowedOrigin = ALLOWED_ORIGINS[1]; // Default to production domain
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
      allowedOrigin = origin;
  }
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  try {
    const { path } = await req.json()
    
    if (!path) {
      return new Response(JSON.stringify({ error: 'Missing file path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // 2. Security Check: Ensure the path belongs to the user (e.g., 'images/user_id/...')
    // This is a crucial security measure to prevent users from generating signed URLs for files they don't own.
    const expectedPathPrefix = `images/${user.id}/`;
    
    // Check if the path starts with the user's ID prefix OR if it's a landing carousel image (which is public/admin managed)
    const isUserImage = path.startsWith(expectedPathPrefix);
    const isLandingImage = path.startsWith('landing-carousel/');
    
    if (!isUserImage && !isLandingImage) {
        return new Response(JSON.stringify({ error: 'Access denied: Path does not belong to user.' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // 3. Generate signed URL
    const bucketName = isLandingImage ? 'landing-carousel' : 'images';
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, 60 * 5) // 5 minutes expiration

    if (error) {
      console.error("Error creating signed URL:", error.message);
      return new Response(JSON.stringify({ error: 'Failed to create signed URL.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})